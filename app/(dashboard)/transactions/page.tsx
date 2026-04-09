/**
 * app/(dashboard)/transactions/page.tsx
 * ──────────────────────────────────────────────────────────
 * Mobile-first full transaction list:
 *  • Mobile: stacked card list (no horizontal scroll)
 *  • Desktop: full table with filters
 *  • Floating "+" FAB on mobile for easy access
 * ──────────────────────────────────────────────────────────
 */

"use client"

import { useState, useMemo } from "react"
import { format }            from "date-fns"
import { CalendarIcon, Loader2, Search, Trash2, X } from "lucide-react"
import { AuthGuard }            from "@/components/auth-guard"
import { AddTransactionModal }  from "@/components/add-transaction-modal"
import { Badge }                from "@/components/ui/badge"
import { Button }               from "@/components/ui/button"
import { Calendar }             from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input }                from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useTransactions }      from "@/hooks/useTransactions"
import { categories, type Transaction } from "@/lib/data"
import { cn }                   from "@/lib/utils"

// ─── Inner content ────────────────────────────────────────
function TransactionsContent() {
  const { transactions, loading, error, addTransaction, deleteTransaction } =
    useTransactions()

  const [searchQuery,    setSearchQuery]    = useState("")
  const [typeFilter,     setTypeFilter]     = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [dateRange,      setDateRange]      = useState<{
    from: Date | undefined
    to:   Date | undefined
  }>({ from: undefined, to: undefined })

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType     = typeFilter === "all" || t.type === typeFilter
      const matchesCategory = categoryFilter === "all" || t.category === categoryFilter
      const tDate = new Date(t.date)
      const matchesDate =
        (!dateRange.from || tDate >= dateRange.from) &&
        (!dateRange.to   || tDate <= dateRange.to)
      return matchesSearch && matchesType && matchesCategory && matchesDate
    })
  }, [transactions, searchQuery, typeFilter, categoryFilter, dateRange])

  const hasActiveFilters =
    searchQuery || typeFilter !== "all" || categoryFilter !== "all" ||
    dateRange.from || dateRange.to

  const handleAddTransaction = async (newTxn: Omit<Transaction, "id">) => {
    try { await addTransaction(newTxn) } catch (e) { console.error(e) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return
    try { await deleteTransaction(id) } catch (e) { console.error(e) }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setTypeFilter("all")
    setCategoryFilter("all")
    setDateRange({ from: undefined, to: undefined })
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v)

  const formatDate = (ds: string) =>
    new Date(ds).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  const getCategoryColor = (name: string) =>
    categories.find((c) => c.name === name)?.color ?? "#6b7280"

  return (
    <div className="relative flex flex-col gap-4 p-4 pb-24 md:gap-6 md:p-6 md:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${transactions.length} total`}
          </p>
        </div>
        {/* Button hidden on mobile (replaced by FAB below) */}
        <div className="hidden sm:block">
          <AddTransactionModal onAdd={handleAddTransaction} />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Search bar (always visible on mobile) ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search transactions…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* ── Filter row (collapsible-ish on mobile) ── */}
      <div className="flex flex-wrap gap-2">
        {/* Type toggle */}
        <ToggleGroup
          type="single"
          value={typeFilter}
          onValueChange={(v) => v && setTypeFilter(v)}
          className="h-9"
        >
          <ToggleGroupItem value="all"     className="h-9 px-3 text-xs">All</ToggleGroupItem>
          <ToggleGroupItem value="income"  className="h-9 px-3 text-xs data-[state=on]:bg-emerald-600 data-[state=on]:text-white">Income</ToggleGroupItem>
          <ToggleGroupItem value="expense" className="h-9 px-3 text-xs data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground">Expense</ToggleGroupItem>
        </ToggleGroup>

        {/* Category */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9 w-auto min-w-[130px] text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.name} value={cat.name}>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn("h-9 text-xs", !dateRange.from && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-1.5 size-3.5" />
              {dateRange.from
                ? dateRange.to
                  ? `${format(dateRange.from, "MMM d")}–${format(dateRange.to, "MMM d")}`
                  : format(dateRange.from, "MMM d, y")
                : "Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(r) => setDateRange({ from: r?.from, to: r?.to })}
              numberOfMonths={1}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1 text-xs">
            <X className="size-3" /> Clear
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </p>
      )}

      {/* ── Mobile card list ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Mobile: card per transaction */}
          <div className="flex flex-col divide-y divide-border rounded-xl border bg-card md:hidden">
            {filteredTransactions.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                No transactions found.
              </p>
            ) : (
              filteredTransactions.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                      t.type === "income" ? "bg-emerald-500" : "bg-rose-500"
                    )}
                  >
                    {t.type === "income" ? "+" : "−"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.description}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: `${getCategoryColor(t.category)}18`,
                          color: getCategoryColor(t.category),
                        }}
                        className="h-5 rounded-full px-2 text-[10px] font-medium"
                      >
                        {t.category}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">{formatDate(t.date)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        t.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-destructive"
                      )}
                    >
                      {t.type === "income" ? "+" : "−"}{formatCurrency(t.amount)}
                    </span>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-muted-foreground/50 transition-colors hover:text-destructive active:scale-95"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop: full table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-muted-foreground">{formatDate(t.date)}</TableCell>
                        <TableCell className="font-medium">{t.description}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: `${getCategoryColor(t.category)}20`,
                              color:           getCategoryColor(t.category),
                              borderColor:     getCategoryColor(t.category),
                            }}
                            className="border"
                          >
                            {t.category}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-medium tabular-nums",
                          t.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-destructive"
                        )}>
                          {t.type === "income" ? "+" : "−"}{formatCurrency(t.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(t.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Mobile FAB (floating add button) ── */}
      <div className="fixed bottom-6 right-6 z-50 sm:hidden" style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))" }}>
        <AddTransactionModal onAdd={handleAddTransaction} />
      </div>
    </div>
  )
}

export default function TransactionsPage() {
  return (
    <AuthGuard>
      <TransactionsContent />
    </AuthGuard>
  )
}
