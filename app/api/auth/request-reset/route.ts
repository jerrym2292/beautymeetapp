import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

export const runtime = "nodejs";

const Body = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: true });

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return ok to avoid email enumeration.
  if (!user) return NextResponse.json({ ok: true });

  const { randomBytes } = await import("crypto");
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const baseUrl = process.env.APP_BASE_URL || new URL(req.url).origin;
  const link = `${baseUrl}/reset-password?token=${token}`;

  await sendMail({
    to: email,
    subject: "Beauty Meet password reset",
    html: `<p>Reset your password:</p><p><a href="${link}">${link}</a></p><p>This link expires in 30 minutes.</p>`,
  });

  return NextResponse.json({ ok: true });
}
