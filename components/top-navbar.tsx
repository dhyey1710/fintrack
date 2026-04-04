/**
 * components/top-navbar.tsx
 * ──────────────────────────────────────────────────────────
 * Top header bar — shows:
 *  • Current date
 *  • Dark/light mode toggle
 *  • User avatar with dropdown (real name/email from Firebase)
 *  • Sign out button (calls Firebase Auth signOut)
 * ──────────────────────────────────────────────────────────
 */

"use client"

import { useRouter }  from "next/navigation"
import { LogOut, Moon, Sun } from "lucide-react"
import { useTheme }   from "next-themes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button }     from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth }    from "@/contexts/AuthContext"

export function TopNavbar() {
  const { setTheme, theme } = useTheme()
  const { currentUser, logout } = useAuth()
  const router = useRouter()

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  // Derive initials for the avatar fallback
  const initials = currentUser?.displayName
    ? currentUser.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : currentUser?.email?.[0]?.toUpperCase() ?? "U"

  async function handleLogout() {
    try {
      await logout()
      router.replace("/login")
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1" />

      <div className="flex flex-1 items-center gap-4">
        <span className="hidden text-sm text-muted-foreground sm:inline-block">
          {currentDate}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun  className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* User menu — shows real Firebase displayName + email */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="size-8">
                <AvatarImage src={currentUser?.photoURL ?? ""} alt="User avatar" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                {/* Real user name from Firebase Auth */}
                <p className="text-sm font-medium leading-none">
                  {currentUser?.displayName ?? "Anonymous"}
                </p>
                {/* Real user email from Firebase Auth */}
                <p className="text-xs leading-none text-muted-foreground">
                  {currentUser?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Sign out — calls Firebase Auth signOut */}
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 size-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
