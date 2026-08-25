-- Migration: add OAuth accounts, email verification tokens, and schema adjustments
-- Run this AFTER reviewing and BEFORE deploying Google auth to production.

-- 1. Make password_hash nullable — OAuth-only accounts have no password.
--    Existing admin-created users keep their hashes unchanged.
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- 2. Add email_verified flag.
--    Existing users are marked verified because they were created by admins
--    through the existing internal flow, not through the public self-signup path.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN NOT NULL DEFAULT false;
UPDATE "users" SET "email_verified" = true WHERE "email_verified" = false;

-- 3. Create oauth_accounts table.
--    provider_account_id = Google `sub` (stable identifier, never email).
CREATE TABLE IF NOT EXISTS "oauth_accounts" (
  "id"                  SERIAL PRIMARY KEY,
  "user_id"             INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider"            VARCHAR(50) NOT NULL,
  "provider_account_id" VARCHAR(255) NOT NULL,
  "created_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("provider", "provider_account_id")
);
CREATE INDEX IF NOT EXISTS "idx_oauth_user_id" ON "oauth_accounts"("user_id");

-- 4. Create email_verification_tokens table.
--    Only the SHA-256 hash of each token is stored, never the raw token.
--    Tokens are single-use and expire after 24 hours.
CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
  "id"          SERIAL PRIMARY KEY,
  "user_id"     INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash"  VARCHAR(64) NOT NULL UNIQUE,
  "expires_at"  TIMESTAMPTZ NOT NULL,
  "used_at"     TIMESTAMPTZ,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
