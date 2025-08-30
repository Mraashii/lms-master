import { auth } from "@/auth"

export default auth((req) => {
  const { auth: session } = req
  const isLoggedIn = !!session?.user
  const { pathname } = req.nextUrl

  const isOnPublicPage = pathname === "/"
  const isOnSignIn = pathname === "/sign-in"
  const isOnDashboard = pathname.startsWith("/dashboard")

  // Allow access to public pages and sign-in page
  if (isOnPublicPage || isOnSignIn) {
    if (isLoggedIn && isOnPublicPage) {
      // redirect logged-in users from "/" → "/dashboard"
      return Response.redirect(new URL("/dashboard", req.nextUrl))
    }
    return
  }

  // Redirect unauthenticated users trying to access protected pages
  if (!isLoggedIn && isOnDashboard) {
    return Response.redirect(new URL("/sign-in", req.nextUrl))
  }

  return
})

// Force middleware to run in Node.js runtime so NEXTAUTH_SECRET is visible
export const config = {
  matcher: ["/dashboard/:path*", "/"],
  runtime: "nodejs",
}
