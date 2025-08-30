import NextAuth from "next-auth"
import { authConfig } from "./auth.config"


if (!process.env.NEXTAUTH_SECRET) {
  console.error("❌ NEXTAUTH_SECRET is undefined in production")
} else {
  console.log("✅ NEXTAUTH_SECRET loaded")
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,   // 🔑 add this line
  ...authConfig,
})

