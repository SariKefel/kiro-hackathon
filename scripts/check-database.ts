import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { is } from "drizzle-orm";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import { getDb } from "../src/db";
import * as schema from "../src/db/schema";

loadEnvConfig(process.cwd());

let stage = "environment configuration";

try {
  const pooledUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DATABASE_URL_UNPOOLED;
  if (!pooledUrl) throw new Error("Missing application connection.");

  if (directUrl) {
    const pooled = new URL(pooledUrl);
    const direct = new URL(directUrl);
    if (
      direct.hostname.includes("-pooler.") ||
      pooled.hostname.replace("-pooler.", ".") !== direct.hostname ||
      pooled.pathname !== direct.pathname
    ) {
      throw new Error("Connection URLs must target the same database with a direct migration URL.");
    }
  }

  stage = "application connection and schema verification";
  const db = getDb();
  const tables = Object.values<unknown>(schema).filter((value): value is PgTable =>
    is(value, PgTable),
  );
  await Promise.all(tables.map((table) => db.select().from(table).limit(0)));

  stage = "migration history verification";
  const query = neon(directUrl || pooledUrl);
  const applied = await query`SELECT hash, created_at
    FROM drizzle.__drizzle_migrations ORDER BY created_at, id`;
  const expected = readMigrationFiles({ migrationsFolder: "./src/db/migrations" });
  if (
    applied.length !== expected.length ||
    expected.some(
      (migration, index) =>
        migration.hash !== applied[index].hash ||
        String(migration.folderMillis) !== String(applied[index].created_at),
    )
  ) {
    throw new Error("Migration history differs from the repository.");
  }

  stage = "constraint verification";
  const invalid = await query`SELECT conname FROM pg_constraint
    WHERE connamespace = 'public'::regnamespace AND NOT convalidated`;
  if (invalid.length) throw new Error("Some database constraints have not been validated.");

  console.log(
    JSON.stringify({
      applicationConnection: "ok",
      migrationConnection: directUrl ? "ok (direct)" : "ok (application URL fallback)",
      tables: tables.map((table) => getTableConfig(table).name).sort(),
      appliedMigrations: applied.length,
      migrationHashes: "match repository",
      constraints: "validated",
    }),
  );
} catch {
  console.error(`Database check failed during ${stage}.`);
  process.exitCode = 1;
}
