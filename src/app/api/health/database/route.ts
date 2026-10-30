import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

function sanitizeErrorMessage(raw: unknown): string {
  const text = raw instanceof Error ? raw.message : String(raw ?? "Unknown database error");
  return text
    .replace(/(postgres(?:ql)?|mysql|file):\/\/[^\s"']+/gi, "$1://[REDACTED]")
    .replace(/host\s+"[^"]+"/gi, 'host "[REDACTED]"')
    .replace(/password\s*=\s*[^\s&]+/gi, "password=[REDACTED]")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-2)
    .join(" | ");
}

function isTokenValid(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function detectProvider(): "postgresql" | "sqlite" | "unknown" {
  const url = process.env.DATABASE_URL || "";
  if (
    url.startsWith("postgres://") ||
    url.startsWith("postgresql://") ||
    url.startsWith("prisma+postgres://")
  ) {
    return "postgresql";
  }
  if (url.startsWith("file:")) {
    return "sqlite";
  }
  return "unknown";
}

export async function GET(req: NextRequest) {
  const expectedToken = process.env.HEALTH_CHECK_TOKEN?.trim();
  if (!expectedToken) {
    return NextResponse.json(
      {
        status: "error",
        message: "HEALTH_CHECK_TOKEN belum dikonfigurasi pada environment server.",
      },
      { status: 503 }
    );
  }

  const authHeader = req.headers.get("authorization");
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;
  const headerToken = req.headers.get("x-health-token")?.trim() ?? null;
  const queryToken = req.nextUrl.searchParams.get("token")?.trim() ?? null;
  const providedToken = bearerToken || headerToken || queryToken;

  if (!isTokenValid(providedToken, expectedToken)) {
    return NextResponse.json(
      {
        status: "error",
        message: "Unauthorized: Token health check tidak valid.",
      },
      { status: 401 }
    );
  }

  const provider = detectProvider();
  let queryOk = false;
  let tableOk = false;
  let serverTime: string | null = null;
  let rowCount = 0;
  const errors: Record<string, string> = {};

  // Check 1: SELECT NOW() AS current_time
  try {
    const timeRows = await prisma.$queryRaw<Array<{ current_time: unknown }>>`
      SELECT NOW() AS current_time
    `;
    queryOk = Array.isArray(timeRows) && timeRows.length > 0;
    if (queryOk && timeRows[0]?.current_time) {
      serverTime = String(timeRows[0].current_time);
    }
  } catch (err) {
    errors.query = sanitizeErrorMessage(err);
  }

  // Check 2: SELECT * FROM public.connection_test LIMIT 1
  try {
    const testRows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT * FROM public.connection_test LIMIT 1
    `;
    tableOk = Array.isArray(testRows);
    rowCount = Array.isArray(testRows) ? testRows.length : 0;
  } catch (err) {
    errors.connection_test_table = sanitizeErrorMessage(err);
  }

  const allPassed = queryOk && tableOk;

  return NextResponse.json(
    {
      status: allPassed ? "success" : "failed",
      database: queryOk ? "connected" : "disconnected",
      provider,
      checks: {
        query: queryOk,
        connection_test_table: tableOk,
      },
      meta: {
        serverTime,
        connectionTestHasRecord: rowCount > 0,
        directUrlConfigured: Boolean(process.env.DIRECT_URL),
      },
      ...(Object.keys(errors).length > 0 ? { errors } : {}),
    },
    { status: allPassed ? 200 : 500 }
  );
}

