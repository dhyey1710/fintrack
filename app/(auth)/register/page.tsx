/**
 * app/(auth)/register/page.tsx
 * ──────────────────────────────────────────────────────────
 * Registration page — creates a new Firebase Auth user and
 * saves their display name, then redirects to the dashboard.
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

export default function RegisterPage() {
  const [name,            setName]            = useState("")
  const [email,           setEmail]           = useState("")
  const [password,        setPassword]        = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword,    setShowPassword]    = useState(false)
  const [error,           setError]           = useState("")
  const [loading,         setLoading]         = useState(false)

  const { signup } = useAuth()
  const router     = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    // Client-side validation
    if (password !== confirmPassword) {
      return setError("Passwords do not match.")
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.")
    }

    setLoading(true)

    try {
      // TODO: Calls Firebase Auth createUserWithEmailAndPassword
      await signup(email, password, name)
      router.push("/")   // Redirect to dashboard after successful registration
    } catch (err: any) {
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("An account with this email already exists.")
          break
        case "auth/invalid-email":
          setError("Invalid email address.")
          break
        case "auth/weak-password":
          setError("Password should be at least 6 characters.")
          break
        default:
          setError("Failed to create account. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left: Gradient branding panel ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 p-12 lg:flex lg:w-1/2">
        <div className="absolute -left-32 -top-32 size-96 rounded-full bg-white/10" />
        <div className="absolute -right-32 top-1/2 size-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 left-1/3 size-64 rounded-full bg-white/10" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <TrendingUp className="size-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">FinTrack</span>
        </div>

        <div className="relative space-y-4">
          <h2 className="text-4xl font-bold leading-tight text-white">
            Start your journey<br />to financial freedom
          </h2>
          <p className="text-lg text-white/70">
            Join students who track their money smarter with FinTrack.
          </p>
        </div>

        {/* Social proof widget */}
        <div className="relative rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["V", "K", "M", "R"].map((letter, i) => (
                <div
                  key={i}
                  className="flex size-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white"
                  style={{ background: ["#6366f1", "#8b5cf6", "#ec4899", "#10b981"][i] }}
                >
                  {letter}
                </div>
              ))}
            </div>
            <p className="text-sm text-white/80">Join 2,400+ users</p>
          </div>
          <p className="text-sm text-white/90">
            &ldquo;FinTrack helped me save 30% more by identifying unnecessary expenses.&rdquo;
          </p>
        </div>
      </div>

      {/* ── Right: Register form ── */}
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
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-1 text-muted-foreground">Start tracking your finances for free</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

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
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
