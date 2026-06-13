import { beforeEach, describe, expect, it, vi } from "vitest"

const sqlMock = vi.fn()
const authMock = vi.fn()

vi.mock("@vercel/postgres", () => ({ sql: sqlMock }))
vi.mock("@/auth", () => ({ auth: authMock }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@vercel/kv", () => ({ kv: {} }))

describe("getUserProfileAction (by user id)", () => {
  beforeEach(() => vi.clearAllMocks())

  it("maps a users row to a UserProfile", async () => {
    sqlMock.mockResolvedValueOnce({
      rows: [
        {
          id: 7,
          name: "Asha",
          email: "asha@example.com",
          phone: "9990001111",
          addresses: [
            { type: "Home", line1: "1 St", line2: "", city: "X", state: "Y", pincode: "123456" },
          ],
        },
      ],
    })
    const { getUserProfileAction } = await import("@/app/actions")
    const profile = await getUserProfileAction("7")

    expect(profile).toEqual({
      id: "7",
      name: "Asha",
      email: "asha@example.com",
      phone: "9990001111",
      addresses: [
        { type: "Home", line1: "1 St", line2: "", city: "X", state: "Y", pincode: "123456" },
      ],
    })
  })

  it("returns null when no row exists", async () => {
    sqlMock.mockResolvedValueOnce({ rows: [] })
    const { getUserProfileAction } = await import("@/app/actions")
    expect(await getUserProfileAction("999")).toBeNull()
  })
})

describe("updateUserProfileAction (session-based)", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns false when there is no authenticated session", async () => {
    authMock.mockResolvedValue(null)
    const { updateUserProfileAction } = await import("@/app/actions")
    expect(await updateUserProfileAction({ name: "Nope" })).toBe(false)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it("merges provided fields over existing and updates the row by id", async () => {
    authMock.mockResolvedValue({ user: { id: "7" } })
    // getUserProfileAction's SELECT (existing row)
    sqlMock.mockResolvedValueOnce({
      rows: [{ id: 7, name: "Old", email: "a@b.com", phone: "999", addresses: [] }],
    })
    // the UPDATE
    sqlMock.mockResolvedValueOnce({ rows: [] })

    const { updateUserProfileAction } = await import("@/app/actions")
    const ok = await updateUserProfileAction({ name: "New" })

    expect(ok).toBe(true)
    // Second sql call is the UPDATE; tagged-template values follow the strings array.
    const updateValues = sqlMock.mock.calls[1].slice(1)
    expect(updateValues[0]).toBe("New") // name updated
    expect(updateValues[1]).toBe("999") // phone preserved
    expect(updateValues[2]).toBe("[]") // addresses preserved (serialized)
    expect(updateValues[3]).toBe("7") // WHERE id
  })

  it("persists a newly collected phone", async () => {
    authMock.mockResolvedValue({ user: { id: "7" } })
    sqlMock.mockResolvedValueOnce({
      rows: [{ id: 7, name: "Asha", email: "a@b.com", phone: "", addresses: [] }],
    })
    sqlMock.mockResolvedValueOnce({ rows: [] })

    const { updateUserProfileAction } = await import("@/app/actions")
    const ok = await updateUserProfileAction({ phone: "9876543210" })

    expect(ok).toBe(true)
    const updateValues = sqlMock.mock.calls[1].slice(1)
    expect(updateValues[1]).toBe("9876543210")
  })
})
