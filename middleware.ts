/**
 * middleware.ts  (Next.js Edge Middleware)
 * ──────────────────────────────────────────────────────────
 * Protects routes by checking for the Firebase auth cookie.
 *
 * • Unauthenticated users trying to visit /dashboard-like pages
 *   are redirected to /login.
 * • Authenticated users visiting /login or /register are
 *   redirected back to the dashboard.
 *
 * HOW IT WORKS:
 * Firebase Auth sets a cookie called "__session" when the user
 * is signed in. We check for that cookie's presence here.
 * (Full server-side token verification is possible but out of
 * scope for this beginner project — the client-side AuthContext
 * also protects the UI.)
 * ──────────────────────────────────────────────────────────
 */

import { NextResponse, type NextRequest } from "next/server"

// Pages that require authentication
const PROTECTED_PATHS  = ["/", "/transactions", "/reports", "/settings"]
// Pages that authenticated users should be bounced away from
const AUTH_PAGES       = ["/login", "/register"]

export function middleware(request: NextRequest) {
  const { pathname }  = request.nextUrl

  // Firebase stores the auth token in this cookie after login
  // (set by our client-side code via firebase.ts)
  const isAuthenticated = request.cookies.has("fintrack-auth")

  const isProtectedPath  = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  const isAuthPage       = AUTH_PAGES.some((p) => pathname.startsWith(p))

  // Redirect unauthenticated users away from protected pages
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect already-authenticated users away from auth pages
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Run middleware on all pages except static files and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.png).*)"],
}
