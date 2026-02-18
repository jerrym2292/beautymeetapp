import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ token: string; serviceId: string; questionId: string }> }
) {
  const { token, serviceId, questionId } = await params;

  const provider = await prisma.provider.findUnique({
    where: { accessToken: token },
    select: { id: true },
  });

  if (!provider) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure service belongs to provider
  const service = await prisma.service.findFirst({
    where: { id: serviceId, providerId: provider.id },
  });

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  await prisma.intakeQuestion.delete({
    where: { id: questionId, serviceId },
  });

  return NextResponse.json({ ok: true });
}
