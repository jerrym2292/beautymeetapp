import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Body = z.object({
  kitEquipment: z.string().max(2000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const form = await req.formData();
  const obj: any = Object.fromEntries(form.entries());
  const parsed = Body.safeParse(obj);
  
  if (!parsed.success) {
    return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
  }

  const provider = await prisma.provider.findUnique({ where: { accessToken: token } });
  if (!provider) return NextResponse.redirect(new URL(`/`, req.url));

  const equipmentList = parsed.data.kitEquipment
    ? parsed.data.kitEquipment.split("\n").map(s => s.trim()).filter(Boolean)
    : [];

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      kitEquipmentJson: JSON.stringify(equipmentList),
    },
  });

  return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
}
