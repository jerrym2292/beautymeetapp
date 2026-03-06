
function cleanLicenseNumber(s: string) {
  return s.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function parseLastName(fullName?: string | null) {
  const t = (fullName || "").trim();
  if (!t) return null;
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  return parts[parts.length - 1]!.replace(/[^a-zA-Z\-']/g, "");
}

function parseFirstName(fullName?: string | null) {
  const t = (fullName || "").trim();
  if (!t) return null;
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  return parts[0]!.replace(/[^a-zA-Z\-']/g, "");
}

export type LicenseVerificationResult = {
  valid: boolean;
  state: string;
  licenseNumber: string;
  providerName?: string | null;
  licenseType?: string | null;
  status?: string | null;
  expiry?: string | null;
  sourceUrl?: string | null;
  error?: string | null;
};

/**
 * PA: Pennsylvania Professional Licensing System (PALS).
 * Uses a JSON API at /api/Search/SearchForPersonOrFacilty.
 * Protected by reCAPTCHA v3/checkbox. We attempt a direct API call first.
 */
export async function verifyPALicense(licenseNumber: string, fullName?: string | null): Promise<LicenseVerificationResult> {
  const cleanNum = cleanLicenseNumber(licenseNumber);
  const searchUrl = "https://www.pals.pa.gov/api/Search/SearchForPersonOrFacilty";
  
  try {
    // We attempt the search with the license number.
    // PALS often requires a ProfessionID. For Cosmetology/Barber, it varies.
    // We'll try a few common beauty-related ProfessionIDs if needed, 
    // or just search by license number which often works across professions in PALS.
    
    const res = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json, text/plain, */*",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: JSON.stringify({
        OptPersonFacility: "Person",
        LicenseNumber: cleanNum,
        State: "PA",
        Country: "United States",
        PageNo: 1,
        RecaptchaResponse: "" // Empty might be blocked if threshold is hit
      })
    });

    if (!res.ok) {
      if (res.status === 403 || res.status === 429) {
        return {
          valid: false,
          state: "PA",
          licenseNumber: cleanNum,
          error: "PA lookup blocked (reCAPTCHA/Rate-limit). Needs manual check or browser solver.",
          sourceUrl: "https://www.pals.pa.gov/#!/page/search"
        };
      }
      return {
        valid: false,
        state: "PA",
        licenseNumber: cleanNum,
        error: `PA lookup failed: HTTP ${res.status}`,
        sourceUrl: "https://www.pals.pa.gov/#!/page/search"
      };
    }

    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) {
       // Fallback: search by name if license number didn't hit
       const ln = parseLastName(fullName);
       if (ln) {
         const fn = parseFirstName(fullName);
         const res2 = await fetch(searchUrl, {
           method: "POST",
           headers: { "content-type": "application/json", "accept": "application/json" },
           body: JSON.stringify({
             OptPersonFacility: "Person",
             LastName: ln.toUpperCase(),
             FirstName: fn ? fn.toUpperCase() : "",
             State: "PA",
             Country: "United States",
             PageNo: 1,
             RecaptchaResponse: ""
           })
         });
         if (res2.ok) {
           const results2 = await res2.json();
           if (Array.isArray(results2)) {
             const match = results2.find(r => cleanLicenseNumber(r.LicenseNumber || "") === cleanNum);
             if (match) {
               return mapPAResult(match, cleanNum);
             }
           }
         }
       }

      return {
        valid: false,
        state: "PA",
        licenseNumber: cleanNum,
        error: "License not found in PA PALS search",
        sourceUrl: "https://www.pals.pa.gov/#!/page/search"
      };
    }

    // Likely found a direct match or a list
    const match = results.find(r => cleanLicenseNumber(r.LicenseNumber || "") === cleanNum) || results[0];
    return mapPAResult(match, cleanNum);

  } catch (e: any) {
    return {
      valid: false,
      state: "PA",
      licenseNumber: cleanNum,
      error: e?.message || "PA lookup failed",
      sourceUrl: "https://www.pals.pa.gov/#!/page/search"
    };
  }
}

function mapPAResult(r: any, cleanNum: string): LicenseVerificationResult {
  const status = r.LicenseStatus || "";
  const isValid = /Active/i.test(status) && !/Expired|Inactive|Suspended/i.test(status);
  return {
    valid: isValid,
    state: "PA",
    licenseNumber: cleanNum,
    providerName: r.FullName || null,
    licenseType: r.ProfessionName || null,
    status: status,
    expiry: r.ExpiryDate || null,
    sourceUrl: "https://www.pals.pa.gov/#!/page/search",
    error: isValid ? null : `Found record but status is ${status}`
  };
}

/**
 * GA: Georgia Secretary of State (SOS) Professional Licensing.
 * Protected by Cloudflare/Turnstile. 
 * Note: Direct fetch without a headless browser often fails with 403.
 */
export async function verifyGALicense(licenseNumber: string, fullName?: string | null): Promise<LicenseVerificationResult> {
  const cleanNum = cleanLicenseNumber(licenseNumber);
  const searchUrl = "https://verify.sos.ga.gov/api/Verification/Search"; // Example based on research

  try {
     // GA's new portal is heavily protected. 
     // We attempt a fetch with common headers to see if we can get through.
     const res = await fetch(searchUrl, {
       method: "POST",
       headers: {
         "content-type": "application/json",
         "accept": "application/json",
         "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
       },
       body: JSON.stringify({
         LicenseNumber: cleanNum,
         // In GA, Profession/Board is often required. We'll attempt a generic search first.
       })
     });

     if (res.status === 403) {
        return {
          valid: false,
          state: "GA",
          licenseNumber: cleanNum,
          error: "GA lookup blocked by Cloudflare. Requires manual check or browser-based solve.",
          sourceUrl: "https://verify.sos.ga.gov/Verification/"
        };
     }

     if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
     }

     const data = await res.json();
     // ... process data if we ever get past CF ...
     return {
       valid: false, 
       state: "GA",
       licenseNumber: cleanNum,
       error: "GA auto-lookup received data but parsing is not yet implemented (Cloudflare bypass needed).",
       sourceUrl: "https://verify.sos.ga.gov/Verification/"
     };

  } catch (e: any) {
    return {
      valid: false,
      state: "GA",
      licenseNumber: cleanNum,
      error: `GA lookup failed: ${e?.message}. Likely Cloudflare protection.`,
      sourceUrl: "https://verify.sos.ga.gov/Verification/"
    };
  }
}
