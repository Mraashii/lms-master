import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

// Debug log to confirm the secret is loaded in production
if (!process.env.NEXTAUTH_SECRET) {
  console.error("❌ NEXTAUTH_SECRET is undefined in production")
} else {
  console.log("✅ NEXTAUTH_SECRET loaded")
}
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
 secret: process.env.NEXTAUTH_SECRET || "fallback-secret",  // make it explicit
  ...authConfig,
})
