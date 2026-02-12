import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const provider = await prisma.provider.findUnique({ where: { accessToken: token }, include: { application: true } });
  if (!provider) return NextResponse.redirect(new URL(`/`, req.url));

  const stripe = getStripe();
  const baseUrl = process.env.APP_BASE_URL || new URL(req.url).origin;

  let acctId = provider.stripeAccountId;
  if (!acctId) {
    const acct = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: provider.application?.email || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: { providerId: provider.id },
    });
    acctId = acct.id;

    await prisma.provider.update({
      where: { id: provider.id },
      data: { stripeAccountId: acctId },
    });
  }

  const link = await stripe.accountLinks.create({
    account: acctId,
    refresh_url: `${baseUrl}/tech/${token}`,
    return_url: `${baseUrl}/tech/${token}`,
    type: "account_onboarding",
  });

  return NextResponse.redirect(link.url);
}
