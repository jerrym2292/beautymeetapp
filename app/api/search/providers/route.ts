import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeMilesBetweenZips } from "@/lib/geo";
import { expireStaleBookingRequests } from "@/lib/expire";
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

  // Cheap cleanup so stale requests don't hang around.
  await expireStaleBookingRequests();

  // For MVP: brute force filter in-memory.
  const providers = await prisma.provider.findMany({
    where: {
      // Hide providers from customers until they are fully approved + verified.
      stripeChargesEnabled: true,
      stripePayoutsEnabled: true,
      licenseVerified: true,
    },
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
      _count: {
        select: {
          bookings: {
            where: { status: "COMPLETED" },
          },
        },
      },
    },
  });

  function stableHash(s: string) {
    // tiny deterministic hash for tie-breaking / rotation
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  const dayKey = new Date().toISOString().slice(0, 10);

  const filtered = providers
    .map((p) => {
      const miles = safeMilesBetweenZips(zip, p.baseZip);
      const distanceMiles = Math.round(miles);
      const completedBookings = (p as any)?._count?.bookings ?? 0;
      const isNewTech = completedBookings < 5;

      // Base: prioritize proximity.
      // Boost: give new techs a real shot, without burying established techs.
      const baseScore = -distanceMiles;
      const newTechBoost = isNewTech ? 10 : 0; // ~equivalent to being ~10mi closer
      const score = baseScore + newTechBoost;

      const tie = stableHash(`${zip}|${dayKey}|${p.id}`) / 0xffffffff;

      return {
        ...p,
        distanceMiles,
        completedBookings,
        isNewTech,
        _score: score,
        _tie: tie,
      };
    })
    .filter((p) => p.distanceMiles <= radius)
    .filter((p) => p.services.length > 0)
    .sort((a, b) => {
      // higher score first; ties broken by deterministic daily rotation
      if (b._score !== a._score) return b._score - a._score;
      return b._tie - a._tie;
    })
    .map(({ _score, _tie, ...rest }) => rest);

  const recommended = filtered[0] || null;

  return NextResponse.json({
    recommendedProviderId: recommended?.id ?? null,
    providers: filtered,
  });
}
