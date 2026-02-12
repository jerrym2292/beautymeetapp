import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

const Body = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const prt = await prisma.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
    include: { user: true },
  });
  if (!prt) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  if (prt.usedAt) return NextResponse.json({ error: "Already used" }, { status: 400 });
  if (prt.expiresAt.getTime() < Date.now()) return NextResponse.json({ error: "Expired" }, { status: 400 });

  const hash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.update({ where: { id: prt.userId }, data: { passwordHash: hash } });
  await prisma.passwordResetToken.update({ where: { id: prt.id }, data: { usedAt: new Date() } });

  return NextResponse.json({ ok: true });
}
