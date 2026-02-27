import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../_auth";

export const runtime = "nodejs";

const Body = z.object({
  appId: z.string().min(1),
  notes: z.string().max(400).nullable().optional(),
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

  const { appId, notes } = parsed.data;

  const app = await prisma.providerApplication.findUnique({ where: { id: appId } });
  if (!app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const tx: any[] = [
    prisma.providerApplication.update({
      where: { id: appId },
      data: { status: "REJECTED", notes: notes ?? null },
    }),
  ];

  // Admin PIN auth (no session user) is allowed for smoke/E2E; skip audit log in that case.
  if (auth.user) {
    tx.push(
      prisma.adminAuditLog.create({
        data: {
          adminId: auth.user.id,
          action: "REJECT_PROVIDER",
          targetId: appId,
          details: JSON.stringify({ notes }),
        },
      })
    );
  }

  await prisma.$transaction(tx);

  // TODO: send SMS to provider: rejected

  return NextResponse.json({ ok: true });
}
