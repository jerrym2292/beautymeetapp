import { getCurrentUser } from "@/lib/auth";

// Admin auth for MVP:
// - Preferred: logged-in ADMIN user (session)
// - Fallback: x-admin-pin header matching ADMIN_PIN env
export async function requireAdmin(req?: Request) {
  // 1) PIN auth (useful for automated smoke/E2E without interactive login)
  const pin = process.env.ADMIN_PIN;
  const headerPin = req?.headers.get("x-admin-pin");
  if (pin && headerPin && headerPin === pin) {
    return { ok: true as const, user: null };
  }

  // 2) Session auth
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Not logged in" };
  if (user.role !== "ADMIN") return { ok: false as const, error: "Admin only" };
  return { ok: true as const, user };
}
