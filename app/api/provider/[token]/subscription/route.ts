import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Provider self-service subscribe/unsubscribe.
// Stripe-backed when STRIPE_TECH_SUB_PRICE_ID is configured.
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

  if (action === "subscribe") {
    // Stripe flow starts via /subscription/start.
    // Keep a manual fallback for admins/dev.
    await prisma.provider.update({
      where: { id: provider.id },
      data: { subscriptionActive: true, active: true },
    });
    return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
  }

  // unsubscribe
  if (process.env.STRIPE_SECRET_KEY && provider.stripeSubscriptionId) {
    try {
      const stripe = getStripe();
      await stripe.subscriptions.cancel(provider.stripeSubscriptionId);
    } catch {
      // ignore; webhook may still flip state later
    }
  }

  await prisma.provider.update({
    where: { id: provider.id },
    data: { subscriptionActive: false, active: false, stripeSubscriptionId: null },
  });

  return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
}
