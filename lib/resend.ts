import { Resend } from "resend"

/**
 * Thin Resend wrapper. Sends a transactional email carrying a 6-digit OTP.
 * Reads RESEND_API_KEY and RESEND_FROM_EMAIL from the environment.
 */
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
