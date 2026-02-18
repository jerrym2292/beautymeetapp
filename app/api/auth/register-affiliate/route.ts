import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const Body = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6),
  code: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/, "Alphanumeric only"),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration details" }, { status: 400 });
  }

  const { fullName, email, password, code } = parsed.data;
  const lowerEmail = email.toLowerCase();
  const upperCode = code.toUpperCase();

  // Check email
  const existingUser = await prisma.user.findUnique({ where: { email: lowerEmail } });
  if (existingUser) return NextResponse.json({ error: "Email already taken" }, { status: 400 });

  // Check code
  const existingAffiliate = await prisma.affiliate.findUnique({ where: { code: upperCode } });
  if (existingAffiliate) return NextResponse.json({ error: "Affiliate code already taken" }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);

  const affiliate = await prisma.affiliate.create({
    data: {
      fullName,
      email: lowerEmail,
      code: upperCode,
    }
  });

  await prisma.user.create({
    data: {
      email: lowerEmail,
      passwordHash,
      role: "AFFILIATE",
      affiliateId: affiliate.id
    }
  });

  return NextResponse.json({ ok: true });
}
