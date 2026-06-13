import { beforeEach, describe, expect, it, vi } from "vitest"

const generateMock = vi.fn()
const sendMock = vi.fn()
const incrMock = vi.fn()
const expireMock = vi.fn()

vi.mock("@/lib/email-otp", () => ({ generateAndStoreEmailOtp: generateMock }))
vi.mock("@/lib/resend", () => ({ sendOtpEmail: sendMock }))
vi.mock("@vercel/kv", () => ({ kv: { incr: incrMock, expire: expireMock } }))

function postRequest(body: unknown) {
  return new Request("http://localhost/api/auth/email-otp/send", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  })
}

describe("POST /api/auth/email-otp/send", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    incrMock.mockResolvedValue(1)
    expireMock.mockResolvedValue(1)
    generateMock.mockResolvedValue("123456")
    sendMock.mockResolvedValue(undefined)
  })

  it("rejects an invalid email with 400 and does no work", async () => {
    const { POST } = await import("@/app/api/auth/email-otp/send/route")
    const res = await POST(postRequest({ email: "not-an-email" }))

    expect(res.status).toBe(400)
    expect(generateMock).not.toHaveBeenCalled()
    expect(sendMock).not.toHaveBeenCalled()
  })

  it("generates and emails a code (normalizing the address), returns success", async () => {
    const { POST } = await import("@/app/api/auth/email-otp/send/route")
    const res = await POST(postRequest({ email: "User@Example.com" }))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ success: true })
    expect(generateMock).toHaveBeenCalledWith("user@example.com")
    expect(sendMock).toHaveBeenCalledWith("user@example.com", "123456")
  })

  it("sets the rate-limit window TTL on the first send", async () => {
    incrMock.mockResolvedValue(1)
    const { POST } = await import("@/app/api/auth/email-otp/send/route")
    await POST(postRequest({ email: "user@example.com" }))

    expect(expireMock).toHaveBeenCalledOnce()
  })

  it("rate-limits past the 3rd send in the window with 429 and does no work", async () => {
    incrMock.mockResolvedValue(4)
    const { POST } = await import("@/app/api/auth/email-otp/send/route")
    const res = await POST(postRequest({ email: "user@example.com" }))

    expect(res.status).toBe(429)
    expect(generateMock).not.toHaveBeenCalled()
    expect(sendMock).not.toHaveBeenCalled()
  })

  it("returns the same success shape regardless of account existence (no enumeration)", async () => {
    const { POST } = await import("@/app/api/auth/email-otp/send/route")
    const res = await POST(postRequest({ email: "stranger@example.com" }))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ success: true })
  })
})
