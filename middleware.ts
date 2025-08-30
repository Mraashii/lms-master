import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { auth: session } = req
  const isLoggedIn = !!session?.user
  const { pathname } = req.nextUrl

  const isAuthRoute = pathname.startsWith("/api/auth")  // ✅ Let NextAuth handle its own routes
  const isPublicPage = pathname === "/" || pathname === "/sign-in"

  // Always allow NextAuth API
  if (isAuthRoute) return

  // Allow public pages
  if (isPublicPage) return

  // Protect /dashboard and other private routes
  if (!isLoggedIn && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  // Redirect authenticated users from "/" to "/dashboard"
  if (isLoggedIn && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|gif|svg|ico|webp)).*)",
  ],
}
