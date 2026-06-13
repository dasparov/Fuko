import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

import { generateAndStoreEmailOtp } from "@/lib/email-otp"
import { sendOtpEmail } from "@/lib/resend"

const MAX_SENDS = 3
const WINDOW_SECONDS = 15 * 60
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  let email: string
  try {
    const body = await req.json()
    email = String(body?.email ?? "").toLowerCase().trim()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
  }

  // Rate limit: at most MAX_SENDS per email per WINDOW_SECONDS.
  // Fail open — if KV is unavailable we'd rather let sign-in proceed (logging a
  // warning) than block all logins. While KV is down there is no send throttle.
  const key = `email-otp:send:${email}`
  let count: number | null = null
  try {
    count = await kv.incr(key)
    if (count === 1) {
      await kv.expire(key, WINDOW_SECONDS)
    }
  } catch (err) {
    console.warn("email-otp rate-limit unavailable (KV error), proceeding without throttle:", err)
    count = null
  }
  if (count !== null && count > MAX_SENDS) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    )
  }

  // Generate, store, and email the code. We always return the same shape
  // whether or not an account exists for this email — no account enumeration.
  try {
    const code = await generateAndStoreEmailOtp(email)
    await sendOtpEmail(email, code)
  } catch (err) {
    console.error("email-otp send failed:", err)
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
