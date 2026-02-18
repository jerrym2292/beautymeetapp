import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Body = z.object({
  text: z.string().min(1).max(500),
  required: z.boolean().default(true),
  type: z.enum(["TEXT", "YES_NO"]).default("TEXT"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string; serviceId: string }> }
) {
  const { token, serviceId } = await params;
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid question details" }, { status: 400 });
  }

  const provider = await prisma.provider.findUnique({
    where: { accessToken: token },
    select: { id: true },
  });

  if (!provider) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, providerId: provider.id },
  });

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const question = await prisma.intakeQuestion.create({
    data: {
      serviceId,
      text: parsed.data.text,
      required: parsed.data.required,
      type: parsed.data.type,
    },
  });

  return NextResponse.json({ ok: true, question });
}
