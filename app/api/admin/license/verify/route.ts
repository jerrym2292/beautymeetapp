import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../_auth";

export const runtime = "nodejs";

const Body = z.object({
  providerId: z.string().min(1),
  verified: z.boolean().default(true),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { providerId, verified } = parsed.data;

  const provider = await prisma.provider.findUnique({ where: { id: providerId } });
  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  if (verified) {
    if (!provider.licenseType || !provider.licenseState || !provider.licenseNumber) {
      return NextResponse.json(
        { error: "Missing license fields (type/state/number)" },
        { status: 409 }
      );
    }
  }

  await prisma.provider.update({
    where: { id: providerId },
    data: { licenseVerified: verified },
  });

  return NextResponse.json({ ok: true });
}
