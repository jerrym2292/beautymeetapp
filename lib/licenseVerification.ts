import { verifyPALicense } from "./verifyPAGALicense";
import { verifyGALicense, verifyCALicense } from "./verifyScrapfly";

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

function parseLastName(fullName?: string | null) {
  const t = (fullName || "").trim();
  if (!t) return null;
  // crude but effective: last token
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

function cleanLicenseNumber(s: string) {
  return s.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/**
 * NY: Uses data.ny.gov Socrata dataset "Active Appearance Enhancement and Barber Individual Licenses".
 * Endpoint pattern: https://data.ny.gov/resource/ucu3-8265.json?license_number=XXXX
 */
export async function verifyNYLicense(licenseNumber: string): Promise<LicenseVerificationResult> {
  const cleanNum = cleanLicenseNumber(licenseNumber);
  const url = `https://data.ny.gov/resource/ucu3-8265.json?license_number=${encodeURIComponent(cleanNum)}`;

  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) {
      return {
        valid: false,
        state: "NY",
        licenseNumber: cleanNum,
        error: `NY lookup failed: HTTP ${res.status}`,
        sourceUrl: url,
      };
    }

    const data = (await res.json()) as any[];
    if (!Array.isArray(data) || data.length === 0) {
      return {
        valid: false,
        state: "NY",
        licenseNumber: cleanNum,
        error: "License not found in NY database",
        sourceUrl: url,
      };
    }

    const r = data[0] || {};
    return {
      valid: true,
      state: "NY",
      licenseNumber: cleanNum,
      providerName: r.license_holder_name ?? null,
      licenseType: r.license_type ?? null,
      status: "Active",
      expiry: r.license_expiration_date ?? null,
      sourceUrl: url,
    };
  } catch (e: any) {
    return {
      valid: false,
      state: "NY",
      licenseNumber: cleanNum,
      error: e?.message || "NY lookup failed",
      sourceUrl: url,
    };
  }
}

function parseExpiryMonthYear(exp: string): Date | null {
  // Supports: MM/YY, M/YY, MM/YYYY
  const t = (exp || "").trim();
  const m = t.match(/^([0-9]{1,2})\s*\/\s*([0-9]{2,4})$/);
  if (!m) return null;
  const month = parseInt(m[1]!, 10);
  let year = parseInt(m[2]!, 10);
  if (!month || month < 1 || month > 12) return null;
  if (year < 100) year = 2000 + year;

  // Expire end of that month
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  return end;
}

function isActiveFromExpiry(expiry: string | null | undefined) {
  if (!expiry) return false;
  const d = parseExpiryMonthYear(expiry);
  if (!d) return false;
  return d.getTime() >= Date.now();
}

async function verifyFLLicense(licenseNumber: string, fullName?: string | null): Promise<LicenseVerificationResult> {
  const cleanNum = cleanLicenseNumber(licenseNumber);
  const searchUrl = "https://www.myfloridalicense.com/wl11.asp?mode=2&search=LicNbr&SID=&brd=&typ=";

  try {
    const body = new URLSearchParams();
    body.set("LicNbr", cleanNum);
    body.set("RecsPerPage", "50");
    body.set("Search1", "Search");

    const res = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "text/html,*/*",
      },
      body,
    });

    if (!res.ok) {
      return {
        valid: false,
        state: "FL",
        licenseNumber: cleanNum,
        error: `FL lookup failed: HTTP ${res.status}`,
        sourceUrl: "https://www.myfloridalicense.com/wl11.asp",
      };
    }

    const html = await res.text();
    if (html.includes("There are no results") || html.toLowerCase().includes("no records")) {
      return {
        valid: false,
        state: "FL",
        licenseNumber: cleanNum,
        error: "License not found in FL DBPR search",
        sourceUrl: "https://www.myfloridalicense.com/wl11.asp",
      };
    }

    // Parse rows in search results.
    // Each row has columns: License Type, Name, Name Type, License Number/Rank, Status/Expires
    const rowRegex = /<tr[^>]*>\s*<td[^>]*>\s*([\s\S]*?)<\/td>\s*<td[^>]*>\s*([\s\S]*?)<\/td>\s*<td[^>]*>\s*([\s\S]*?)<\/td>\s*<td[^>]*>\s*([\s\S]*?)<\/td>\s*<td[^>]*>\s*([\s\S]*?)<\/td>\s*<\/tr>/gi;

    const strip = (s: string) =>
      s
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    let best: { licType: string; name: string; licNum: string; statusExpires: string } | null = null;
    let m: RegExpExecArray | null;

    while ((m = rowRegex.exec(html))) {
      const licType = strip(m[1] || "");
      const name = strip(m[2] || "");
      const licNumCell = strip(m[4] || "");
      const statusExpires = strip(m[5] || "");

      // licNumCell often contains the license number as a token.
      if (!licNumCell) continue;
      const licNumToken = cleanLicenseNumber(licNumCell);

      if (licNumToken.includes(cleanNum)) {
        best = { licType, name, licNum: licNumCell, statusExpires };
        break;
      }
    }

    if (!best) {
      // Fallback to name-based search (last name, optionally first name) if we have it.
      const ln = parseLastName(fullName);
      if (ln) {
        const fn = parseFirstName(fullName);
        const nameSearchUrl = "https://www.myfloridalicense.com/wl11.asp?mode=2&search=Name&SID=&brd=&typ=";
        const b2 = new URLSearchParams();
        b2.set("LastName", ln.toUpperCase());
        if (fn) b2.set("FirstName", fn.toUpperCase());
        b2.set("RecsPerPage", "50");
        b2.set("Search1", "Search");

        const res2 = await fetch(nameSearchUrl, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded", accept: "text/html,*/*" },
          body: b2,
        });

        if (res2.ok) {
          const html2 = await res2.text();
          let m2: RegExpExecArray | null;
          while ((m2 = rowRegex.exec(html2))) {
            const licType = strip(m2[1] || "");
            const name = strip(m2[2] || "");
            const licNumCell = strip(m2[4] || "");
            const statusExpires = strip(m2[5] || "");
            const licNumToken = cleanLicenseNumber(licNumCell);
            if (licNumToken.includes(cleanNum)) {
              best = { licType, name, licNum: licNumCell, statusExpires };
              break;
            }
          }
        }
      }

      if (!best) {
        return {
          valid: false,
          state: "FL",
          licenseNumber: cleanNum,
          error: "FL search returned results, but none matched the license number exactly",
          sourceUrl: "https://www.myfloridalicense.com/wl11.asp",
        };
      }
    }

    const statusActive = /active/i.test(best.statusExpires) && !/inactive|delinquent|expired/i.test(best.statusExpires);
    // Try to parse expiration date if present (often like 'ACTIVE 12/31/2026')
    const expMatch = best.statusExpires.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}\/\d{2,4})/);
    const expiry = expMatch ? expMatch[1] : null;

    return {
      valid: statusActive,
      state: "FL",
      licenseNumber: cleanNum,
      providerName: best.name || null,
      licenseType: best.licType || null,
      status: best.statusExpires,
      expiry,
      sourceUrl: "https://www.myfloridalicense.com/wl11.asp",
      error: statusActive ? null : "Found record but status not active",
    };
  } catch (e: any) {
    return {
      valid: false,
      state: "FL",
      licenseNumber: cleanNum,
      error: e?.message || "FL lookup failed",
      sourceUrl: "https://www.myfloridalicense.com/wl11.asp",
    };
  }
}

async function verifyWvLicense(licenseNumber: string, fullName?: string | null): Promise<LicenseVerificationResult> {
  const cleanNum = cleanLicenseNumber(licenseNumber);
  const url = "https://agencies.wvsto.com/bc/NameSearch.asp";

  try {
    const body = new URLSearchParams();
    body.set("LicenseNo", cleanNum);

    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "text/html,*/*" },
      body,
    });

    if (!res.ok) {
      return {
        valid: false,
        state: "WV",
        licenseNumber: cleanNum,
        error: `WV lookup failed: HTTP ${res.status}`,
        sourceUrl: url,
      };
    }

    let html = await res.text();
    if (html.includes("There are no results")) {
      // Fallback: last-name search
      const ln = parseLastName(fullName);
      if (ln) {
        const body2 = new URLSearchParams();
        body2.set("LName", ln.toUpperCase());
        const res2 = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded", accept: "text/html,*/*" },
          body: body2,
        });
        if (res2.ok) {
          const html2 = await res2.text();
          // If last-name search returns results, we can try to find matching license # in those rows.
          if (!html2.includes("There are no results")) {
            // Reassign html to parsed results below
            // (we'll just continue with parsing logic by shadowing html variable)
            html = html2;
          }
        }
      }

      if (html.includes("There are no results")) {
        return {
          valid: false,
          state: "WV",
          licenseNumber: cleanNum,
          error: "License not found in WV board search",
          sourceUrl: url,
        };
      }
    }

    // Rows: Name, License Type, License Number, City, State, Expiration
    const rowRegex = /<tr>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
    const strip = (s: string) =>
      s
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    let m: RegExpExecArray | null;
    while ((m = rowRegex.exec(html))) {
      const name = strip(m[1] || "");
      const licType = strip(m[2] || "");
      const licNo = strip(m[3] || "");
      const exp = strip(m[6] || "");

      const licNoClean = cleanLicenseNumber(licNo);
      if (licNoClean === cleanNum) {
        const active = isActiveFromExpiry(exp);
        return {
          valid: active,
          state: "WV",
          licenseNumber: cleanNum,
          providerName: name || null,
          licenseType: licType || null,
          status: active ? "Active" : "Expired/Unknown",
          expiry: exp || null,
          sourceUrl: url,
          error: active ? null : "Found record but appears expired/unknown",
        };
      }
    }

    return {
      valid: false,
      state: "WV",
      licenseNumber: cleanNum,
      error: "WV search returned results, but none matched the license number exactly",
      sourceUrl: url,
    };
  } catch (e: any) {
    return {
      valid: false,
      state: "WV",
      licenseNumber: cleanNum,
      error: e?.message || "WV lookup failed",
      sourceUrl: url,
    };
  }
}

async function verifyNJLicense(licenseNumber: string, fullName?: string | null): Promise<LicenseVerificationResult> {
  const cleanNum = cleanLicenseNumber(licenseNumber);
  const baseUrl = "https://newjersey.mylicense.com/verification/Search.aspx?facility=N";

  try {
    const res1 = await fetch(baseUrl, { redirect: "follow" });
    if (!res1.ok) {
      return {
        valid: false,
        state: "NJ",
        licenseNumber: cleanNum,
        error: `NJ lookup failed: HTTP ${res1.status}`,
        sourceUrl: baseUrl,
      };
    }

    const html1 = await res1.text();
    const viewstate = html1.match(/id="__VIEWSTATE" value="([^"]+)"/)?.[1];
    const eventval = html1.match(/id="__EVENTVALIDATION" value="([^"]+)"/)?.[1];
    const vgen = html1.match(/id="__VIEWSTATEGENERATOR" value="([^"]+)"/)?.[1];

    if (!viewstate || !eventval) {
      return {
        valid: false,
        state: "NJ",
        licenseNumber: cleanNum,
        error: "NJ lookup failed: could not extract VIEWSTATE/EVENTVALIDATION",
        sourceUrl: baseUrl,
      };
    }

    const cookie = res1.headers.get("set-cookie") || "";

    const body = new URLSearchParams();
    body.set("__VIEWSTATE", viewstate);
    if (vgen) body.set("__VIEWSTATEGENERATOR", vgen);
    body.set("__EVENTVALIDATION", eventval);

    // Search fields
    body.set("t_web_lookup__license_no", cleanNum);
    body.set("t_web_lookup__profession_name", "Cosmetology and Hairstyling");
    body.set("t_web_lookup__license_type_name", "");
    body.set("t_web_lookup__first_name", "");
    body.set("t_web_lookup__last_name", "");
    body.set("t_web_lookup__addr_city", "");

    body.set("sch_button", "Search");

    const res2 = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie,
        accept: "text/html,*/*",
      },
      body,
      redirect: "follow",
    });

    if (!res2.ok) {
      return {
        valid: false,
        state: "NJ",
        licenseNumber: cleanNum,
        error: `NJ lookup failed: HTTP ${res2.status}`,
        sourceUrl: baseUrl,
      };
    }

    const html2 = await res2.text();

    // The results page typically contains a table of matches.
    if (/No Records Found|No results found|0 Records/i.test(html2)) {
      // Fallback: last name search
      const ln = parseLastName(fullName);
      if (ln) {
        const body2 = new URLSearchParams();
        body2.set("__VIEWSTATE", viewstate);
        if (vgen) body2.set("__VIEWSTATEGENERATOR", vgen);
        body2.set("__EVENTVALIDATION", eventval);

        body2.set("t_web_lookup__license_no", "");
        body2.set("t_web_lookup__profession_name", "Cosmetology and Hairstyling");
        body2.set("t_web_lookup__license_type_name", "");
        body2.set("t_web_lookup__first_name", "");
        body2.set("t_web_lookup__last_name", ln.toUpperCase());
        body2.set("t_web_lookup__addr_city", "");
        body2.set("sch_button", "Search");

        const res3 = await fetch(baseUrl, {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            cookie,
            accept: "text/html,*/*",
          },
          body: body2,
          redirect: "follow",
        });

        if (res3.ok) {
          const html3 = await res3.text();
          const idx3 = html3.toUpperCase().indexOf(cleanNum.toUpperCase());
          if (idx3 !== -1) {
            const window = html3.slice(Math.max(0, idx3 - 500), Math.min(html3.length, idx3 + 1500));
            const active = /Active/i.test(window) && !/Inactive|Expired|Suspended|Revoked/i.test(window);
            return {
              valid: active,
              state: "NJ",
              licenseNumber: cleanNum,
              status: active ? "Active" : "Found/Unknown",
              sourceUrl: baseUrl,
              error: active ? null : "Found record but could not confirm Active status via simple parse",
            };
          }
        }
      }

      return {
        valid: false,
        state: "NJ",
        licenseNumber: cleanNum,
        error: "License not found in NJ lookup",
        sourceUrl: baseUrl,
      };
    }

    // Very lightweight parse: find any occurrence of the license number and then nearby status keywords.
    // We'll mark valid if we see the license number AND 'Active' near it.
    const idx = html2.toUpperCase().indexOf(cleanNum.toUpperCase());
    if (idx === -1) {
      return {
        valid: false,
        state: "NJ",
        licenseNumber: cleanNum,
        error: "NJ lookup returned page but could not find license number in results",
        sourceUrl: baseUrl,
      };
    }

    const window = html2.slice(Math.max(0, idx - 500), Math.min(html2.length, idx + 1500));
    const active = /Active/i.test(window) && !/Inactive|Expired|Suspended|Revoked/i.test(window);

    return {
      valid: active,
      state: "NJ",
      licenseNumber: cleanNum,
      status: active ? "Active" : "Found/Unknown",
      sourceUrl: baseUrl,
      error: active ? null : "Found record but could not confirm Active status via simple parse",
    };
  } catch (e: any) {
    return {
      valid: false,
      state: "NJ",
      licenseNumber: cleanNum,
      error: e?.message || "NJ lookup failed",
      sourceUrl: baseUrl,
    };
  }
}

async function verifyKYLicense(licenseNumber: string, fullName?: string | null): Promise<LicenseVerificationResult> {
  const cleanNum = cleanLicenseNumber(licenseNumber);
  const baseUrl = "https://kyboc.mylicense.com/verification/Search.aspx?facility=N";

  try {
    const res1 = await fetch(baseUrl, { redirect: "follow" });
    if (!res1.ok) {
      return {
        valid: false,
        state: "KY",
        licenseNumber: cleanNum,
        error: `KY lookup failed: HTTP ${res1.status}`,
        sourceUrl: baseUrl,
      };
    }

    const html1 = await res1.text();
    const viewstate = html1.match(/id="__VIEWSTATE" value="([^"]+)"/)?.[1];
    const eventval = html1.match(/id="__EVENTVALIDATION" value="([^"]+)"/)?.[1];
    const vgen = html1.match(/id="__VIEWSTATEGENERATOR" value="([^"]+)"/)?.[1];

    if (!viewstate || !eventval) {
      return {
        valid: false,
        state: "KY",
        licenseNumber: cleanNum,
        error: "KY lookup failed: could not extract VIEWSTATE/EVENTVALIDATION",
        sourceUrl: baseUrl,
      };
    }

    const cookie = res1.headers.get("set-cookie") || "";

    const body = new URLSearchParams();
    body.set("__VIEWSTATE", viewstate);
    if (vgen) body.set("__VIEWSTATEGENERATOR", vgen);
    body.set("__EVENTVALIDATION", eventval);

    body.set("t_web_lookup__license_no", cleanNum);
    body.set("t_web_lookup__profession_name", "");
    body.set("t_web_lookup__license_type_name", "");
    body.set("t_web_lookup__first_name", "");
    body.set("t_web_lookup__last_name", "");
    body.set("t_web_lookup__addr_city", "");
    body.set("sch_button", "Search");

    const res2 = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie,
        accept: "text/html,*/*",
      },
      body,
      redirect: "follow",
    });

    if (!res2.ok) {
      return {
        valid: false,
        state: "KY",
        licenseNumber: cleanNum,
        error: `KY lookup failed: HTTP ${res2.status}`,
        sourceUrl: baseUrl,
      };
    }

    const html2 = await res2.text();
    if (/No Records Found|No results found|0 Records/i.test(html2)) {
      // Fallback: last name search
      const ln = parseLastName(fullName);
      if (ln) {
        const body2 = new URLSearchParams();
        body2.set("__VIEWSTATE", viewstate);
        if (vgen) body2.set("__VIEWSTATEGENERATOR", vgen);
        body2.set("__EVENTVALIDATION", eventval);

        body2.set("t_web_lookup__license_no", "");
        body2.set("t_web_lookup__profession_name", "");
        body2.set("t_web_lookup__license_type_name", "");
        body2.set("t_web_lookup__first_name", "");
        body2.set("t_web_lookup__last_name", ln.toUpperCase());
        body2.set("t_web_lookup__addr_city", "");
        body2.set("sch_button", "Search");

        const res3 = await fetch(baseUrl, {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            cookie,
            accept: "text/html,*/*",
          },
          body: body2,
          redirect: "follow",
        });
        if (res3.ok) {
          const html3 = await res3.text();
          const idx3 = html3.toUpperCase().indexOf(cleanNum.toUpperCase());
          if (idx3 !== -1) {
            const window = html3.slice(Math.max(0, idx3 - 500), Math.min(html3.length, idx3 + 1500));
            const active = /Active/i.test(window) && !/Inactive|Expired|Suspended|Revoked/i.test(window);
            return {
              valid: active,
              state: "KY",
              licenseNumber: cleanNum,
              status: active ? "Active" : "Found/Unknown",
              sourceUrl: baseUrl,
              error: active ? null : "Found record but could not confirm Active status via simple parse",
            };
          }
        }
      }

      return {
        valid: false,
        state: "KY",
        licenseNumber: cleanNum,
        error: "License not found in KY lookup",
        sourceUrl: baseUrl,
      };
    }

    const idx = html2.toUpperCase().indexOf(cleanNum.toUpperCase());
    if (idx === -1) {
      return {
        valid: false,
        state: "KY",
        licenseNumber: cleanNum,
        error: "KY lookup returned page but could not find license number in results",
        sourceUrl: baseUrl,
      };
    }

    const window = html2.slice(Math.max(0, idx - 500), Math.min(html2.length, idx + 1500));
    const active = /Active/i.test(window) && !/Inactive|Expired|Suspended|Revoked/i.test(window);

    return {
      valid: active,
      state: "KY",
      licenseNumber: cleanNum,
      status: active ? "Active" : "Found/Unknown",
      sourceUrl: baseUrl,
      error: active ? null : "Found record but could not confirm Active status via simple parse",
    };
  } catch (e: any) {
    return {
      valid: false,
      state: "KY",
      licenseNumber: cleanNum,
      error: e?.message || "KY lookup failed",
      sourceUrl: baseUrl,
    };
  }
}

async function verifyRILicense(licenseNumber: string, fullName?: string | null): Promise<LicenseVerificationResult> {
  const cleanNum = cleanLicenseNumber(licenseNumber);
  const baseUrl = "https://healthri.mylicense.com/verification/Search.aspx?facility=N";

  try {
    const res1 = await fetch(baseUrl, { redirect: "follow" });
    if (!res1.ok) {
      return {
        valid: false,
        state: "RI",
        licenseNumber: cleanNum,
        error: `RI lookup failed: HTTP ${res1.status}`,
        sourceUrl: baseUrl,
      };
    }

    const html1 = await res1.text();
    const viewstate = html1.match(/id="__VIEWSTATE" value="([^"]+)"/)?.[1];
    const eventval = html1.match(/id="__EVENTVALIDATION" value="([^"]+)"/)?.[1];
    const vgen = html1.match(/id="__VIEWSTATEGENERATOR" value="([^"]+)"/)?.[1];

    if (!viewstate || !eventval) {
      return {
        valid: false,
        state: "RI",
        licenseNumber: cleanNum,
        error: "RI lookup failed: could not extract VIEWSTATE/EVENTVALIDATION",
        sourceUrl: baseUrl,
      };
    }

    const cookie = res1.headers.get("set-cookie") || "";

    const postSearch = async (body: URLSearchParams) =>
      fetch(baseUrl, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          cookie,
          accept: "text/html,*/*",
        },
        body,
        redirect: "follow",
      });

    const buildBody = (o: { licNo?: string; lastName?: string }) => {
      const body = new URLSearchParams();
      body.set("__VIEWSTATE", viewstate);
      if (vgen) body.set("__VIEWSTATEGENERATOR", vgen);
      body.set("__EVENTVALIDATION", eventval);

      body.set("t_web_lookup__license_no", o.licNo ?? "");
      body.set("t_web_lookup__profession_name", "");
      body.set("t_web_lookup__license_type_name", "");
      body.set("t_web_lookup__first_name", "");
      body.set("t_web_lookup__last_name", o.lastName ?? "");
      body.set("t_web_lookup__addr_city", "");
      body.set("sch_button", "Search");
      return body;
    };

    const res2 = await postSearch(buildBody({ licNo: cleanNum }));
    if (!res2.ok) {
      return {
        valid: false,
        state: "RI",
        licenseNumber: cleanNum,
        error: `RI lookup failed: HTTP ${res2.status}`,
        sourceUrl: baseUrl,
      };
    }

    const html2 = await res2.text();
    const hasNoRecords = /No Records Found|No results found|0 Records/i.test(html2);

    let page = html2;
    if (hasNoRecords) {
      const ln = parseLastName(fullName);
      if (ln) {
        const res3 = await postSearch(buildBody({ lastName: ln.toUpperCase() }));
        if (res3.ok) page = await res3.text();
      }
    }

    if (/No Records Found|No results found|0 Records/i.test(page)) {
      return {
        valid: false,
        state: "RI",
        licenseNumber: cleanNum,
        error: "License not found in RI lookup",
        sourceUrl: baseUrl,
      };
    }

    const idx = page.toUpperCase().indexOf(cleanNum.toUpperCase());
    if (idx === -1) {
      return {
        valid: false,
        state: "RI",
        licenseNumber: cleanNum,
        error: "RI lookup returned page but could not find license number in results",
        sourceUrl: baseUrl,
      };
    }

    const window = page.slice(Math.max(0, idx - 500), Math.min(page.length, idx + 1500));
    const active = /Active/i.test(window) && !/Inactive|Expired|Suspended|Revoked/i.test(window);

    return {
      valid: active,
      state: "RI",
      licenseNumber: cleanNum,
      status: active ? "Active" : "Found/Unknown",
      sourceUrl: baseUrl,
      error: active ? null : "Found record but could not confirm Active status via simple parse",
    };
  } catch (e: any) {
    return {
      valid: false,
      state: "RI",
      licenseNumber: cleanNum,
      error: e?.message || "RI lookup failed",
      sourceUrl: baseUrl,
    };
  }
}

async function verifyINLicense(licenseNumber: string, fullName?: string | null): Promise<LicenseVerificationResult> {
  const cleanNum = cleanLicenseNumber(licenseNumber);
  const baseUrl = "https://mylicense.in.gov/everification/Search.aspx?facility=N";

  try {
    const res1 = await fetch(baseUrl, { redirect: "follow" });
    if (!res1.ok) {
      return {
        valid: false,
        state: "IN",
        licenseNumber: cleanNum,
        error: `IN lookup failed: HTTP ${res1.status}`,
        sourceUrl: baseUrl,
      };
    }

    const html1 = await res1.text();
    const viewstate = html1.match(/id="__VIEWSTATE" value="([^"]+)"/)?.[1];
    const eventval = html1.match(/id="__EVENTVALIDATION" value="([^"]+)"/)?.[1];
    const vgen = html1.match(/id="__VIEWSTATEGENERATOR" value="([^"]+)"/)?.[1];

    if (!viewstate || !eventval) {
      return {
        valid: false,
        state: "IN",
        licenseNumber: cleanNum,
        error: "IN lookup failed: could not extract VIEWSTATE/EVENTVALIDATION",
        sourceUrl: baseUrl,
      };
    }

    const cookie = res1.headers.get("set-cookie") || "";

    const body = new URLSearchParams();
    body.set("__VIEWSTATE", viewstate);
    if (vgen) body.set("__VIEWSTATEGENERATOR", vgen);
    body.set("__EVENTVALIDATION", eventval);

    body.set("t_web_lookup__license_no", cleanNum);
    body.set("t_web_lookup__profession_name", "");
    body.set("t_web_lookup__license_type_name", "");
    body.set("t_web_lookup__first_name", "");
    body.set("t_web_lookup__last_name", "");
    body.set("t_web_lookup__addr_city", "");
    body.set("sch_button", "Search");

    const res2 = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie,
        accept: "text/html,*/*",
      },
      body,
      redirect: "follow",
    });

    if (!res2.ok) {
      return {
        valid: false,
        state: "IN",
        licenseNumber: cleanNum,
        error: `IN lookup failed: HTTP ${res2.status}`,
        sourceUrl: baseUrl,
      };
    }

    const html2 = await res2.text();
    if (/No Records Found|No results found|0 Records/i.test(html2)) {
      // Fallback: last name search
      const ln = parseLastName(fullName);
      if (ln) {
        const body2 = new URLSearchParams();
        body2.set("__VIEWSTATE", viewstate);
        if (vgen) body2.set("__VIEWSTATEGENERATOR", vgen);
        body2.set("__EVENTVALIDATION", eventval);

        body2.set("t_web_lookup__license_no", "");
        body2.set("t_web_lookup__profession_name", "");
        body2.set("t_web_lookup__license_type_name", "");
        body2.set("t_web_lookup__first_name", "");
        body2.set("t_web_lookup__last_name", ln.toUpperCase());
        body2.set("t_web_lookup__addr_city", "");
        body2.set("sch_button", "Search");

        const res3 = await fetch(baseUrl, {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            cookie,
            accept: "text/html,*/*",
          },
          body: body2,
          redirect: "follow",
        });
        if (res3.ok) {
          const html3 = await res3.text();
          const idx3 = html3.toUpperCase().indexOf(cleanNum.toUpperCase());
          if (idx3 !== -1) {
            const window = html3.slice(Math.max(0, idx3 - 500), Math.min(html3.length, idx3 + 1500));
            const active = /Active/i.test(window) && !/Inactive|Expired|Suspended|Revoked/i.test(window);
            return {
              valid: active,
              state: "IN",
              licenseNumber: cleanNum,
              status: active ? "Active" : "Found/Unknown",
              sourceUrl: baseUrl,
              error: active ? null : "Found record but could not confirm Active status via simple parse",
            };
          }
        }
      }

      return {
        valid: false,
        state: "IN",
        licenseNumber: cleanNum,
        error: "License not found in IN lookup",
        sourceUrl: baseUrl,
      };
    }

    const idx = html2.toUpperCase().indexOf(cleanNum.toUpperCase());
    if (idx === -1) {
      return {
        valid: false,
        state: "IN",
        licenseNumber: cleanNum,
        error: "IN lookup returned page but could not find license number in results",
        sourceUrl: baseUrl,
      };
    }

    const window = html2.slice(Math.max(0, idx - 500), Math.min(html2.length, idx + 1500));
    const active = /Active/i.test(window) && !/Inactive|Expired|Suspended|Revoked/i.test(window);

    return {
      valid: active,
      state: "IN",
      licenseNumber: cleanNum,
      status: active ? "Active" : "Found/Unknown",
      sourceUrl: baseUrl,
      error: active ? null : "Found record but could not confirm Active status via simple parse",
    };
  } catch (e: any) {
    return {
      valid: false,
      state: "IN",
      licenseNumber: cleanNum,
      error: e?.message || "IN lookup failed",
      sourceUrl: baseUrl,
    };
  }
}

async function verifyTXLicense(licenseNumber: string): Promise<LicenseVerificationResult> { 
  const cleanNum = cleanLicenseNumber(licenseNumber).replace(/[^0-9]/g, "");
  const baseUrl = "https://www.tdlr.texas.gov/LicenseIdSearch";

  try {
    // 1) Get the page to obtain anti-forgery token + cookies
    const res1 = await fetch(baseUrl, { redirect: "follow" });
    const html = await res1.text();

    const cookie = res1.headers.get("set-cookie") || "";
    const m = html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/);
    const token = m?.[1];
    if (!token) {
      return {
        valid: false,
        state: "TX",
        licenseNumber: cleanNum,
        error: "TX lookup failed: could not extract verification token",
        sourceUrl: baseUrl,
      };
    }

    // Candidate individual license types relevant to beauty
    // (We try multiple because we don't know what the applicant selected.)
    const candidateLicenseTypeIds = [
      180, // COSMETOLOGY OPERATOR
      192, // EYELASH EXTENSION SPECIALIST
      152, // BARBER MANICURIST
      153, // BARBER TECHNICIAN
      151, // CLASS A BARBER
    ];

    for (const lt of candidateLicenseTypeIds) {
      const body = new URLSearchParams();
      body.set("__RequestVerificationToken", token);
      body.set("LicenseType", String(lt));
      body.set("LicenseNumber", cleanNum);
      body.set("SearchName", "");
      body.set("searchType", "Previous");

      const res2 = await fetch(
        "https://www.tdlr.texas.gov/LicenseIdSearch/Home/IndividualsSearch",
        {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded; charset=utf-8",
            // carry cookie forward (best-effort)
            cookie,
            accept: "application/json, text/plain, */*",
          },
          body,
        }
      );

      if (!res2.ok) {
        continue;
      }

      const j = (await res2.json()) as any;
      if (!j || j.success !== true) {
        continue;
      }

      const r = j.result;
      if (!r) {
        // no match for this license type; try next
        continue;
      }

      const expiryStr = r.newExpirationDt || r.previousExpirationDt || null;
      const name = r.name || null;
      const licType = r.newLicenseType || r.previousLicenseType || null;

      // Determine active-ish
      // If expiry is missing/1900, treat as needs manual.
      let active = false;
      if (expiryStr && expiryStr !== "01/01/1900") {
        const [mm, dd, yyyy] = String(expiryStr).split("/").map((x: string) => parseInt(x, 10));
        if (yyyy && mm && dd) {
          const exp = new Date(Date.UTC(yyyy, mm - 1, dd));
          const now = new Date();
          active = exp.getTime() >= now.getTime();
        }
      }

      return {
        valid: active,
        state: "TX",
        licenseNumber: cleanNum,
        providerName: name,
        licenseType: licType,
        status: active ? "Active" : "Expired/Unknown",
        expiry: expiryStr,
        sourceUrl: baseUrl,
        error: active ? null : "Found record, but expiration indicates expired/unknown",
      };
    }

    return {
      valid: false,
      state: "TX",
      licenseNumber: cleanNum,
      error: "License not found in TX lookup (tried common beauty license types)",
      sourceUrl: baseUrl,
    };
  } catch (e: any) {
    return {
      valid: false,
      state: "TX",
      licenseNumber: cleanNum,
      error: e?.message || "TX lookup failed",
      sourceUrl: baseUrl,
    };
  }
}

export async function verifyLicense(
  state: string,
  licenseNumber: string,
  opts?: { fullName?: string | null }
): Promise<LicenseVerificationResult> {
  const s = (state || "").toUpperCase();
  if (s === "NY") return verifyNYLicense(licenseNumber);
  if (s === "TX") return verifyTXLicense(licenseNumber);
  if (s === "FL") return verifyFLLicense(licenseNumber, opts?.fullName);
  if (s === "NJ") return verifyNJLicense(licenseNumber, opts?.fullName);
  if (s === "WV") return verifyWvLicense(licenseNumber, opts?.fullName);
  if (s === "KY") return verifyKYLicense(licenseNumber, opts?.fullName);
  if (s === "RI") return verifyRILicense(licenseNumber, opts?.fullName);
  if (s === "IN") return verifyINLicense(licenseNumber, opts?.fullName);

  if (s === "PA") return verifyPALicense(licenseNumber, opts?.fullName);
  if (s === "GA") return verifyGALicense(licenseNumber, opts?.fullName);
  if (s === "CA") return verifyCALicense(licenseNumber, opts?.fullName);

  return {
    valid: false,
    state: s,
    licenseNumber: cleanLicenseNumber(licenseNumber),
    error: `Auto-lookup for ${s} not implemented yet`,
    sourceUrl: null,
  };
}
