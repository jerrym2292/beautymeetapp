import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePin } from "../_auth";

const Body = z.object({
  pin: z.string().min(1),
  appId: z.string().min(1),
  notes: z.string().max(400).nullable().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { pin, appId, notes } = parsed.data;
  const auth = requirePin(pin);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const app = await prisma.providerApplication.findUnique({ where: { id: appId } });
  if (!app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  await prisma.providerApplication.update({
    where: { id: appId },
    data: { status: "REJECTED", notes: notes ?? null },
  });

  // TODO: send SMS to provider: rejected

  return NextResponse.json({ ok: true });
}
