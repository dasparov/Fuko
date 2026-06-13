import { sql } from "@vercel/postgres"
import { randomBytes, randomInt, scrypt, timingSafeEqual } from "crypto"
import { promisify } from "util"

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>

const OTP_TTL_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5
const SCRYPT_KEYLEN = 64

async function deriveHex(code: string, salt: string): Promise<string> {
  const derived = await scryptAsync(code, salt, SCRYPT_KEYLEN)
  return derived.toString("hex")
}

function encodeStoredHash(salt: string, derivedHex: string): string {
  return `${salt}:${derivedHex}`
}

function decodeStoredHash(
  stored: string,
): { salt: string; derivedHex: string } | null {
  const idx = stored.indexOf(":")
  if (idx < 0) return null
  return { salt: stored.slice(0, idx), derivedHex: stored.slice(idx + 1) }
}

export async function generateAndStoreEmailOtp(email: string): Promise<string> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0")
  const salt = randomBytes(16).toString("hex")
  const derivedHex = await deriveHex(code, salt)
  const stored = encodeStoredHash(salt, derivedHex)
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString()

  await sql`
    INSERT INTO email_otp_codes (email, code_hash, expires_at, attempts, created_at)
    VALUES (${email}, ${stored}, ${expiresAt}, 0, NOW())
    ON CONFLICT (email) DO UPDATE SET
      code_hash = EXCLUDED.code_hash,
      expires_at = EXCLUDED.expires_at,
      attempts = 0,
      created_at = NOW()
  `

  return code
}

export type EmailOtpUser = {
  id: string
  email: string
  name: string | null
  image: string | null
}

export async function verifyEmailOtpCode(
  email: string,
  code: string,
): Promise<EmailOtpUser | null> {
  const lookup = await sql`
    SELECT code_hash, expires_at, attempts
    FROM email_otp_codes
    WHERE email = ${email}
  `
  const row = lookup.rows[0]
  if (!row) return null

  if (new Date(row.expires_at as string) < new Date()) {
    await sql`DELETE FROM email_otp_codes WHERE email = ${email}`
    return null
  }

  if ((row.attempts as number) >= MAX_ATTEMPTS) {
    await sql`DELETE FROM email_otp_codes WHERE email = ${email}`
    return null
  }

  const parts = decodeStoredHash(row.code_hash as string)
  if (!parts) return null

  const expectedHex = await deriveHex(code, parts.salt)
  const storedBuf = Buffer.from(parts.derivedHex, "hex")
  const expectedBuf = Buffer.from(expectedHex, "hex")
  const match =
    storedBuf.length === expectedBuf.length &&
    timingSafeEqual(storedBuf, expectedBuf)

  if (!match) {
    await sql`
      UPDATE email_otp_codes
      SET attempts = attempts + 1
      WHERE email = ${email}
    `
    return null
  }

  await sql`DELETE FROM email_otp_codes WHERE email = ${email}`

  const upsert = await sql`
    INSERT INTO users (email, "emailVerified", created_at)
    VALUES (${email}, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
      "emailVerified" = COALESCE(users."emailVerified", NOW())
    RETURNING id, email, name, image
  `
  const user = upsert.rows[0]
  if (!user) return null

  return {
    id: String(user.id),
    email: user.email as string,
    name: (user.name as string | null) ?? null,
    image: (user.image as string | null) ?? null,
  }
}
