import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  sqliteConfigured: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

if (!globalForPrisma.sqliteConfigured) {
  globalForPrisma.sqliteConfigured = true;
  prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL;").catch(() => {});
  prisma.$executeRawUnsafe("PRAGMA synchronous = NORMAL;").catch(() => {});
  prisma.$executeRawUnsafe("PRAGMA busy_timeout = 5000;").catch(() => {});
}
