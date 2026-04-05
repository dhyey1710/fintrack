/**
 * components/add-transaction-modal.tsx
 * ──────────────────────────────────────────────────────────
 * Modal form for adding a new income or expense transaction.
 * Calls the async onAdd() prop which writes to Firestore.
 * Includes loading state while the write is in progress.
 * ──────────────────────────────────────────────────────────
 */

"use client"

import { useState }   from "react"
import { CalendarIcon, Loader2, Plus } from "lucide-react"
import { format }    from "date-fns"
import { Button }    from "@/components/ui/button"
import { Calendar }  from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input }     from "@/components/ui/input"
import { Label }     from "@/components/ui/label"
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
import { Textarea }  from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { categories, type Transaction } from "@/lib/data"
import { cn }        from "@/lib/utils"

interface AddTransactionModalProps {
  /** Called with the new transaction data — should write to Firestore */
  onAdd?: (transaction: Omit<Transaction, "id">) => Promise<void> | void
}

export function AddTransactionModal({ onAdd }: AddTransactionModalProps) {
  const [open,        setOpen]       = useState(false)
  const [loading,     setLoading]    = useState(false)
  const [error,       setError]      = useState("")
  const [type,        setType]       = useState<"income" | "expense">("expense")
  const [amount,      setAmount]     = useState("")
  const [category,    setCategory]   = useState("")
  const [date,        setDate]       = useState<Date>(new Date())
  const [description, setDescription] = useState("")

  const resetForm = () => {
    setType("expense")
    setAmount("")
    setCategory("")
    setDate(new Date())
    setDescription("")
    setError("")
  }

  // Filter categories by type
  const filteredCategories = categories.filter((cat) => {
    if (type === "income") {
      return ["Salary", "Freelance", "Other"].includes(cat.name)
    }
    return !["Salary", "Freelance"].includes(cat.name)
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !category || !date) return
    setError("")
    setLoading(true)

    const transaction: Omit<Transaction, "id"> = {
      amount:      parseFloat(amount),
      type,
      category,
      date:        format(date, "yyyy-MM-dd"),
      description,
    }

    try {
      // TODO: This calls addTransaction() in useTransactions which writes to Firestore
      await onAdd?.(transaction)
      setOpen(false)
      resetForm()
    } catch (err) {
      console.error("AddTransactionModal – save failed:", err)
      setError("Failed to save transaction. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>Enter the details of your transaction below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {/* Type toggle */}
          <div className="grid gap-2">
            <Label>Type</Label>
            <ToggleGroup
              type="single"
              value={type}
              onValueChange={(value) => {
                if (value) {
                  setType(value as "income" | "expense")
                  setCategory("") // reset category when type changes
                }
              }}
              className="justify-start"
            >
              <ToggleGroupItem
                value="expense"
                className="data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground"
              >
                Expense
              </ToggleGroupItem>
              <ToggleGroupItem
                value="income"
                className="data-[state=on]:bg-emerald-600 data-[state=on]:text-white"
              >
                Income
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Amount */}
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name}>
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date picker */}
          <div className="grid gap-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter a description…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm() }} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !amount || !category}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Transaction"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
