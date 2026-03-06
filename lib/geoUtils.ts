
/**
 * point-in-polygon (pip) implementation using the ray-casting algorithm.
 * Used for travel zone detection without needing the Google Maps library on the server.
 */
export function isPointInPolygon(point: { lat: number, lng: number }, polygon: { lat: number, lng: number }[]) {
  const x = point.lat, y = point.lng;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i]!.lat, yi = polygon[i]!.lng;
    const xj = polygon[j]!.lat, yj = polygon[j]!.lng;
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function calculateTravelSurcharge(
  customerCoords: { lat: number, lng: number }, 
  zonesJson: string | null, 
  surchargesJson: string | null
): number {
  if (!zonesJson || !surchargesJson) return 0;
  
  try {
    const zones = JSON.parse(zonesJson);
    const surcharges = JSON.parse(surchargesJson);
    
    // Check zones in order (first match wins or we could do max surcharge)
    for (const zone of zones) {
      if (isPointInPolygon(customerCoords, zone.path)) {
        const amount = parseFloat(surcharges[zone.id]);
        if (!isNaN(amount)) return amount;
      }
    }
  } catch (e) {
    console.error("Error calculating surcharge:", e);
  }
  
  return 0;
}
