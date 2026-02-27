import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../_auth";
import { getStripe } from "@/lib/stripe";
import { z } from "zod";

export const runtime = "nodejs";

const Body = z.object({
  paymentId: z.string().min(1),
  amountCents: z.number().int().positive().optional(),
});

// Refund a payment (full or partial) by Payment record.
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { paymentId, amountCents } = parsed.data;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: true },
  });

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  if (!payment.paymentIntentId) {
    return NextResponse.json({ error: "Payment has no paymentIntentId" }, { status: 400 });
  }

  if (payment.status !== "CAPTURED") {
    return NextResponse.json({ error: `Payment not refundable (status=${payment.status})` }, { status: 400 });
  }

  const stripe = getStripe();

  // Create refund
  const refund = await stripe.refunds.create({
    payment_intent: payment.paymentIntentId,
    ...(amountCents ? { amount: amountCents } : {}),
  });

  // Mark refunded if full refund; for partial refund, we keep CAPTURED for now.
  // (We can add a REFUNDED_PARTIAL status later if you want.)
  if (!amountCents || amountCents >= payment.amountCents) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } });
  }

  return NextResponse.json({ ok: true, refundId: refund.id });
}
