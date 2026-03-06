import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncInstagramPortfolio } from "@/lib/portfolioSync";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { handle } = await req.json();

  const provider = await prisma.provider.findUnique({
    where: { accessToken: token }
  });

  if (!provider) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await syncInstagramPortfolio(provider.id, handle);
  
  if (result?.success) {
    const updated = await prisma.provider.findUnique({ where: { id: provider.id } });
    return NextResponse.json({ success: true, photos: JSON.parse(updated?.portfolioUrlsJson || "[]") });
  }

  return NextResponse.json({ error: result?.error || "Sync failed" }, { status: 500 });
}
