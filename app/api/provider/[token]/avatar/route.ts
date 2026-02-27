import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// Upload or clear provider avatar via token-auth.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const provider = await prisma.provider.findUnique({ where: { accessToken: token } });
  if (!provider) return NextResponse.redirect(new URL(`/`, req.url));

  const form = await req.formData();

  // Allow clearing
  const clear = String(form.get("clear") || "");
  if (clear === "1") {
    await prisma.provider.update({ where: { id: provider.id }, data: { avatarUrl: null } });
    return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
  }

  const file = form.get("file") as File | null;
  if (!file) {
    return NextResponse.redirect(new URL(`/tech/${token}?avatar=missing`, req.url));
  }

  const maxBytes = 6 * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.redirect(new URL(`/tech/${token}?avatar=too_large`, req.url));
  }

  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (file.type && !allowed.has(file.type)) {
    return NextResponse.redirect(new URL(`/tech/${token}?avatar=bad_type`, req.url));
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split(".").pop() || "bin";
  const filename = `${randomUUID()}.${ext}`;
  const relativePath = join("uploads", "providers", "avatars", filename);
  const absolutePath = join(process.cwd(), "public", relativePath);

  await mkdir(join(process.cwd(), "public", "uploads", "providers", "avatars"), {
    recursive: true,
  });
  await writeFile(absolutePath, buffer);

  await prisma.provider.update({
    where: { id: provider.id },
    data: { avatarUrl: `/${relativePath}` },
  });

  return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
}
