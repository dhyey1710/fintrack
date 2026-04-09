/**
 * components/add-transaction-modal.tsx
 * ──────────────────────────────────────────────────────────
 * Adaptive: bottom-sheet Drawer on mobile, Dialog on desktop.
 *
 * Uses the vaul Drawer (already part of shadcn) for mobile
 * so users get a native-feeling swipe-up experience instead
 * of a centred modal which is hard to reach on phones.
 * ──────────────────────────────────────────────────────────
 */

"use client"

import { useState }   from "react"
import { CalendarIcon, Loader2, Plus } from "lucide-react"
import { format }    from "date-fns"

// Responsive: hooks into window width
import { useIsMobile } from "@/components/ui/use-mobile"

// Desktop Dialog
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Mobile Drawer (vaul bottom sheet)
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import { Button }    from "@/components/ui/button"
import { Calendar }  from "@/components/ui/calendar"
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
  onAdd?: (transaction: Omit<Transaction, "id">) => Promise<void> | void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  initialData?: Partial<Transaction>
  trigger?: React.ReactNode // Allow custom trigger button
}

// ── Shared form content ───────────────────────────────────
function TransactionForm({
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  onSubmit: (e: React.FormEvent) => Promise<void>
  onCancel: () => void
  loading:  boolean
  error:    string
}) {
  const [type,        setType]        = useState<"income" | "expense">("expense")
  const [amount,      setAmount]      = useState("")
  const [category,    setCategory]    = useState("")
  const [date,        setDate]        = useState<Date>(new Date())
  const [description, setDescription] = useState("")

  const filteredCategories = categories.filter((cat) => {
    if (type === "income") return ["Salary", "Freelance", "Other"].includes(cat.name)
    return !["Salary", "Freelance"].includes(cat.name)
  })

  // Wrap the parent submit to include local form state
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    ;(e as any).__formData = { type, amount, category, date, description }
    return onSubmit(e)
  }

  return (
    <form id="transaction-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Type */}
      <div className="grid gap-2">
        <Label>Type</Label>
        <ToggleGroup
          type="single"
          value={type}
          onValueChange={(v) => { if (v) { setType(v as "income" | "expense"); setCategory("") } }}
          className="grid grid-cols-2"
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
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
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

      {/* Date */}
      <div className="grid gap-2">
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 size-4" />
              {date ? format(date, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Description */}
      <div className="grid gap-2">
        <Label htmlFor="description">Description <span className="text-muted-foreground">(optional)</span></Label>
        <Textarea
          id="description"
          placeholder="e.g. Lunch at college canteen"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <input type="hidden" name="__type"        value={type} />
      <input type="hidden" name="__amount"      value={amount} />
      <input type="hidden" name="__category"    value={category} />
      <input type="hidden" name="__date"        value={date.toISOString()} />
      <input type="hidden" name="__description" value={description} />
    </form>
  )
}

// ── Main component ────────────────────────────────────────
export function AddTransactionModal({ 
  onAdd, 
  open: controlledOpen, 
  onOpenChange: setControlledOpen, 
  initialData,
  trigger 
}: AddTransactionModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  
  const setOpen = (value: boolean) => {
    if (!isControlled) setInternalOpen(value)
    setControlledOpen?.(value)
    if (!value) resetForm()
  }

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")
  const isMobile = useIsMobile()

  // Form state lifted so we can share between Drawer and Dialog
  const [type,        setType]        = useState<"income" | "expense">("expense")
  const [amount,      setAmount]      = useState("")
  const [category,    setCategory]    = useState("")
  const [date,        setDate]        = useState<Date>(new Date())
  const [description, setDescription] = useState("")

  // Sync initialData when modal opens
  import("react").then(() => {}) // Hack removed. We use React.useEffect below.
  const React = require("react")
  React.useEffect(() => {
    if (open && initialData) {
      setType(initialData.type || "expense")
      setAmount(initialData.amount ? String(initialData.amount) : "")
      setCategory(initialData.category || "")
      setDate(initialData.date ? new Date(initialData.date) : new Date())
      setDescription(initialData.description || "")
    }
  }, [open, initialData])

  const resetForm = () => {
    setType("expense")
    setAmount("")
    setCategory("")
    setDate(new Date())
    setDescription("")
    setError("")
  }

  const filteredCategories = categories.filter((cat) => {
    if (type === "income") return ["Salary", "Freelance", "Other"].includes(cat.name)
    return !["Salary", "Freelance"].includes(cat.name)
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !category) return
    setError("")
    setLoading(true)

    try {
      await onAdd?.({
        amount:      parseFloat(amount),
        type,
        category,
        date:        format(date, "yyyy-MM-dd"),
        description,
      })
      setOpen(false)
      resetForm()
    } catch {
      setError("Failed to save transaction. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const formId = "add-transaction-form"

  // ── Shared form JSX ──────────────────────────────────
  const FormBody = (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Type toggle */}
      <div className="grid gap-2">
        <Label>Type</Label>
        <ToggleGroup
          type="single"
          value={type}
          onValueChange={(v) => { if (v) { setType(v as "income" | "expense"); setCategory("") } }}
          className="grid grid-cols-2"
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
        <Label htmlFor={`${formId}-amount`}>Amount</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
          <Input
            id={`${formId}-amount`}
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
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
        <Label htmlFor={`${formId}-cat`}>Category</Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger id={`${formId}-cat`}>
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

      {/* Date */}
      <div className="grid gap-2">
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              type="button"
              className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 size-4" />
              {date ? format(date, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      {/* Description */}
      <div className="grid gap-2">
        <Label htmlFor={`${formId}-desc`}>
          Description <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Textarea
          id={`${formId}-desc`}
          placeholder="e.g. Lunch at college canteen"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
    </form>
  )

  const SubmitButton = (
    <Button type="submit" form={formId} disabled={loading || !amount || !category} className="w-full sm:w-auto">
      {loading ? <><Loader2 className="mr-2 size-4 animate-spin" />Saving…</> : "Save Transaction"}
    </Button>
  )

  const CancelButton = (
    <Button
      type="button"
      variant="outline"
      onClick={() => { setOpen(false); resetForm() }}
      disabled={loading}
      className="w-full sm:w-auto"
    >
      Cancel
    </Button>
  )

  const TriggerButton = trigger || (
    <Button className="gap-2 touch-manipulation">
      <Plus className="size-4" />
      <span>Add Transaction</span>
    </Button>
  )

  // ── Mobile: swipe-up Drawer ───────────────────────────
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
        <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
        <DrawerContent className="max-h-[92dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Add Transaction</DrawerTitle>
            <DrawerDescription>Enter the details of your income or expense.</DrawerDescription>
          </DrawerHeader>
          {/* Scrollable form area for small phones */}
          <div className="overflow-y-auto px-4 pb-2">
            {FormBody}
          </div>
          <DrawerFooter className="flex-col gap-2 pt-2">
            {SubmitButton}
            {CancelButton}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  // ── Desktop: centred Dialog ───────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>{TriggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>Enter the details of your transaction below.</DialogDescription>
        </DialogHeader>
        <div className="py-2">{FormBody}</div>
        <DialogFooter className="gap-2 sm:gap-0">
          {CancelButton}
          {SubmitButton}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
