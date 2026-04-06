/**
 * components/auth-guard.tsx
 * ──────────────────────────────────────────────────────────
 * Client-side route guard — a second layer of protection on
 * top of the server middleware. Wraps any page that requires
 * authentication and redirects if the user is not logged in.
 *
 * Usage: wrap any "use client" page with <AuthGuard>
 * ──────────────────────────────────────────────────────────
 */

"use client"

import { useEffect }   from "react"
import { useRouter }   from "next/navigation"
import { useAuth }     from "@/contexts/AuthContext"
import { Loader2 }     from "lucide-react"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Once we know the auth state, redirect if not logged in
    if (!loading && !currentUser) {
      router.replace("/login")
    }
  }, [currentUser, loading, router])

  // Show a spinner while Firebase is resolving the auth state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  // Not logged in — don't flash protected content
  if (!currentUser) return null

  return <>{children}</>
}
