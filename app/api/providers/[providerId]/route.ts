import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const { providerId } = await params;
  const provider = await prisma.provider.findUnique({
    where: { id: providerId, active: true, subscriptionActive: true },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      instagram: true,
      facebook: true,
      tiktok: true,
      mode: true,
      maxTravelMiles: true,
      travelRateCents: true,
      services: {
        where: { active: true },
        orderBy: { priceCents: "asc" },
        select: { id: true, name: true, durationMin: true, priceCents: true, category: true, questions: true },
      },
    },
  });

  if (!provider) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ provider });
}
