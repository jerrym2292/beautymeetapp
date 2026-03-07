import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Q = z.object({
  category: z.enum(["ALL", "LASHES_BROWS", "NAILS", "HAIR", "BRAIDS"]).default("ALL"),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Q.safeParse({
    category: url.searchParams.get("category") ?? "ALL",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const { category } = parsed.data;

  const services = await prisma.service.findMany({
    where: {
      active: true,
      ...(category === "ALL" ? {} : { category }),
      provider: { active: true, subscriptionActive: true },
    },
    select: { name: true, category: true, durationMin: true, priceCents: true },
    orderBy: [{ category: "asc" }, { priceCents: "asc" }],
  });

  // Collapse into unique "service cards" by (category, name)
  const map = new Map<string, { name: string; category: string; fromPriceCents: number; durationMin: number }>();
  for (const s of services) {
    const key = `${s.category}::${s.name}`;
    const existing = map.get(key);
    if (!existing || s.priceCents < existing.fromPriceCents) {
      map.set(key, {
        name: s.name,
        category: s.category,
        fromPriceCents: s.priceCents,
        durationMin: s.durationMin,
      });
    }
  }

  return NextResponse.json({
    services: Array.from(map.values()),
  });
}
