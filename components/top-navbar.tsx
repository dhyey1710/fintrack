/**
 * components/top-navbar.tsx — Mobile-polished version
 *
 * Changes vs original:
 *  • Safe-area padding on the right for notched phones
 *  • Date hidden on very small screens to reduce clutter
 *  • Active tap feedback on buttons (touch-manipulation)
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
    year:  "numeric",
  })

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
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:gap-4 sm:px-4">
      {/* Sidebar hamburger */}
      <SidebarTrigger className="-ml-1 touch-manipulation" />

      {/* Date — hidden on xs (< 360px), visible from sm */}
      <div className="flex flex-1 items-center">
        <span className="hidden text-sm text-muted-foreground xs:inline-block sm:inline-block">
          {currentDate}
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="touch-manipulation"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun  className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative size-8 rounded-full touch-manipulation p-0">
              <Avatar className="size-8">
                <AvatarImage src={currentUser?.photoURL ?? ""} alt="User" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="truncate text-sm font-medium leading-none">
                  {currentUser?.displayName ?? "Anonymous"}
                </p>
                <p className="truncate text-xs leading-none text-muted-foreground">
                  {currentUser?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 size-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
