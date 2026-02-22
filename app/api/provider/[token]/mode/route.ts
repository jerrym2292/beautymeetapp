import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const formData = await req.formData().catch(() => null);
  const mode = formData?.get("mode") as string;

  if (!mode || !["FIXED", "MOBILE", "BOTH"].includes(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  await prisma.provider.update({
    where: { accessToken: token },
    data: { mode: mode as any },
  });

  // Redirect back to dashboard
  const baseUrl = new URL(req.url).origin;
  return NextResponse.redirect(`${baseUrl}/tech/${token}`, { status: 303 });
}
