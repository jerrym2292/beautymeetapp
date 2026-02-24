import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

async function sendSupportEmail(subject: string, text: string) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM;
  if (!host || !port || !user || !pass || !from) return;

  const tx = nodemailer.createTransport({
    host,
    port,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: { user, pass },
  });

  await tx.sendMail({
    from,
    to: user,
    subject,
    text,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const booking = await prisma.booking.findFirst({
    where: { customerIssueToken: token },
    include: { provider: true, customer: true, service: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  const form = await req.formData().catch(() => null);
  const message = String(form?.get("message") || "").slice(0, 2000);

  await prisma.booking.update({
    where: { id: booking.id },
    data: { issueReportedAt: new Date() },
  });

  await sendSupportEmail(
    `Beauty Meet: Issue reported for booking ${booking.id}`,
    [
      `Booking: ${booking.id}`,
      `Provider: ${booking.provider.displayName} (${booking.provider.id})`,
      `Service: ${booking.service.name} (${booking.service.id})`,
      `Customer: ${booking.customer.fullName} (${booking.customer.phone})`,
      `Start: ${booking.startAt.toISOString()}`,
      message ? `\nMessage:\n${message}` : "",
    ].join("\n")
  ).catch(() => null);

  return NextResponse.json({ ok: true });
}
