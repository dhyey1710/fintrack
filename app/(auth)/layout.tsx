/**
 * app/(auth)/layout.tsx
 * Minimal layout for the auth pages (login / register).
 * No sidebar, just a clean full-screen layout.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
