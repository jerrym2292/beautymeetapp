import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(2).max(120).optional(),
  category: z.enum(["LASHES_BROWS", "NAILS"]).optional(),
  durationMin: z.coerce.number().int().min(5).max(600).optional(),
  price: z.coerce.number().min(1).max(2000).optional(),
  rebookingWeeks: z.coerce.number().int().min(1).max(52).optional(),
  prepInstructions: z.string().max(2000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string; serviceId: string }> }
) {
  const { token, serviceId } = await params;
  const form = await req.formData();
  const obj: any = Object.fromEntries(form.entries());
  const parsed = Body.safeParse(obj);
  
  if (!parsed.success) {
    return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
  }

  const provider = await prisma.provider.findUnique({ where: { accessToken: token } });
  if (!provider) return NextResponse.redirect(new URL(`/`, req.url));

  const updateData: any = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.category) updateData.category = parsed.data.category;
  if (parsed.data.durationMin) updateData.durationMin = parsed.data.durationMin;
  if (parsed.data.price) updateData.priceCents = Math.round(parsed.data.price * 100);
  if (parsed.data.rebookingWeeks) updateData.rebookingWeeks = parsed.data.rebookingWeeks;
  if (parsed.data.prepInstructions !== undefined) updateData.prepInstructions = parsed.data.prepInstructions;

  await prisma.service.update({
    where: { id: serviceId, providerId: provider.id },
    data: updateData,
  });

  return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ token: string; serviceId: string }> }
) {
  const { token, serviceId } = await params;
  const provider = await prisma.provider.findUnique({ where: { accessToken: token } });
  if (!provider) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.service.delete({
    where: { id: serviceId, providerId: provider.id },
  });

  return NextResponse.json({ ok: true });
}
