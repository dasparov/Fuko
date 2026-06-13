import { NextResponse } from "next/server"
import twilio from "twilio"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

const client = twilio(accountSid, authToken)

export async function POST(req: Request) {
    try {
        const { phoneNumber } = await req.json()

        if (!phoneNumber) {
            return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
        }

        // --- DEV BYPASS ---
        // Verify specifically for 9999999999 to allow login without credits
        if (phoneNumber === "9999999999") {
            return NextResponse.json({ success: true, status: "pending", bypass: true })
        }

        if (!accountSid || !authToken || !verifyServiceSid) {
            console.error("Missing Twilio configuration")
            return NextResponse.json({ error: "Twilio configuration is missing on server" }, { status: 500 })
        }

        const verification = await client.verify.v2.services(verifyServiceSid)
            .verifications
            .create({ to: `+91${phoneNumber}`, channel: "whatsapp" })

        return NextResponse.json({ success: true, status: verification.status })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
        console.error("Twilio Send Error:", error)
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
