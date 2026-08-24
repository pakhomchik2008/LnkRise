import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SCHEMA_STATEMENTS } from "./schema-statements";

export const runtime = "nodejs";

/**
 * One-off, temporary endpoint to apply the full schema to a brand-new
 * production database. Sensitive env vars (DATABASE_URL included) are only
 * injected at runtime on Vercel, never during the build step, so
 * `prisma db push` cannot run there — this replays the equivalent DDL,
 * statement by statement, from inside a live request instead.
 * Delete this route once it has been called successfully once.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = request.headers.get("x-migration-secret");
  if (!secret || secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results: { statement: string; ok: boolean; error?: string }[] = [];

  for (const statement of SCHEMA_STATEMENTS) {
    try {
      await prisma.$executeRawUnsafe(statement);
      results.push({ statement: statement.slice(0, 60), ok: true });
    } catch (error) {
      results.push({
        statement: statement.slice(0, 60),
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const failed = results.filter((r) => !r.ok);
  return NextResponse.json({ ok: failed.length === 0, total: results.length, failed });
}
