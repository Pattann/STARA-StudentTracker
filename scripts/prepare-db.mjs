import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const schemaPath = path.resolve(process.cwd(), "prisma", "schema.prisma");
const envPath = path.resolve(process.cwd(), ".env");

function readEnvFallback(key) {
  if (process.env[key]) return process.env[key];
  if (!fs.existsSync(envPath)) return "";
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0 && trimmed.slice(0, eqIdx).trim() === key) {
      return trimmed
        .slice(eqIdx + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
  return "";
}

if (fs.existsSync(schemaPath)) {
  const candidates = ["POSTGRES_PRISMA_URL", "DATABASE_URL", "POSTGRES_URL"];
  let dbEnvKey = "DATABASE_URL";
  let dbUrl = "";
  for (const key of candidates) {
    const val = readEnvFallback(key);
    if (
      val.startsWith("postgres://") ||
      val.startsWith("postgresql://") ||
      val.startsWith("prisma+postgres://")
    ) {
      dbEnvKey = key;
      dbUrl = val;
      break;
    }
  }
  if (!dbUrl) {
    dbUrl = readEnvFallback("DATABASE_URL");
  }

  const directCandidates = ["DIRECT_URL", "POSTGRES_URL_NON_POOLING"];
  let directEnvKey = "";
  for (const key of directCandidates) {
    const val = readEnvFallback(key);
    if (val.startsWith("postgres://") || val.startsWith("postgresql://")) {
      directEnvKey = key;
      break;
    }
  }

  const isPostgres =
    dbUrl.startsWith("postgres://") ||
    dbUrl.startsWith("postgresql://") ||
    dbUrl.startsWith("prisma+postgres://");

  if (isPostgres) {
    let schema = fs.readFileSync(schemaPath, "utf8");
    const datasourceBlock = directEnvKey
      ? `datasource db {\n  provider  = "postgresql"\n  url       = env("${dbEnvKey}")\n  directUrl = env("${directEnvKey}")\n}`
      : `datasource db {\n  provider = "postgresql"\n  url      = env("${dbEnvKey}")\n}`;

    schema = schema.replace(/datasource\s+db\s*\{[\s\S]*?\}/, datasourceBlock);
    fs.writeFileSync(schemaPath, schema, "utf8");
    console.log(
      `[prepare-db] Configured Prisma schema for PostgreSQL (url=${dbEnvKey}, directUrl=${directEnvKey || "not set"}).`
    );
  } else {
    console.log("[prepare-db] Keeping Prisma schema provider as SQLite for local development.");
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
    if (!isPostgres && !process.env.VERCEL && fs.existsSync(clientIndex)) {
      console.log(
        "[prepare-db] Prisma client already exists (locked by running local dev server), continuing build."
      );
    } else {
      throw err;
    }
  }
}
