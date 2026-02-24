import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../_auth";

export const runtime = "nodejs";

const Body = z.object({
  appId: z.string().min(1),
  displayName: z.string().min(2).max(80),
  baseZip: z.string().min(5).max(10),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { appId, displayName, baseZip } = parsed.data;

  const app = await prisma.providerApplication.findUnique({
    where: { id: appId },
  });
  if (!app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  if (app.status !== "PENDING") {
    return NextResponse.json(
      { error: "Application is not pending" },
      { status: 409 }
    );
  }

  await prisma.$transaction([
    prisma.providerApplication.update({
      where: { id: appId },
      data: { status: "APPROVED" },
    }),
    prisma.provider.create({
      data: {
        applicationId: appId,
        accessToken: crypto.randomUUID(),
        displayName,
        mode: "BOTH",
        baseAddress1: "TBD",
        baseAddress2: null,
        baseCity: "TBD",
        baseState: "GA",
        baseZip,
        maxTravelMiles: 25,
        travelRateCents: 100,
      },
    }),
  ]);

  // TODO: send SMS to provider: approved

  return NextResponse.json({ ok: true });
}
