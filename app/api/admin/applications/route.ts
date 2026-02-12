import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePin } from "../_auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pin = url.searchParams.get("pin");
  const auth = requirePin(pin);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const applications = await prisma.providerApplication.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      fullName: true,
      phone: true,
      email: true,
      status: true,
    },
  });

  return NextResponse.json({ applications });
}
