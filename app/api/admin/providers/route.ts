import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../_auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const providers = await prisma.provider.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      application: {
        select: {
          fullName: true,
          phone: true,
          email: true
        }
      }
    }
  });

  return NextResponse.json({ providers });
}
