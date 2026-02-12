import { getCurrentUser } from "@/lib/auth";

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Not logged in" };
  if (user.role !== "ADMIN") return { ok: false as const, error: "Admin only" };
  return { ok: true as const, user };
}
