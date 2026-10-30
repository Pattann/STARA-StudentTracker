import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  sqliteConfigured: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
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
