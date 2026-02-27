import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(2).max(120).optional(),
  category: z.enum(["LASHES_BROWS", "NAILS"]).optional(),
  durationMin: z.coerce.number().int().min(5).max(600).optional(),
  // Accept either dollars or cents
  price: z.coerce.number().min(1).max(2000).optional(),
  priceCents: z.coerce.number().int().min(100).max(200000).optional(),
  quick: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const ct = req.headers.get("content-type") || "";
  const wantsJson = ct.includes("application/json");

  let obj: any = {};
  if (wantsJson) {
    obj = (await req.json().catch(() => ({}))) || {};
  } else {
    const form = await req.formData();
    obj = Object.fromEntries(form.entries());
  }

  const parsed = Body.safeParse(obj);
  if (!parsed.success) {
    return wantsJson
      ? NextResponse.json({ error: "Invalid request" }, { status: 400 })
      : NextResponse.redirect(new URL(`/tech/${token}`, req.url));
  }

  const provider = await prisma.provider.findUnique({ where: { accessToken: token } });
  if (!provider) return NextResponse.redirect(new URL(`/`, req.url));

  if (parsed.data.quick) {
    const templates = [
      { category: "LASHES_BROWS" as const, name: "Classic Full Set", durationMin: 120, priceCents: 12000 },
      { category: "LASHES_BROWS" as const, name: "Hybrid Full Set", durationMin: 150, priceCents: 15000 },
      { category: "LASHES_BROWS" as const, name: "Volume Full Set", durationMin: 180, priceCents: 18000 },
      { category: "LASHES_BROWS" as const, name: "Fill", durationMin: 75, priceCents: 8500 },
      { category: "NAILS" as const, name: "Gel Manicure", durationMin: 60, priceCents: 6000 },
      { category: "NAILS" as const, name: "Acrylic Full Set", durationMin: 120, priceCents: 9000 },
      { category: "NAILS" as const, name: "Fill", durationMin: 75, priceCents: 6500 },
      { category: "NAILS" as const, name: "Pedicure", durationMin: 60, priceCents: 5500 },
    ];
    await prisma.service.createMany({
      data: templates.map((t) => ({ ...t, providerId: provider.id })),
    });
    return wantsJson
      ? NextResponse.json({ ok: true })
      : NextResponse.redirect(new URL(`/tech/${token}`, req.url));
  }

  const name = parsed.data.name!;
  const category = parsed.data.category!;
  const durationMin = parsed.data.durationMin!;
  const priceCents = parsed.data.priceCents
    ? Number(parsed.data.priceCents)
    : Math.round(Number(parsed.data.price!) * 100);

  const service = await prisma.service.create({
    data: {
      providerId: provider.id,
      name,
      category,
      durationMin,
      priceCents,
    },
    select: { id: true },
  });

  return wantsJson
    ? NextResponse.json({ ok: true, service })
    : NextResponse.redirect(new URL(`/tech/${token}`, req.url));
}
