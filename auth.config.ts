import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,   // 🔥 Fix MissingSecret
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.employeeId = (user as any).employeeId
        token.supervisorId = (user as any).supervisorId || null
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.employeeId = token.employeeId as string
        session.user.supervisorId = token.supervisorId as string | null
      }
      return session
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        employeeId: { label: "Employee ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.employeeId || !credentials?.password) {
          console.log("Missing credentials")
          return null
        }

        const user = await prisma.user.findUnique({
          where: { employeeId: credentials.employeeId },
        })

        if (!user) {
          console.log("User not found")
          return null
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password,
          (user as any).password
        )

        if (!passwordsMatch) {
          console.log("Password mismatch")
          return null
        }

        console.log("User authenticated successfully:", user.employeeId)

        return {
          id: user.id,
          name: `${(user as any).firstName ?? ""} ${(user as any).lastName ?? ""}`.trim(),
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          supervisorId: user.supervisorId ?? undefined,
        }
      },
    }),
  ],
} satisfies NextAuthConfig

// 🔥 Glue code: this gives you handlers & auth()
export const { handlers, auth } = NextAuth(authConfig)
