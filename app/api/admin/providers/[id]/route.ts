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

  // Hard delete disabled by policy: we only hide/disable providers.
  return NextResponse.json(
    { error: "Provider deletion is disabled. Use hide/disable instead." },
    { status: 400 }
  );
}
