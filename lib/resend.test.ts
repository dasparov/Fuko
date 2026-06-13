import { beforeEach, describe, expect, it, vi } from "vitest"

const sendMock = vi.fn()

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({ emails: { send: sendMock } })),
}))

describe("sendOtpEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = "test-key"
    process.env.RESEND_FROM_EMAIL = "noreply@fuko.test"
  })

  it("sends an email to the recipient containing the code", async () => {
    sendMock.mockResolvedValue({ data: { id: "msg_1" }, error: null })
    const { sendOtpEmail } = await import("@/lib/resend")

    await sendOtpEmail("user@example.com", "123456")

    expect(sendMock).toHaveBeenCalledOnce()
    const payload = sendMock.mock.calls[0][0]
    expect(payload.to).toBe("user@example.com")
    expect(payload.from).toBe("noreply@fuko.test")
    expect(`${payload.subject} ${payload.text ?? ""} ${payload.html ?? ""}`).toContain(
      "123456",
    )
  })

  it("throws when Resend is not configured", async () => {
    delete process.env.RESEND_API_KEY
    const { sendOtpEmail } = await import("@/lib/resend")

    await expect(sendOtpEmail("user@example.com", "123456")).rejects.toThrow()
  })

  it("throws when Resend returns an error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "domain not verified" } })
    const { sendOtpEmail } = await import("@/lib/resend")

    await expect(sendOtpEmail("user@example.com", "123456")).rejects.toThrow(
      /domain not verified/,
    )
  })
})
