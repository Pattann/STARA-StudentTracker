import "server-only";
import { PrismaClient } from "@prisma/client";

export function sanitizePostgresUri(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let trimmed = raw.trim().replace(/^["']|["']$/g, "").trim();
  if (!trimmed) return undefined;

  // Handle postgres:// or postgresql:// with bracketed or unencoded password
  const uriMatch = trimmed.match(/^(postgres(?:ql)?:\/\/[^:/?#]+):(.+)@([^@]+)$/i);
  if (uriMatch) {
    const [, prefix, rawPassInput, hostAndRest] = uriMatch;
    const unbracketed = rawPassInput.replace(/^\[(.*)\]$/, "$1");
    let decoded = unbracketed;
    try {
      decoded = decodeURIComponent(unbracketed);
    } catch {
      decoded = unbracketed;
    }
    trimmed = `${prefix}:${encodeURIComponent(decoded)}@${hostAndRest}`;
  }

  // Ensure Supabase Transaction Pooler (port 6543) always has pgbouncer=true
  if (trimmed.includes(":6543") && !trimmed.includes("pgbouncer=true")) {
    trimmed += trimmed.includes("?") ? "&pgbouncer=true" : "?pgbouncer=true";
  }

  return trimmed;
}

function resolveDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.POSTGRES_PRISMA_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
  ];
  for (const candidate of candidates) {
    const sanitized = sanitizePostgresUri(candidate);
    if (
      sanitized &&
      (sanitized.startsWith("postgres://") ||
        sanitized.startsWith("postgresql://") ||
        sanitized.startsWith("prisma+postgres://"))
    ) {
      return sanitized;
    }
  }
  return sanitizePostgresUri(process.env.DATABASE_URL);
}

const resolvedDbUrl = resolveDatabaseUrl();
if (resolvedDbUrl) {
  process.env.DATABASE_URL = resolvedDbUrl;
}
const resolvedDirectUrl = sanitizePostgresUri(
  process.env.POSTGRES_URL_NON_POOLING || process.env.DIRECT_URL
);
if (resolvedDirectUrl) {
  process.env.DIRECT_URL = resolvedDirectUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  sqliteConfigured: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(resolvedDbUrl ? { datasources: { db: { url: resolvedDbUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

if (
  !globalForPrisma.sqliteConfigured &&
  process.env.DATABASE_URL?.startsWith("file:")
) {
  globalForPrisma.sqliteConfigured = true;
  prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL;").catch(() => {});
  prisma.$queryRawUnsafe("PRAGMA synchronous = NORMAL;").catch(() => {});
  prisma.$queryRawUnsafe("PRAGMA busy_timeout = 5000;").catch(() => {});
}
