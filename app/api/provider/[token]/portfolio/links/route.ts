import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const Body = z.object({
  links: z.array(z.string().url()).max(50),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const provider = await prisma.provider.findUnique({
    where: { accessToken: token },
    select: { portfolioUrlsJson: true },
  });

  if (!provider) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let links: string[] = [];
  try {
    links = provider.portfolioUrlsJson ? JSON.parse(provider.portfolioUrlsJson) : [];
  } catch {
    links = [];
  }

  return NextResponse.json({ links });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const provider = await prisma.provider.findUnique({ where: { accessToken: token } });
  if (!provider) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid links" }, { status: 400 });
  }

  // Basic normalization: trim + drop empties + de-dupe
  const normalized = Array.from(
    new Set(parsed.data.links.map((s) => s.trim()).filter(Boolean))
  );

  await prisma.provider.update({
    where: { id: provider.id },
    data: { portfolioUrlsJson: JSON.stringify(normalized) },
  });

  return NextResponse.json({ ok: true, links: normalized });
}
