import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

// Force Node.js runtime so env vars (like NEXTAUTH_SECRET) are always available
export const runtime = "nodejs"

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  ...authConfig,
})

export { handler as GET, handler as POST }
