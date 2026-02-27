import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../_auth";

export const runtime = "nodejs";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  // Hard delete is ONLY allowed when there is no booking history.
  const provider = await prisma.provider.findUnique({
    where: { id },
    include: { services: { select: { id: true } }, bookings: { select: { id: true }, take: 1 } },
  });

  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  if (provider.bookings.length > 0) {
    return NextResponse.json(
      { error: "Cannot remove provider: booking history exists. Hide/disable instead." },
      { status: 409 }
    );
  }

  await prisma.$transaction([
    prisma.service.deleteMany({ where: { providerId: provider.id } }),
    prisma.user.deleteMany({ where: { providerId: provider.id } }),
    prisma.provider.delete({ where: { id: provider.id } }),
    prisma.providerApplication.deleteMany({ where: { id: provider.applicationId } }),
  ]);

  return NextResponse.json({ ok: true });
}
