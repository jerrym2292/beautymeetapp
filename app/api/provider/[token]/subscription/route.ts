import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Provider self-service subscribe/unsubscribe.
// For now this is NOT Stripe-backed; it just flips flags.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const provider = await prisma.provider.findUnique({ where: { accessToken: token } });
  if (!provider) return NextResponse.redirect(new URL(`/`, req.url));

  const form = await req.formData().catch(() => null);
  const action = String(form?.get("action") || "");

  if (action !== "subscribe" && action !== "unsubscribe") {
    return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
  }

  if (action === "unsubscribe") {
    await prisma.provider.update({
      where: { id: provider.id },
      data: { subscriptionActive: false, active: false },
    });
    return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
  }

  // subscribe
  await prisma.provider.update({
    where: { id: provider.id },
    data: { subscriptionActive: true, active: true },
  });

  return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
}
