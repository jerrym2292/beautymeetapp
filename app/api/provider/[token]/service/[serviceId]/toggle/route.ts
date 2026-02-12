import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string; serviceId: string }> }
) {
  const { token, serviceId } = await params;
  const provider = await prisma.provider.findUnique({ where: { accessToken: token } });
  if (!provider) return NextResponse.redirect(new URL(`/`, req.url));

  const svc = await prisma.service.findFirst({ where: { id: serviceId, providerId: provider.id } });
  if (!svc) return NextResponse.redirect(new URL(`/tech/${token}`, req.url));

  await prisma.service.update({
    where: { id: svc.id },
    data: { active: !svc.active },
  });

  return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
}
