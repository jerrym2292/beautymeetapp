import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(30),
  email: z.string().email().nullable().optional(),

  // Hidden from public. Used for service area + future distance.
  address1: z.string().min(3).max(120).nullable().optional(),
  address2: z.string().max(120).nullable().optional(),
  city: z.string().min(2).max(80).nullable().optional(),
  state: z.string().min(2).max(2).nullable().optional(),
  zip: z.string().min(5).max(10).nullable().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid application details." },
      { status: 400 }
    );
  }

  const { fullName, phone, email, address1, address2, city, state, zip } = parsed.data;

  const created = await prisma.providerApplication.create({
    data: {
      fullName,
      phone,
      email: email ?? null,
      address1: address1 ?? null,
      address2: address2 ?? null,
      city: city ?? null,
      state: state ?? null,
      zip: zip ?? null,
    },
    select: { id: true },
  });

  // TODO: send SMS acknowledgement

  return NextResponse.json({ ok: true, id: created.id });
}
