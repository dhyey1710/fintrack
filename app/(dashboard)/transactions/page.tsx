/**
 * app/(dashboard)/transactions/page.tsx  — Transactions
 * ──────────────────────────────────────────────────────────
 * Full transaction list with search + filters.
 * Data comes from Firestore in real-time via useTransactions().
 * ──────────────────────────────────────────────────────────
 */

"use client"

import { useState, useMemo } from "react"
import { format }            from "date-fns"
import { CalendarIcon, Edit2, Loader2, Search, Trash2, X } from "lucide-react"
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

// ── Inner content ─────────────────────────────────────────
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

  // ── Filtering logic ──────────────────────────────────
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

  // ── Handlers ─────────────────────────────────────────
  const handleAddTransaction = async (newTxn: Omit<Transaction, "id">) => {
    try {
      // TODO: writes to Firestore
      await addTransaction(newTxn)
    } catch (err) {
      console.error("Transactions – add failed:", err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return
    try {
      // TODO: deletes from Firestore
      await deleteTransaction(id)
    } catch (err) {
      console.error("Transactions – delete failed:", err)
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setTypeFilter("all")
    setCategoryFilter("all")
    setDateRange({ from: undefined, to: undefined })
  }

  // ── Formatters ────────────────────────────────────────
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v)

  const formatDate = (ds: string) =>
    new Date(ds).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  const getCategoryColor = (name: string) =>
    categories.find((c) => c.name === name)?.color ?? "#6b7280"

  // ── Render ────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Transactions</h1>
          <p className="text-muted-foreground">
            {loading
              ? "Loading…"
              : `${transactions.length} total transaction${transactions.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <AddTransactionModal onAdd={handleAddTransaction} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Filter by type, category, date range, or search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Type toggle */}
              <ToggleGroup
                type="single"
                value={typeFilter}
                onValueChange={(v) => v && setTypeFilter(v)}
                className="justify-start"
              >
                <ToggleGroupItem value="all"     className="flex-1">All</ToggleGroupItem>
                <ToggleGroupItem value="income"  className="flex-1 data-[state=on]:bg-emerald-600 data-[state=on]:text-white">Income</ToggleGroupItem>
                <ToggleGroupItem value="expense" className="flex-1 data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground">Expenses</ToggleGroupItem>
              </ToggleGroup>

              {/* Category */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
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
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 size-4" />
                    {dateRange.from
                      ? dateRange.to
                        ? <>{format(dateRange.from, "LLL dd")} – {format(dateRange.to, "LLL dd")}</>
                        : format(dateRange.from, "LLL dd, y")
                      : "Date range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {filteredTransactions.length} result{filteredTransactions.length !== 1 ? "s" : ""}
                </span>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1">
                  <X className="size-3" /> Clear filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
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
                      No transactions found.{" "}
                      {transactions.length === 0 && "Add your first transaction to get started!"}
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
                            color:            getCategoryColor(t.category),
                            borderColor:      getCategoryColor(t.category),
                          }}
                          className="border"
                        >
                          {t.category}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        t.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-destructive"
                      )}>
                        {t.type === "income" ? "+" : "–"}{formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(t.id)}
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Page export ───────────────────────────────────────────
export default function TransactionsPage() {
  return (
    <AuthGuard>
      <TransactionsContent />
    </AuthGuard>
  )
}
