#!/usr/bin/env tsx
/**
 * One-time admin provisioning script.
 *
 * Usage (requires DATABASE_URL and tsx):
 *   DATABASE_URL=postgres://... npx tsx scripts/create-admin.ts
 *
 * Or with the project's .env.local:
 *   npx dotenv -e .env.local -- npx tsx scripts/create-admin.ts
 *
 * Security notes:
 *   - Prompts for email and password interactively — nothing is hardcoded.
 *   - Password is hashed with bcrypt (cost 12) before being stored.
 *   - The raw password is never logged or written to disk.
 *   - Cannot run during normal application startup.
 */

import { createInterface } from "readline";
import bcrypt from "bcryptjs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users } from "../src/db/schema/users";
import { eq } from "drizzle-orm";

async function prompt(question: string, silent = false): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: silent ? undefined : process.stdout });

  if (silent && process.stdout) {
    process.stdout.write(question);
    process.stdin.setRawMode?.(true);
    process.stdin.resume();
  }

  return new Promise(resolve => {
    if (silent) {
      let input = "";
      process.stdin.on("data", (char: Buffer) => {
        const c = char.toString("utf8");
        if (c === "\n" || c === "\r" || c === "") {
          process.stdin.setRawMode?.(false);
          process.stdin.pause();
          process.stdout?.write("\n");
          rl.close();
          resolve(input);
        } else if (c === "") {
          process.exit(1);
        } else if (c === "" || c === "\b") {
          input = input.slice(0, -1);
        } else {
          input += c;
        }
      });
    } else {
      rl.question(question, ans => { rl.close(); resolve(ans); });
    }
  });
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("ERROR: DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  console.log("\n═══════════════════════════════════════");
  console.log("  Stockifyy — Admin Account Provisioner ");
  console.log("═══════════════════════════════════════\n");

  const email    = (await prompt("Admin email address : ")).trim().toLowerCase();
  const password = await prompt("Admin password       : ", true);
  const confirm  = await prompt("Confirm password     : ", true);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("\nERROR: Invalid email address.");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("\nERROR: Password must be at least 12 characters.");
    process.exit(1);
  }
  if (password !== confirm) {
    console.error("\nERROR: Passwords do not match.");
    process.exit(1);
  }

  console.log("\nHashing password…");
  const passwordHash = await bcrypt.hash(password, 12);

  const client = postgres(url, { max: 1 });
  const db     = drizzle(client);

  try {
    const [existing] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email));

    if (existing) {
      await db.update(users).set({
        passwordHash,
        role: "admin",
        isActive: true,
        updatedAt: new Date(),
      }).where(eq(users.email, email));
      console.log(`\n✓ Updated existing user <${email}> → role=admin, is_active=true, password reset.`);
    } else {
      const fullName = (await prompt("Full name            : ")).trim() || "Admin";
      await db.insert(users).values({
        email,
        passwordHash,
        fullName,
        role: "admin",
        isActive: true,
      });
      console.log(`\n✓ Created admin user <${email}> (${fullName}).`);
    }

    console.log("\nLogin at: /auth/login\n");
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error("\nFailed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
