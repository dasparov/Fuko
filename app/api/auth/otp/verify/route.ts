import { NextResponse } from "next/server"
import twilio from "twilio"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

const client = twilio(accountSid, authToken)

export async function POST(req: Request) {
    try {
        const { phoneNumber, code } = await req.json()

        if (!phoneNumber || !code) {
            return NextResponse.json({ error: "Phone number and code are required" }, { status: 400 })
        }

        // --- DEV BYPASS ---
        if (phoneNumber === "9999999999" && code === "1234") {
            return NextResponse.json({ success: true, bypass: true })
        }

        if (!accountSid || !authToken || !verifyServiceSid) {
            return NextResponse.json({ error: "Twilio configuration is missing on server" }, { status: 500 })
        }

        const verificationCheck = await client.verify.v2.services(verifyServiceSid)
            .verificationChecks
            .create({ to: `+91${phoneNumber}`, code })

        if (verificationCheck.status === "approved") {
            return NextResponse.json({ success: true })
        } else {
            return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 })
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
        console.error("Twilio Verify Error:", error)
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
