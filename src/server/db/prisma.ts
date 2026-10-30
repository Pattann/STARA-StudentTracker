import "server-only";
import { PrismaClient } from "@prisma/client";

function sanitizePostgresUri(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  const bracketMatch = trimmed.match(/^(postgres(?:ql)?:\/\/[^:/?#]+):\[([^\]]+)\]@(.*)$/i);
  if (bracketMatch) {
    const [, prefix, rawPass, suffix] = bracketMatch;
    return `${prefix}:${encodeURIComponent(rawPass)}@${suffix}`;
  }
  return trimmed;
}

const resolvedDbUrl = sanitizePostgresUri(
  process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL
);
if (resolvedDbUrl) {
  process.env.DATABASE_URL = resolvedDbUrl;
}
const resolvedDirectUrl = sanitizePostgresUri(
  process.env.DIRECT_URL || process.env.POSTGRES_URL_NON_POOLING
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
