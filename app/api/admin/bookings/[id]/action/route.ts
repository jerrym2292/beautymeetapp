import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../../_auth";
import { z } from "zod";
import { cancelBookingByTechFullRefund, markNoShowByTech } from "@/lib/cancel";
import { chargeRemainderForBooking } from "@/lib/payments";
import { sendSMS } from "@/lib/sms";

export const runtime = "nodejs";

const Body = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("cancel") }),
  z.object({ kind: z.literal("reschedule"), startAt: z.string().min(5) }),
  z.object({ kind: z.literal("mark_done") }),
  z.object({ kind: z.literal("mark_no_show") }),
  z.object({ kind: z.literal("report_issue") }),
  z.object({ kind: z.literal("clear_issue") }),
  z.object({ kind: z.literal("retry_remainder") }),
  z.object({ kind: z.literal("force_charge_remainder") }),
]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { id } = await params;

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      provider: { include: { application: true } },
      customer: true,
      service: true,
      payments: true,
    },
  });

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // --- actions ---
  try {
    if (parsed.data.kind === "cancel") {
      // Admin cancel: full refund of deposit (same as tech cancel policy).
      await cancelBookingByTechFullRefund(booking.id);
      return NextResponse.json({ ok: true });
    }

    if (parsed.data.kind === "reschedule") {
      const start = new Date(parsed.data.startAt);
      if (isNaN(start.getTime())) {
        return NextResponse.json({ error: "Invalid startAt" }, { status: 400 });
      }

      // Conservative policy: rescheduling resets confirmations and reverts to PENDING.
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          startAt: start,
          status: "PENDING",
          providerConfirmedAt: null,
          customerConfirmedAt: null,
          autoChargeAt: null,
          completedAt: null,
          issueReportedAt: null,
        },
      });

      const techPhone = booking.provider.application?.phone;
      if (techPhone) {
        await sendSMS(
          techPhone,
          `Beauty Meet: Booking rescheduled. Customer: ${booking.customer.fullName}. Service: ${booking.service.name}. New time: ${start.toLocaleString()}. Please open your tech dashboard to confirm.`
        );
      }

      return NextResponse.json({ ok: true });
    }

    if (parsed.data.kind === "mark_done") {
      const now = new Date();
      const autoChargeAt = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      await prisma.booking.update({
        where: { id: booking.id },
        data: { providerConfirmedAt: now, autoChargeAt },
      });
      // If customer already confirmed and no issue, best-effort charge remainder.
      const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
      if (updated?.customerConfirmedAt && !updated.completedAt && !updated.issueReportedAt) {
        await chargeRemainderForBooking(updated.id).catch(() => null);
      }
      return NextResponse.json({ ok: true });
    }

    if (parsed.data.kind === "mark_no_show") {
      await markNoShowByTech(booking.id);
      return NextResponse.json({ ok: true });
    }

    if (parsed.data.kind === "report_issue") {
      await prisma.booking.update({ where: { id: booking.id }, data: { issueReportedAt: new Date() } });
      return NextResponse.json({ ok: true });
    }

    if (parsed.data.kind === "clear_issue") {
      await prisma.booking.update({ where: { id: booking.id }, data: { issueReportedAt: null } });
      return NextResponse.json({ ok: true });
    }

    if (parsed.data.kind === "retry_remainder") {
      const refreshed = await prisma.booking.findUnique({ where: { id: booking.id } });
      if (refreshed?.issueReportedAt) {
        return NextResponse.json({ error: "Issue is reported; resolve/clear issue first." }, { status: 409 });
      }
      await chargeRemainderForBooking(booking.id);
      return NextResponse.json({ ok: true });
    }

    if (parsed.data.kind === "force_charge_remainder") {
      // Same as retry, but message is clearer for admin UI.
      const refreshed = await prisma.booking.findUnique({ where: { id: booking.id } });
      if (refreshed?.issueReportedAt) {
        return NextResponse.json({ error: "Issue is reported; resolve/clear issue first." }, { status: 409 });
      }
      await chargeRemainderForBooking(booking.id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e || "Action failed") },
      { status: 500 }
    );
  }
}
