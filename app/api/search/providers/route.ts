import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeMilesBetweenZips } from "@/lib/geo";
import { z } from "zod";

const Q = z.object({
  zip: z.string().min(5).max(10),
  radius: z.coerce.number().int().min(1).max(500).default(25),
  category: z.enum(["ALL", "LASHES_BROWS", "NAILS"]).default("ALL"),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Q.safeParse({
    zip: url.searchParams.get("zip"),
    radius: url.searchParams.get("radius") ?? "25",
    category: url.searchParams.get("category") ?? "ALL",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid search" }, { status: 400 });
  }

  const { zip, radius, category } = parsed.data;

  // For MVP: brute force filter in-memory.
  const providers = await prisma.provider.findMany({
    where: { active: true, subscriptionActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      displayName: true,
      mode: true,
      baseCity: true,
      baseState: true,
      baseZip: true,
      maxTravelMiles: true,
      travelRateCents: true,
      services: {
        where: {
          active: true,
          ...(category === "ALL" ? {} : { category }),
        },
        orderBy: { priceCents: "asc" },
        select: { id: true, name: true, durationMin: true, priceCents: true, category: true },
      },
    },
  });

  const filtered = providers
    .map((p) => {
      const miles = safeMilesBetweenZips(zip, p.baseZip);
      return { ...p, distanceMiles: Math.round(miles) };
    })
    .filter((p) => p.distanceMiles <= radius)
    .filter((p) => p.services.length > 0)
    .sort((a, b) => a.distanceMiles - b.distanceMiles);

  return NextResponse.json({ providers: filtered });
}
