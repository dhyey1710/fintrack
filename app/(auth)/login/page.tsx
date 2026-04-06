/**
 * app/(auth)/login/page.tsx
 * ──────────────────────────────────────────────────────────
 * Login page — uses Firebase Auth email/password sign-in.
 * After a successful login, redirects to /dashboard (/).
 * ──────────────────────────────────────────────────────────
 */

"use client"

import { useState }          from "react"
import Link                  from "next/link"
import { useRouter }         from "next/navigation"
import { Eye, EyeOff, TrendingUp } from "lucide-react"
import { Button }            from "@/components/ui/button"
import { Input }             from "@/components/ui/input"
import { Label }             from "@/components/ui/label"
import { useAuth }           from "@/contexts/AuthContext"

export default function LoginPage() {
  const [email,        setEmail]        = useState("")
  const [password,     setPassword]     = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error,        setError]        = useState("")
  const [loading,      setLoading]      = useState(false)

  const { login } = useAuth()
  const router    = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // TODO: Firebase login happens here
      await login(email, password)
      router.push("/")          // Redirect to dashboard on success
    } catch (err: any) {
      // Map Firebase error codes to friendly messages
      switch (err.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Invalid email or password. Please try again.")
          break
        case "auth/too-many-requests":
          setError("Too many attempts. Please wait a moment and try again.")
          break
        default:
          setError("Failed to sign in. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left: Gradient branding panel ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 p-12 lg:flex lg:w-1/2">
        {/* Decorative circles */}
        <div className="absolute -left-32 -top-32 size-96 rounded-full bg-white/10" />
        <div className="absolute -right-32 top-1/2 size-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 left-1/3 size-64 rounded-full bg-white/10" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <TrendingUp className="size-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">FinTrack</span>
        </div>

        {/* Hero text */}
        <div className="relative space-y-4">
          <h2 className="text-4xl font-bold leading-tight text-white">
            Take control of<br />your finances
          </h2>
          <p className="text-lg text-white/70">
            Track expenses, analyse spending patterns, and build better financial habits — all in one place.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative space-y-3">
          {[
            { icon: "📊", text: "Real-time spending analytics" },
            { icon: "🔒", text: "Secure with Firebase Auth" },
            { icon: "📱", text: "Works on any device" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-white/80">
              <span className="text-xl">{icon}</span>
              <span className="text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Login form ── */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
              <TrendingUp className="size-4 text-white" />
            </div>
            <span className="text-lg font-bold">FinTrack</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-muted-foreground">Sign in to your FinTrack account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeOff className="size-4" />
                    : <Eye     className="size-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
