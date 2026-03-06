import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const formData = await req.formData();
  const enabled = formData.get("rebookingSmsEnabled") === "on";

  const provider = await prisma.provider.findUnique({ where: { accessToken: token } });
  if (!provider) return NextResponse.redirect(new URL(`/`, req.url));

  await prisma.provider.update({
    where: { id: provider.id },
    data: { rebookingSmsEnabled: enabled },
  });

  return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
}
