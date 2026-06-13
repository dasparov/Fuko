-- 001_nextauth_schema.sql
-- Switch the active users table from phone-OTP shape to NextAuth (Auth.js v5)
-- shape, while preserving the old table's data under a parked name.
--
-- Old `users` table:                  PK = phone_number, fields = name, addresses, created_at
-- New `users` table (this migration): PK = id (SERIAL),  fields per @auth/pg-adapter
--                                     + app columns: phone, addresses, created_at
--
-- The rename below preserves all existing rows; nothing is deleted.

-- Rename the old phone-OTP users table out of the way, but only if:
--   (a) the current `users` table is the old shape (has a `phone_number` column), AND
--   (b) `users_parked_phone_otp` doesn't already exist.
-- This makes the rename a no-op on a fresh DB and on any re-run.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'phone_number'
  )
  AND NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'users_parked_phone_otp'
  )
  THEN
    EXECUTE 'ALTER TABLE users RENAME TO users_parked_phone_otp';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(255),
  email           VARCHAR(255) UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image           TEXT,
  phone           VARCHAR(20),
  addresses       JSONB NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id                  SERIAL PRIMARY KEY,
  "userId"            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                VARCHAR(255) NOT NULL,
  provider            VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token       TEXT,
  access_token        TEXT,
  expires_at          BIGINT,
  id_token            TEXT,
  scope               TEXT,
  session_state       TEXT,
  token_type          TEXT,
  UNIQUE(provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  id             SERIAL PRIMARY KEY,
  "userId"       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires        TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_token (
  identifier TEXT NOT NULL,
  expires    TIMESTAMPTZ NOT NULL,
  token      TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS email_otp_codes (
  email      VARCHAR(255) PRIMARY KEY,
  code_hash  TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_otp_codes_expires ON email_otp_codes (expires_at);
