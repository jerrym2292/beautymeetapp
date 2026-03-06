import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { zones, surcharges } = await req.json();

  const provider = await prisma.provider.findUnique({
    where: { accessToken: token }
  });

  if (!provider) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      travelZonesJson: JSON.stringify(zones),
      travelZoneSurchargesJson: JSON.stringify(surcharges)
    }
  });

  return NextResponse.json({ success: true });
}
