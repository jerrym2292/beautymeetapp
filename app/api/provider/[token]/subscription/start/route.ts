import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Start Stripe subscription for a provider.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const provider = await prisma.provider.findUnique({ where: { accessToken: token }, include: { application: true } });
  if (!provider) return NextResponse.redirect(new URL(`/`, req.url));

  const priceId = process.env.STRIPE_TECH_SUB_PRICE_ID;
  const baseUrl = process.env.APP_BASE_URL || new URL(req.url).origin;

  if (!process.env.STRIPE_SECRET_KEY || !priceId) {
    return NextResponse.redirect(new URL(`/tech/${token}?sub=not_configured`, baseUrl));
  }

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/tech/${token}?sub=success`,
    cancel_url: `${baseUrl}/tech/${token}?sub=cancel`,
    ...(provider.stripeCustomerId
      ? { customer: provider.stripeCustomerId }
      : { customer_email: provider.application?.email || undefined }),
    subscription_data: {
      metadata: {
        kind: "tech_subscription",
        providerId: provider.id,
      },
    },
    metadata: {
      kind: "tech_subscription",
      providerId: provider.id,
    },
  });

  return NextResponse.redirect(session.url || new URL(`/tech/${token}`, baseUrl));
}
