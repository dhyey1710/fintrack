/**
 * contexts/AuthContext.tsx
 * ──────────────────────────────────────────────────────────
 * Provides the current Firebase user + helper functions
 * (signup, login, logout) to the entire app via React Context.
 *
 * Usage:
 *   const { currentUser, login, logout } = useAuth()
 * ──────────────────────────────────────────────────────────
 */

"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth"
import { auth } from "@/lib/firebase"

// ─── Types ──────────────────────────────────────────────
interface AuthContextType {
  currentUser: User | null
  loading: boolean
  signup:  (email: string, password: string, displayName: string) => Promise<void>
  login:   (email: string, password: string) => Promise<void>
  logout:  () => Promise<void>
}

// ─── Context ────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null)

// ─── Provider ───────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  // loading = true while we're waiting for Firebase to tell us
  // who is logged in (avoids a flash of the login page on refresh)
  const [loading, setLoading] = useState(true)

  /** Create a new user, then set their display name */
  async function signup(email: string, password: string, displayName: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    // Firebase creates the account; now add the name
    await updateProfile(result.user, { displayName })
  }

  /** Sign in with email + password */
  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  /** Sign out the current user */
  async function logout() {
    await signOut(auth)
  }

  // Listen for auth state changes once on mount.
  // onAuthStateChanged fires immediately with the current user
  // (null if not logged in) and again whenever it changes.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false) // We now know the auth state — safe to render
    })
    return unsubscribe // Clean up the listener on unmount
  }, [])

  const value: AuthContextType = { currentUser, loading, signup, login, logout }

  return (
    <AuthContext.Provider value={value}>
      {/* Only render children once we know the auth state.
          This prevents a flash of the wrong UI on page load. */}
      {!loading && children}
    </AuthContext.Provider>
  )
}

// ─── Hook ───────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>")
  }
  return context
}
