import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const schemaPath = path.resolve(process.cwd(), "prisma", "schema.prisma");

if (fs.existsSync(schemaPath)) {
  const dbUrl = process.env.DATABASE_URL || "";
  const hasDirectUrl = Boolean(process.env.DIRECT_URL);
  const isPostgres =
    dbUrl.startsWith("postgres://") ||
    dbUrl.startsWith("postgresql://") ||
    dbUrl.startsWith("prisma+postgres://");

  if (isPostgres) {
    let schema = fs.readFileSync(schemaPath, "utf8");
    const datasourceBlock = hasDirectUrl
      ? `datasource db {\n  provider  = "postgresql"\n  url      = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")\n}`
      : `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}`;

    schema = schema.replace(/datasource\s+db\s*\{[\s\S]*?\}/, datasourceBlock);
    fs.writeFileSync(schemaPath, schema, "utf8");
    console.log("[prepare-db] Configured Prisma schema for PostgreSQL (Supabase).");
  }

  try {
    execSync("npx prisma generate", { stdio: "inherit" });
  } catch (err) {
    const clientIndex = path.resolve(
      process.cwd(),
      "node_modules",
      ".prisma",
      "client",
      "index.js"
    );
    if (fs.existsSync(clientIndex)) {
      console.log("[prepare-db] Prisma client already exists (locked by running dev server), continuing build.");
    } else {
      throw err;
    }
  }
}
