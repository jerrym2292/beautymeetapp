import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie } from "@/lib/auth";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST() {
  const c = await cookies();
  const token = c.get("bm_session")?.value;
  if (token) await prisma.session.delete({ where: { token } }).catch(() => null);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
