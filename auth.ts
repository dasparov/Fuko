import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import PostgresAdapter from "@auth/pg-adapter"
import { Pool } from "pg"

import { verifyEmailOtpCode } from "@/lib/email-otp"

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      id: "email-otp",
      name: "Email OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.code) return null
        const email = String(creds.email).toLowerCase().trim()
        const code = String(creds.code).trim()
        if (!/^\d{6}$/.test(code)) return null

        const user = await verifyEmailOtpCode(email, code)
        if (!user) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as { id?: string }).id
      }
      return token
    },
    async session({ session, token }) {
      if (token?.userId && session.user) {
        ;(session.user as { id?: string }).id = String(token.userId)
      }
      return session
    },
  },
})
