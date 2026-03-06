
import { ScrapflyClient, ScrapeConfig } from "scrapfly-sdk";

const SCRAPFLY_API_KEY = process.env.SCRAPFLY_API_KEY || "YOUR_SCRAPFLY_KEY_HERE";

function cleanLicenseNumber(s: string) {
  return s.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/**
 * GA: Georgia Secretary of State (SOS).
 * Uses Scrapfly to bypass Cloudflare/Turnstile.
 */
export async function verifyGALicense(licenseNumber: string, fullName?: string | null): Promise<any> {
  const cleanNum = cleanLicenseNumber(licenseNumber);
  const client = new ScrapflyClient({ key: SCRAPFLY_API_KEY });

  try {
    const result = await client.scrape(new ScrapeConfig({
      url: "https://verify.sos.ga.gov/Verification/",
      asp: true, // Anti-Scraping Protection bypass
      render_js: true, // Handle Turnstile/JS challenge
      // We use a JS scenario to fill the form and click search
      js_scenario: [
        { wait_for_selector: { selector: "input[name='LicenseNumber']" } },
        { fill: { selector: "input[name='LicenseNumber']", value: cleanNum } },
        { click: { selector: "button#btnSearch" } }, // Adjust selector based on actual site
        { wait_for_navigation: {} }
      ]
    }));

    const content = result.result.content;
    const isValid = content.includes("Active") && content.includes(cleanNum);

    return {
      valid: isValid,
      state: "GA",
      licenseNumber: cleanNum,
      status: isValid ? "Active" : "Unknown/Not Found",
      sourceUrl: "https://verify.sos.ga.gov/Verification/",
      error: isValid ? null : "Manual verification recommended: Result not definitively Active.",
      _debug_log: result.result.log_url
    };
  } catch (e: any) {
    return {
      valid: false,
      state: "GA",
      licenseNumber: cleanNum,
      error: `GA Scrapfly lookup failed: ${e.message}`,
      sourceUrl: "https://verify.sos.ga.gov/Verification/"
    };
  }
}

/**
 * CA: California Department of Consumer Affairs (DCA).
 * Protected by Turnstile.
 */
export async function verifyCALicense(licenseNumber: string, fullName?: string | null): Promise<any> {
  const cleanNum = cleanLicenseNumber(licenseNumber);
  const client = new ScrapflyClient({ key: SCRAPFLY_API_KEY });

  try {
    // CA uses a direct search URL pattern for some boards, 
    // but the main portal is at https://search.dca.ca.gov/
    const result = await client.scrape(new ScrapeConfig({
      url: `https://search.dca.ca.gov/results?boardCode=7&licenseNumber=${cleanNum}`, // 7 is Barbering & Cosmetology
      asp: true,
      render_js: true
    }));

    const content = result.result.content;
    const isValid = content.includes("Current") || content.includes("Active");

    return {
      valid: isValid,
      state: "CA",
      licenseNumber: cleanNum,
      status: isValid ? "Active" : "Unknown/Not Found",
      sourceUrl: "https://search.dca.ca.gov/",
      error: isValid ? null : "Manual verification recommended: Result not definitively Active.",
      _debug_log: result.result.log_url
    };
  } catch (e: any) {
    return {
      valid: false,
      state: "CA",
      licenseNumber: cleanNum,
      error: `CA Scrapfly lookup failed: ${e.message}`,
      sourceUrl: "https://search.dca.ca.gov/"
    };
  }
}
