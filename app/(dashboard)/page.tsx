/**
 * app/(dashboard)/page.tsx  — Dashboard
 * ──────────────────────────────────────────────────────────
 * Main dashboard. All data comes from Firestore in real-time
 * via the useTransactions() hook.
 *
 * The page is protected by:
 *  1. Next.js middleware (server-side cookie check)
 *  2. <AuthGuard> component (client-side auth context check)
 * ──────────────────────────────────────────────────────────
 */

"use client"

import { AuthGuard }              from "@/components/auth-guard"
import { AddTransactionModal }    from "@/components/add-transaction-modal"
import { SmartQuickAdd }          from "@/components/dashboard/smart-quick-add"
import { BulkUploadModal }        from "@/components/dashboard/bulk-upload-modal"
import { RecentTransactions }     from "@/components/dashboard/recent-transactions"
import { SpendingChart }          from "@/components/dashboard/spending-chart"
import { SummaryCards }           from "@/components/dashboard/summary-cards"
import { TrendChart }             from "@/components/dashboard/trend-chart"
import { useAuth }                from "@/contexts/AuthContext"
import { useTransactions }        from "@/hooks/useTransactions"
import {
  calculateSummary,
  getDailySpending,
  getSpendingByCategory,
} from "@/lib/data"
import { Loader2, Plus } from "lucide-react"

// ── Dashboard content (rendered only when authenticated) ──
function DashboardContent() {
  const { currentUser }                                      = useAuth()
  const { transactions, loading, error, addTransaction, deleteTransaction } = useTransactions()

  const summary            = calculateSummary(transactions)
  const spendingByCategory = getSpendingByCategory(transactions)
  const dailySpending      = getDailySpending(transactions)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  // Get the user's first name (or fall back to "there")
  const firstName = currentUser?.displayName?.split(" ")[0] ?? "there"

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  // ── handlers ──────────────────────────────────────────
  const handleAddTransaction = async (newTransaction: Omit<import("@/lib/data").Transaction, "id">) => {
    try {
      // Writes to Firestore via useTransactions hook
      await addTransaction(newTransaction)
    } catch (err) {
      console.error("Dashboard – add transaction failed:", err)
      throw err // Rethrow to let the UI component (Modal/Quick Add) catch and display it
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    try {
      // Deletes document from Firestore
      await deleteTransaction(id)
    } catch (err) {
      console.error("Dashboard – delete transaction failed:", err)
      throw err
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 pb-24 md:pb-6 relative">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {getGreeting()}, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground">{currentDate}</p>
        </div>
        {/* We keep AddTransactionModal on desktop for manual fast-add */}
        <div className="hidden sm:block">
          <AddTransactionModal onAdd={handleAddTransaction} />
        </div>
      </div>

      {/* AI Smart Quick Add */}
      <SmartQuickAdd onAdd={handleAddTransaction} />

      {/* AI Bulk Import */}
      <BulkUploadModal variant="card" />

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary Cards — computed from real Firestore data */}
          <SummaryCards
            balance={summary.balance}
            income={summary.income}
            expenses={summary.expenses}
            savingsRate={summary.savingsRate}
          />

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <SpendingChart data={spendingByCategory} />
            <TrendChart    data={dailySpending} />
          </div>

          {/* Recent Transactions — last 6 from Firestore */}
          <RecentTransactions
            transactions={transactions}
            onDelete={handleDeleteTransaction}
          />
        </>
      )}

      {/* Premium Mobile FAB (hidden on desktop) */}
      <div className="fixed bottom-6 right-6 z-50 block sm:hidden">
        <AddTransactionModal 
          onAdd={handleAddTransaction}
          trigger={
            <button className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-primary/40 backdrop-blur-xl transition-all active:scale-90 border border-white/20 dark:border-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Plus className="size-6 relative z-10" />
            </button>
          }
        />
      </div>
    </div>
  )
}

// ── Page export — wraps content in AuthGuard ──────────────
export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
