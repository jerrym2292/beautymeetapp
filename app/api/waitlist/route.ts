import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Body = z.object({
  providerId: z.string(),
  fullName: z.string().min(2),
  phone: z.string().min(7),
  serviceId: z.string(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid waitlist request" }, { status: 400 });
  }

  const { providerId, fullName, phone, serviceId, notes } = parsed.data;

  const customer = await prisma.customer.upsert({
    where: { phone },
    update: { fullName },
    create: { fullName, phone },
  });

  const entry = await prisma.waitlistEntry.create({
    data: {
      providerId,
      customerId: customer.id,
      serviceId,
      notes,
    }
  });

  return NextResponse.json({ ok: true, id: entry.id });
}
