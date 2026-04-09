import { AppSidebar } from "@/components/app-sidebar"
import { TopNavbar }   from "@/components/top-navbar"
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      {/* SidebarInset fills remaining space and handles sidebar offset */}
      <SidebarInset className="flex min-h-0 flex-col">
        <TopNavbar />
        {/* main must scroll independently — overflow-y-auto with flex-1 */}
        <main className="flex-1 overflow-y-auto pb-safe">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
