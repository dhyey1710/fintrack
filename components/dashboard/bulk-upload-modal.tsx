/**
 * components/dashboard/bulk-upload-modal.tsx
 * ──────────────────────────────────────────────────────────
 * Smart Import modal for bulk-uploading bank statements (PDF)
 * and transaction histories (CSV).
 *
 * Flow:
 *  1. User drops a file → we read it as text (CSV) or base64 (PDF)
 *  2. We send it to /api/bulk-parse → Gemini AI parses transactions
 *  3. User reviews a table of parsed transactions, can edit categories
 *     or delete rows
 *  4. On confirm → batch-write all transactions to Firestore
 *
 * Adaptive: uses Drawer on mobile, Dialog on desktop.
 * ──────────────────────────────────────────────────────────
 */

"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import {
  Upload,
  FileText,
  FileSpreadsheet,
  Loader2,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react"
import { Timestamp, writeBatch, doc, collection, serverTimestamp } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"
import { useIsMobile } from "@/components/ui/use-mobile"
import { categories } from "@/lib/data"
import { cn } from "@/lib/utils"

// UI components
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
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

// ── Types ───────────────────────────────────────────────
interface ParsedTransaction {
  type: "income" | "expense"
  amount: number
  category: string
  date: string
  description: string
}

type ModalStep = "upload" | "parsing" | "review" | "saving" | "done" | "error"

interface BulkUploadModalProps {
  onComplete?: () => void
  /** 'button' = compact button, 'card' = full-width hero promo card */
  variant?: "button" | "card"
}

// ── Constants ───────────────────────────────────────────
const ACCEPTED_TYPES = {
  "text/csv": [".csv"],
  "application/pdf": [".pdf"],
  "application/vnd.ms-excel": [".csv"],
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

// ── Helper ──────────────────────────────────────────────
const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(v)

const getCategoryColor = (name: string) =>
  categories.find((c) => c.name === name)?.color ?? "#6b7280"

// ── Component ───────────────────────────────────────────
export function BulkUploadModal({ onComplete, variant = "button" }: BulkUploadModalProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<ModalStep>("upload")
  const [fileName, setFileName] = useState("")
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([])
  const [errorMessage, setErrorMessage] = useState("")
  const [savedCount, setSavedCount] = useState(0)

  const { currentUser } = useAuth()
  const isMobile = useIsMobile()

  // ── File handling ────────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    setFileName(file.name)
    setStep("parsing")
    setErrorMessage("")

    try {
      const user = auth.currentUser
      if (!user) throw new Error("You must be logged in.")

      const token = await user.getIdToken(true) // force-refresh to avoid expired tokens
      const isPdf = file.type === "application/pdf"

      let body: Record<string, string>

      if (isPdf) {
        // Read PDF as base64
        const arrayBuffer = await file.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        let binary = ""
        // Process in chunks to avoid call-stack overflow on large files
        const chunkSize = 8192
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, i + chunkSize)
          binary += String.fromCharCode(...chunk)
        }
        const base64 = btoa(binary)
        body = { fileType: "pdf", pdfBase64: base64 }
      } else {
        // Read CSV as text
        const text = await file.text()
        body = { fileType: "csv", csvText: text }
      }

      const res = await fetch("/api/bulk-parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Server error (${res.status})`)
      }

      const data = await res.json()

      if (!data.transactions || data.transactions.length === 0) {
        throw new Error("No transactions could be extracted from this file. Please try a different file or format.")
      }

      setTransactions(data.transactions)
      setStep("review")
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to parse file")
      setStep("error")
    }
  }, [])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        processFile(acceptedFiles[0])
      }
    },
    [processFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    onDropRejected: (rejections) => {
      const msg = rejections[0]?.errors[0]?.message || "Invalid file"
      setErrorMessage(msg)
      setStep("error")
    },
  })

  // ── Category editing ─────────────────────────────────
  const updateCategory = (index: number, newCategory: string) => {
    setTransactions((prev) =>
      prev.map((t, i) => (i === index ? { ...t, category: newCategory } : t))
    )
  }

  // ── Row deletion ──────────────────────────────────────
  const removeTransaction = (index: number) => {
    setTransactions((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Bulk save to Firestore ────────────────────────────
  const handleBulkSave = async () => {
    if (!currentUser || transactions.length === 0) return

    setStep("saving")

    try {
      // Firestore batches have a 500-write limit.
      // We chunk to stay safely within this.
      const chunkSize = 450
      let totalSaved = 0

      for (let i = 0; i < transactions.length; i += chunkSize) {
        const chunk = transactions.slice(i, i + chunkSize)
        const batch = writeBatch(db)

        chunk.forEach((txn) => {
          const docRef = doc(collection(db, "transactions"))
          batch.set(docRef, {
            userId: currentUser.uid,
            amount: txn.amount,
            type: txn.type,
            category: txn.category,
            date: Timestamp.fromDate(new Date(txn.date + "T12:00:00")),
            description: txn.description,
            createdAt: serverTimestamp(),
          })
        })

        await batch.commit()
        totalSaved += chunk.length
      }

      setSavedCount(totalSaved)
      setStep("done")
      onComplete?.()
    } catch (err: any) {
      console.error("Bulk save error:", err)
      setErrorMessage("Failed to save transactions. Please try again.")
      setStep("error")
    }
  }

  // ── Reset for a fresh upload ──────────────────────────
  const resetState = () => {
    setStep("upload")
    setFileName("")
    setTransactions([])
    setErrorMessage("")
    setSavedCount(0)
  }

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) resetState()
  }

  // ── Computed values ───────────────────────────────────
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0)

  // ── Step: Upload ──────────────────────────────────────
  const UploadContent = (
    <div className="flex flex-col gap-4">
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all duration-300 cursor-pointer",
          "hover:border-primary/50 hover:bg-primary/5",
          isDragActive
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-muted-foreground/25"
        )}
      >
        <input {...getInputProps()} />

        {/* Glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />

        <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
          <Upload className={cn(
            "size-7 transition-transform duration-300",
            isDragActive ? "scale-110 text-primary" : "text-muted-foreground"
          )} />
        </div>

        <div className="text-center">
          <p className="text-sm font-medium">
            {isDragActive ? "Drop your file here!" : "Drag & drop your file here"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Or click to browse
          </p>
        </div>

        <div className="flex gap-2 mt-1">
          <Badge variant="secondary" className="gap-1.5 text-[10px] px-2.5 py-1">
            <FileSpreadsheet className="size-3" />CSV
          </Badge>
          <Badge variant="secondary" className="gap-1.5 text-[10px] px-2.5 py-1">
            <FileText className="size-3" />PDF
          </Badge>
        </div>

        <p className="text-[10px] text-muted-foreground/60">Max 10 MB</p>
      </div>

      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Supported formats:</p>
        <ul className="text-[11px] text-muted-foreground/80 space-y-1">
          <li>• <span className="font-medium text-foreground/80">Google Pay CSV</span> – Download from Google Takeout</li>
          <li>• <span className="font-medium text-foreground/80">Bank Statement PDF</span> – Monthly e-statements from your bank</li>
          <li>• <span className="font-medium text-foreground/80">Any CSV</span> – With columns like date, amount, description</li>
        </ul>
      </div>
    </div>
  )

  // ── Step: Parsing ─────────────────────────────────────
  const ParsingContent = (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      {/* Scanning animation */}
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <div className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
          <Sparkles className="size-7 text-white animate-pulse" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold">Gemini AI is analyzing your file…</p>
        <p className="mt-1 text-xs text-muted-foreground">{fileName}</p>
      </div>
      <div className="w-48 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
      </div>
    </div>
  )

  // ── Step: Review ──────────────────────────────────────
  const ReviewContent = (
    <div className="flex flex-col gap-3">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="gap-1 text-xs px-3 py-1">
          {transactions.length} transactions found
        </Badge>
        {totalIncome > 0 && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(totalIncome)} income
          </span>
        )}
        {totalExpense > 0 && (
          <span className="text-xs font-medium text-destructive">
            −{formatCurrency(totalExpense)} expenses
          </span>
        )}
      </div>

      {/* Transaction table */}
      <ScrollArea className="max-h-[50vh] rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[140px]">Category</TableHead>
              <TableHead className="text-right w-[100px]">Amount</TableHead>
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t, idx) => (
              <TableRow key={`${t.date}-${t.amount}-${idx}`}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(t.date + "T12:00:00").toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-xs font-medium max-w-[200px] truncate">
                  {t.description}
                </TableCell>
                <TableCell>
                  <Select
                    value={t.category}
                    onValueChange={(v) => updateCategory(idx, v)}
                  >
                    <SelectTrigger className="h-7 text-[11px] w-full border-0 bg-transparent px-1">
                      <SelectValue>
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
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem
                          key={cat.name}
                          value={cat.name}
                          className="text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="size-2 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right text-xs font-semibold tabular-nums",
                    t.type === "income"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-destructive"
                  )}
                >
                  {t.type === "income" ? "+" : "−"}
                  {formatCurrency(t.amount)}
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => removeTransaction(idx)}
                    className="text-muted-foreground/40 hover:text-destructive transition-colors"
                    aria-label={`Remove transaction: ${t.description}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )

  // ── Step: Saving ──────────────────────────────────────
  const SavingContent = (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <Loader2 className="size-10 animate-spin text-primary" />
      <div className="text-center">
        <p className="text-sm font-semibold">Saving {transactions.length} transactions…</p>
        <p className="mt-1 text-xs text-muted-foreground">Writing to your account</p>
      </div>
    </div>
  )

  // ── Step: Done ────────────────────────────────────────
  const DoneContent = (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
        <CheckCircle2 className="size-9 text-emerald-500" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold">
          {savedCount} transactions imported!
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Your dashboard has been updated.
        </p>
      </div>
    </div>
  )

  // ── Step: Error ───────────────────────────────────────
  const ErrorContent = (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-7 text-destructive" />
      </div>
      <div className="text-center max-w-sm">
        <p className="text-sm font-semibold text-destructive">Something went wrong</p>
        <p className="mt-1 text-xs text-muted-foreground">{errorMessage}</p>
      </div>
    </div>
  )

  // ── Resolve current content & footer ──────────────────
  const currentContent = {
    upload: UploadContent,
    parsing: ParsingContent,
    review: ReviewContent,
    saving: SavingContent,
    done: DoneContent,
    error: ErrorContent,
  }[step]

  const footerButtons = (() => {
    switch (step) {
      case "review":
        return (
          <>
            <Button
              variant="outline"
              onClick={resetState}
              className="w-full sm:w-auto"
            >
              Upload Different File
            </Button>
            <Button
              onClick={handleBulkSave}
              disabled={transactions.length === 0}
              className="w-full sm:w-auto gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0"
            >
              <CheckCircle2 className="size-4" />
              Import {transactions.length} Transactions
            </Button>
          </>
        )
      case "done":
        return (
          <Button
            onClick={() => handleClose(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        )
      case "error":
        return (
          <Button variant="outline" onClick={resetState} className="w-full sm:w-auto">
            Try Again
          </Button>
        )
      default:
        return null
    }
  })()

  // ── Trigger ───────────────────────────────────────────
  const TriggerButton = variant === "card" ? (
    <button className="relative group/import w-full text-left overflow-hidden rounded-xl border border-primary/15 bg-card/95 backdrop-blur-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/30 active:scale-[0.995] touch-manipulation">
      {/* Gradient glow */}
      <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-15 blur group-hover/import:opacity-30 transition duration-500 pointer-events-none" />
      <div className="relative flex items-center gap-4 p-4 sm:p-5">
        {/* Icon */}
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
          <Upload className="size-5 text-white" />
        </div>
        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm sm:text-base">Smart Import</p>
            <Badge variant="secondary" className="gap-1 text-[9px] px-1.5 py-0.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border-0">
              <Sparkles className="size-2.5" />AI
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            Drop a bank statement or GPay CSV to bulk-import transactions
          </p>
        </div>
        {/* Arrow */}
        <div className="hidden sm:flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 group-hover/import:bg-primary/20 transition-colors">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  ) : (
    <Button
      className="gap-2 touch-manipulation bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-md"
    >
      <Upload className="size-4" />
      <span>Smart Import</span>
      <Sparkles className="size-3 opacity-70" />
    </Button>
  )

  // ── Modal title / description ─────────────────────────
  const title = {
    upload: "Smart Import",
    parsing: "Analyzing File",
    review: "Review Transactions",
    saving: "Importing…",
    done: "Import Complete",
    error: "Import Failed",
  }[step]

  const description = {
    upload: "Upload a bank statement or payment history to auto-import transactions.",
    parsing: "Our AI is reading your document and extracting transactions.",
    review: "Review the parsed transactions below. Edit categories or remove incorrect rows.",
    saving: "Please wait while we save everything to your account.",
    done: "All transactions have been saved successfully.",
    error: "We couldn't process your file.",
  }[step]

  // ── Mobile: Drawer ────────────────────────────────────
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
        <DrawerContent className="max-h-[92dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-2">{currentContent}</div>
          {footerButtons && (
            <DrawerFooter className="flex-col gap-2 pt-2">
              {footerButtons}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    )
  }

  // ── Desktop: Dialog ───────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>{TriggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-2">{currentContent}</div>
        {footerButtons && (
          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            {footerButtons}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
