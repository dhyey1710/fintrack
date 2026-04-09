/**
 * app/(dashboard)/reports/page.tsx  — Reports
 * ──────────────────────────────────────────────────────────
 * Analytics page — all charts and stats computed from real
 * Firestore data via useTransactions().
 * ──────────────────────────────────────────────────────────
 */

"use client"

import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AuthGuard }       from "@/components/auth-guard"
import { useTransactions } from "@/hooks/useTransactions"
import {
  calculateSummary,
  categories,
  getSpendingByCategory,
} from "@/lib/data"
import { Loader2 } from "lucide-react"

// ── Inner content ─────────────────────────────────────────
function ReportsContent() {
  const { transactions, loading } = useTransactions()
  const [timePeriod, setTimePeriod] = useState("month")

  // Filter transactions to the selected time period
  const filteredTransactions = useMemo(() => {
    const now   = new Date()
    const start = new Date(now)

    if (timePeriod === "week") {
      start.setDate(now.getDate() - 7)
    } else if (timePeriod === "month") {
      start.setMonth(now.getMonth() - 1)
    } else if (timePeriod === "quarter") {
      start.setMonth(now.getMonth() - 3)
    } else {
      // year
      start.setFullYear(now.getFullYear() - 1)
    }

    return transactions.filter((t) => new Date(t.date) >= start)
  }, [transactions, timePeriod])

  // Compute stats from real data
  const summary            = useMemo(() => calculateSummary(filteredTransactions),            [filteredTransactions])
  const spendingByCategory = useMemo(() => getSpendingByCategory(filteredTransactions), [filteredTransactions])

  // Build last 4 months income vs expenses for the bar chart
  const monthlyData = useMemo(() => {
    const months: { month: string; income: number; expenses: number }[] = []

    for (let i = 3; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthLabel = d.toLocaleDateString("en-US", { month: "short" })
      const year       = d.getFullYear()
      const month      = d.getMonth()

      const monthTxns = transactions.filter((t) => {
        const td = new Date(t.date)
        return td.getMonth() === month && td.getFullYear() === year
      })

      const { income, expenses } = calculateSummary(monthTxns)
      months.push({ month: monthLabel, income, expenses })
    }

    return months
  }, [transactions])

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(v)

  const chartConfig: ChartConfig = {
    income:   { label: "Income",   color: "#10b981" },
    expenses: { label: "Expenses", color: "#ef4444" },
  }

  const categoryChartConfig = spendingByCategory.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.fill }
    return acc
  }, {} as ChartConfig)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Reports</h1>
          <p className="text-muted-foreground">Analyse your financial patterns and trends</p>
        </div>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats — computed from real Firestore data */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Daily Spending</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(summary.expenses / 30)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Highest Expense Category</CardDescription>
            <CardTitle className="text-2xl">
              {spendingByCategory[0]?.name || "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net Savings</CardDescription>
            <CardTitle className="text-2xl text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary.balance)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Income vs Expenses Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Last 4 months comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <div className="flex items-center justify-between gap-4">
                          <span className="capitalize">{name}</span>
                          <span className="font-mono font-medium">{formatCurrency(Number(value))}</span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar dataKey="income"   fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Spending Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending Distribution</CardTitle>
            <CardDescription>Breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            {spendingByCategory.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
                No expense data for this period
              </div>
            ) : (
              <>
                <ChartContainer config={categoryChartConfig} className="mx-auto h-[300px] w-full">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <div className="flex items-center justify-between gap-4">
                              <span>{name}</span>
                              <span className="font-mono font-medium">{formatCurrency(Number(value))}</span>
                            </div>
                          )}
                        />
                      }
                    />
                    <Pie
                      data={spendingByCategory}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                    >
                      {spendingByCategory.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {spendingByCategory.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="size-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-sm text-muted-foreground">
                        {item.name}: {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Spending Categories — with progress bars */}
      <Card>
        <CardHeader>
          <CardTitle>Top Spending Categories</CardTitle>
          <CardDescription>Your highest expense categories this period</CardDescription>
        </CardHeader>
        <CardContent>
          {spendingByCategory.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No expenses recorded for this period.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {spendingByCategory
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)
                .map((cat, index) => {
                  const percentage = summary.expenses > 0
                    ? (cat.value / summary.expenses) * 100
                    : 0
                  return (
                    <div key={cat.name} className="flex items-center gap-4">
                      <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{cat.name}</span>
                          <span className="text-muted-foreground">{formatCurrency(cat.value)}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%`, backgroundColor: cat.fill }}
                          />
                        </div>
                      </div>
                      <span className="w-12 text-right text-sm text-muted-foreground">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Page export ───────────────────────────────────────────
export default function ReportsPage() {
  return (
    <AuthGuard>
      <ReportsContent />
    </AuthGuard>
  )
}
