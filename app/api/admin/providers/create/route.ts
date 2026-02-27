import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../_auth";
import { z } from "zod";

export const runtime = "nodejs";

const Body = z.object({
  displayName: z.string().min(2).max(80),
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(30),
  email: z.string().email().optional().nullable(),
  baseZip: z.string().min(5).max(10),
  baseState: z.string().min(2).max(2).default("GA"),
  baseCity: z.string().min(2).max(80).default("TBD"),
});

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { displayName, fullName, phone, email, baseZip, baseState, baseCity } = parsed.data;

  const existingApp = await prisma.providerApplication.findFirst({
    where: { phone },
    select: { id: true },
  });
  if (existingApp) {
    return NextResponse.json({ error: "A provider application with this phone already exists." }, { status: 409 });
  }

  const appId = crypto.randomUUID();

  const [application, provider] = await prisma.$transaction([
    prisma.providerApplication.create({
      data: {
        id: appId,
        fullName,
        phone,
        email: email || null,
        city: baseCity,
        state: baseState,
        zip: baseZip,
        status: "APPROVED",
      },
      select: { id: true },
    }),
    prisma.provider.create({
      data: {
        applicationId: appId,
        accessToken: crypto.randomUUID(),
        displayName,
        mode: "BOTH",
        baseAddress1: "TBD",
        baseAddress2: null,
        baseCity,
        baseState,
        baseZip,
        maxTravelMiles: 25,
        travelRateCents: 100,
        active: true,
      },
      select: { id: true, accessToken: true, displayName: true },
    }),
  ]);

  return NextResponse.json({ ok: true, application, provider });
}
