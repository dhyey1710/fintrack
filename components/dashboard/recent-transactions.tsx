/**
 * components/dashboard/recent-transactions.tsx
 *
 * Mobile-first redesign:
 *  • Mobile (<md): stacked cards — one per transaction, shows all info
 *  • Desktop (md+): the original table layout
 *
 * This avoids the horizontal-scroll mess of a 5-column table on a 375px screen.
 */

"use client"

import { Trash2 }    from "lucide-react"
import { Badge }     from "@/components/ui/badge"
import { Button }    from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { categories, type Transaction } from "@/lib/data"
import { cn }        from "@/lib/utils"

interface RecentTransactionsProps {
  transactions: Transaction[]
  onEdit?:   (transaction: Transaction) => void
  onDelete?: (id: string)              => void
}

export function RecentTransactions({
  transactions,
  onEdit,
  onDelete,
}: RecentTransactionsProps) {
  const recent = transactions.slice(0, 6)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day:   "numeric",
      year:  "numeric",
    })

  const getCategoryColor = (categoryName: string) =>
    categories.find((c) => c.name === categoryName)?.color ?? "#6b7280"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your latest financial activities</CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">

        {/* ── Mobile card list (hidden on md+) ── */}
        <div className="flex flex-col divide-y divide-border md:hidden">
          {recent.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              No transactions yet. Add your first one!
            </p>
          ) : (
            recent.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-6 py-3">
                {/* Coloured type indicator dot */}
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                    t.type === "income" ? "bg-emerald-500" : "bg-rose-500"
                  )}
                >
                  {t.type === "income" ? "+" : "−"}
                </div>

                {/* Description + category */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.description}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: `${getCategoryColor(t.category)}18`,
                        color:            getCategoryColor(t.category),
                      }}
                      className="h-5 rounded-full px-2 text-[10px] font-medium"
                    >
                      {t.category}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(t.date)}
                    </span>
                  </div>
                </div>

                {/* Amount + delete */}
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
                    onClick={() => onDelete?.(t.id)}
                    className="text-muted-foreground/50 transition-colors hover:text-destructive active:scale-95"
                    aria-label="Delete transaction"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Desktop table (hidden on mobile) ── */}
        <div className="hidden md:block">
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
              {recent.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                recent.map((t) => (
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
                    <TableCell
                      className={cn(
                        "text-right font-medium tabular-nums",
                        t.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-destructive"
                      )}
                    >
                      {t.type === "income" ? "+" : "−"}{formatCurrency(t.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => onDelete?.(t.id)}
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
        </div>

      </CardContent>
    </Card>
  )
}
