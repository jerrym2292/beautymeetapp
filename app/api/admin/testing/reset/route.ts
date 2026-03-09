import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../_auth";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

// DANGEROUS: Wipes and recreates the staging database.
// Only works if the database is SQLite (dev.db) and we aren't on production.
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const baseUrl = process.env.APP_BASE_URL || "";
  const isProd = baseUrl.includes("beautymeetapp.com") && !baseUrl.includes("127.0.0.1") && !baseUrl.includes("localhost");
  
  // Extra safety: check if we are using Postgres (prod usually uses Postgres, staging uses SQLite)
  const isPostgres = process.env.DATABASE_URL?.startsWith("postgres");

  if (isProd || isPostgres) {
    return NextResponse.json({ error: "Reset is disabled on production/Postgres environments." }, { status: 403 });
  }

  try {
    // 1. Disconnect Prisma
    await prisma.$disconnect();

    // 2. Locate and delete dev.db
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    
    // Also delete journal/shm files if they exist
    ["dev.db-journal", "dev.db-shm", "dev.db-wal"].forEach(f => {
      const p = path.join(process.cwd(), "prisma", f);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });

    // 3. Run prisma db push to recreate schema
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });

    return NextResponse.json({ ok: true, message: "Staging database reset successfully." });
  } catch (e: any) {
    console.error("Reset failed:", e);
    return NextResponse.json({ error: "Reset failed: " + e.message }, { status: 500 });
  }
}
