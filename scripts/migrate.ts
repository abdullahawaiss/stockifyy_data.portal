import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as dotenv from "dotenv";

// Load .env.local in development. In production env vars are set by the host.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env.production" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("ERROR: DATABASE_URL is not set.");
  process.exit(1);
}

async function main() {
  const client = postgres(connectionString!, { max: 1, ssl: process.env.NODE_ENV === "production" ? "require" : false });
  const db = drizzle(client);
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  console.log("Migrations complete.");
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
