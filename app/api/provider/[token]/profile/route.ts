import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Update provider public profile fields (social links, bio, etc.)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const provider = await prisma.provider.findUnique({ where: { accessToken: token } });
  if (!provider) return NextResponse.redirect(new URL(`/`, req.url));

  const form = await req.formData();

  const instagram = String(form.get("instagram") || "").trim() || null;
  const facebook = String(form.get("facebook") || "").trim() || null;
  const tiktok = String(form.get("tiktok") || "").trim() || null;
  const bio = String(form.get("bio") || "").trim() || null;

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      instagram,
      facebook,
      tiktok,
      bio,
    },
  });

  return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
}
