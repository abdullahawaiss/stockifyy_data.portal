import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const isProd = process.env.NODE_ENV === "production";

const client = postgres(connectionString, {
  max: isProd ? 10 : 3,
  idle_timeout: 30,
  connect_timeout: 10,
  // Production cloud DBs (Neon, Supabase, Railway, RDS) require SSL.
  // Local docker postgres does not — SSL auto-detected from connection string.
  ssl: isProd ? "require" : false,
  prepare: false, // required for serverless/edge connection poolers (PgBouncer, Neon)
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
