import { Resend } from "resend"

/**
 * Thin Resend wrapper. Sends a transactional email carrying a 6-digit OTP.
 * Reads RESEND_API_KEY and RESEND_FROM_EMAIL from the environment.
 */
/**
 * Notify every admin (ADMIN_EMAILS, comma-separated). Used by the order
 * safety net, so unlike sendOtpEmail it never throws — a broken email must
 * not break checkout. Returns whether the send was accepted.
 */
export async function sendAdminEmail(subject: string, text: string): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM_EMAIL
    const to = (process.env.ADMIN_EMAILS || "")
      .split(",").map(e => e.trim()).filter(Boolean)
    if (!apiKey || !from || to.length === 0) return false

    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({ from, to, subject, text })
    if (error) console.error("Admin email failed:", error.message)
    return !error
  } catch (err) {
    console.error("Admin email failed:", err)
    return false
  }
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) {
    throw new Error(
      "Resend is not configured: set RESEND_API_KEY and RESEND_FROM_EMAIL",
    )
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `Your FUKO verification code: ${code}`,
    text: `Your FUKO verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
  })

  if (error) {
    throw new Error(`Failed to send OTP email: ${error.message}`)
  }
}
