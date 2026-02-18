import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.toUpperCase();

  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const affiliate = await prisma.affiliate.findUnique({
    where: { code },
    select: { id: true, code: true, fullName: true }
  });

  if (!affiliate) return NextResponse.json({ error: "Invalid code" }, { status: 404 });

  return NextResponse.json({ ok: true, affiliate });
}
