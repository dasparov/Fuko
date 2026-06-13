import { beforeEach, describe, expect, it, vi } from "vitest"

const signInMock = vi.fn()

vi.mock("@/auth", () => ({ signIn: signInMock }))

function postRequest(body: unknown) {
  return new Request("http://localhost/api/auth/email-otp/verify", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  })
}

describe("POST /api/auth/email-otp/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 when email or code is missing", async () => {
    const { POST } = await import("@/app/api/auth/email-otp/verify/route")
    const res = await POST(postRequest({ email: "user@example.com" }))

    expect(res.status).toBe(400)
    expect(signInMock).not.toHaveBeenCalled()
  })

  it("signs in with the normalized credentials and returns success on a valid code", async () => {
    signInMock.mockResolvedValue(undefined)
    const { POST } = await import("@/app/api/auth/email-otp/verify/route")
    const res = await POST(postRequest({ email: "User@Example.com", code: " 123456 " }))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ success: true })
    expect(signInMock).toHaveBeenCalledWith("email-otp", {
      email: "user@example.com",
      code: "123456",
      redirect: false,
    })
  })

  it("returns success:false with 401 when sign-in rejects (bad/expired code)", async () => {
    signInMock.mockRejectedValue(new Error("CredentialsSignin"))
    const { POST } = await import("@/app/api/auth/email-otp/verify/route")
    const res = await POST(postRequest({ email: "user@example.com", code: "000000" }))

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({ success: false })
  })
})
