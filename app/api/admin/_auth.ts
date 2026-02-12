export function requirePin(pin: string | null | undefined) {
  const expected = process.env.ADMIN_PIN;
  if (!expected) return { ok: false, error: "ADMIN_PIN not configured" };
  if (!pin) return { ok: false, error: "PIN required" };
  if (pin !== expected) return { ok: false, error: "Invalid PIN" };
  return { ok: true as const };
}
