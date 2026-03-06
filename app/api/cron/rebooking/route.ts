import { processRebookingReminders } from "@/lib/rebooking";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Simple header-based "secret" for the cron to use
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const count = await processRebookingReminders();
  return NextResponse.json({ ok: true, remindersSent: count });
}
