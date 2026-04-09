/**
 * middleware.ts
 * ──────────────────────────────────────────────────────────
 * Lightweight middleware — just prevents authenticated users
 * from seeing auth pages (/login, /register).
 *
 * We can't reliably verify Firebase tokens at the edge without
 * a heavy setup, so we let the client-side <AuthGuard> handle
 * protecting dashboard routes (it shows a spinner while
 * Firebase resolves the session, then redirects if not authed).
 *
 * The only thing we do here is set/clear a simple presence
 * cookie (fintrack-auth) from the client, which we check to
 * bounce logged-in users away from login/register pages.
 * ──────────────────────────────────────────────────────────
 */

import { NextResponse, type NextRequest } from "next/server"

// Pages that logged-in users should be bounced away from
const AUTH_PAGES = ["/login", "/register"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check the presence cookie (set by AuthContext on login)
  const isAuthenticated = request.cookies.has("fintrack-auth")
  const isAuthPage      = AUTH_PAGES.some((p) => pathname.startsWith(p))

  // If already signed in, don't show login/register
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Everything else: let the client-side AuthGuard handle it
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.png).*)"],
}
