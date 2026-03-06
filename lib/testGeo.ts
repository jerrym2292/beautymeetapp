
import { calculateTravelSurcharge, isPointInPolygon } from "./geoUtils";

async function testGeoLogic() {
  console.log("--- Testing Point-in-Polygon Logic ---");
  
  // Atlanta area polygon (roughly)
  const atlantaZone = [
    { lat: 33.8, lng: -84.4 },
    { lat: 33.8, lng: -84.3 },
    { lat: 33.7, lng: -84.3 },
    { lat: 33.7, lng: -84.4 }
  ];

  const insidePoint = { lat: 33.75, lng: -84.35 };
  const outsidePoint = { lat: 34.0, lng: -84.0 };

  console.log("Point inside:", isPointInPolygon(insidePoint, atlantaZone)); // Expect true
  console.log("Point outside:", isPointInPolygon(outsidePoint, atlantaZone)); // Expect false

  console.log("\n--- Testing Surcharge Calculation ---");
  const zones = JSON.stringify([{ id: "zone1", path: atlantaZone, name: "Atlanta Central" }]);
  const surcharges = JSON.stringify({ "zone1": "25.00" });

  const surcharge = calculateTravelSurcharge(insidePoint, zones, surcharges);
  console.log(`Detected Surcharge: $${surcharge}`); // Expect 25.00
}

testGeoLogic();
