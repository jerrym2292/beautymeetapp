import zipcodes from "zipcodes";

export function milesBetweenZips(zipA: string, zipB: string): number | null {
  const a = zipcodes.lookup(zipA);
  const b = zipcodes.lookup(zipB);
  if (!a || !b) return null;

  const lat1 = (a as any).latitude as number;
  const lon1 = (a as any).longitude as number;
  const lat2 = (b as any).latitude as number;
  const lon2 = (b as any).longitude as number;

  const R = 3958.8; // miles
  const toRad = (d: number) => (d * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const q =
    s1 * s1 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * s2 * s2;
  const c = 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q));

  return R * c;
}

export function safeMilesBetweenZips(zipA: string, zipB: string): number {
  const miles = milesBetweenZips(zipA, zipB);
  if (miles == null) return 10;
  
  // Apply a 20% road-buffer to account for driving distance vs. straight line
  return Math.ceil(miles * 1.2);
}
