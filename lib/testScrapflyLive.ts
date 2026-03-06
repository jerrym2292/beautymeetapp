
import { verifyLicense } from "./licenseVerification";

async function testScrapfly() {
  console.log("--- Testing GA (Georgia) License Lookup via Scrapfly ---");
  // Test with a known profession-like search if possible, or dummy for error check
  const gaResult = await verifyLicense("GA", "123456", { fullName: "Test Tech" });
  console.log("GA Result:", JSON.stringify(gaResult, null, 2));

  console.log("\n--- Testing CA (California) License Lookup via Scrapfly ---");
  const caResult = await verifyLicense("CA", "123456", { fullName: "Test Tech" });
  console.log("CA Result:", JSON.stringify(caResult, null, 2));
}

testScrapfly();
