import { NextResponse } from "next/server"

import { signIn } from "@/auth"

// Phase 1 server-side verify route. NOTE: in Phase 3 the AuthPanel will likely
// call signIn("email-otp", ...) client-side instead — that's the reliable way to
// set the session cookie in the browser with a Credentials provider — which may
// make this route redundant. Kept now so Phase 1 is complete and testable on its
// own. Revisit cookie behaviour when wiring the UI.
export async function POST(req: Request) {
  let email: string
  let code: string
  try {
    const body = await req.json()
    email = String(body?.email ?? "").toLowerCase().trim()
    code = String(body?.code ?? "").trim()
  } catch {
    return NextResponse.json({ success: false }, { status: 400 })
  }

  if (!email || !code) {
    return NextResponse.json({ success: false }, { status: 400 })
  }

  try {
    await signIn("email-otp", { email, code, redirect: false })
  } catch {
    return NextResponse.json({ success: false }, { status: 401 })
  }

  return NextResponse.json({ success: true })
}
