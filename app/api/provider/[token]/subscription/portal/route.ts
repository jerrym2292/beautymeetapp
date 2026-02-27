import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const provider = await prisma.provider.findUnique({ where: { accessToken: token } });
  if (!provider) return NextResponse.redirect(new URL(`/`, req.url));

  const baseUrl = process.env.APP_BASE_URL || new URL(req.url).origin;

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.redirect(new URL(`/tech/${token}?portal=not_configured`, baseUrl));
  }

  if (!provider.stripeCustomerId) {
    return NextResponse.redirect(new URL(`/tech/${token}?portal=no_customer`, baseUrl));
  }

  const stripe = getStripe();

  const portal = await stripe.billingPortal.sessions.create({
    customer: provider.stripeCustomerId,
    return_url: `${baseUrl}/tech/${token}`,
  });

  return NextResponse.redirect(portal.url);
}
