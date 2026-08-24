import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * One-off, temporary endpoint to apply the CoachNote table to production.
 * Sensitive env vars (DATABASE_URL included) are only injected at runtime on
 * Vercel, never during the build step, so `prisma db push` cannot run there —
 * this exists to do the equivalent DDL from inside a live request instead.
 * Delete this route once it has been called successfully once.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = request.headers.get("x-migration-secret");
  if (!secret || secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CoachNote" (
      id text NOT NULL,
      "coachId" text NOT NULL,
      "clientId" text NOT NULL,
      body text NOT NULL,
      "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
      CONSTRAINT "CoachNote_pkey" PRIMARY KEY (id)
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CoachNote_coachId_clientId_idx" ON "CoachNote" ("coachId", "clientId");
  `);

  return NextResponse.json({ ok: true });
}
