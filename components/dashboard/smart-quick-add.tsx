"use client"

import { useState } from "react"
import { Sparkles, Loader2, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AddTransactionModal } from "@/components/add-transaction-modal"
import { categories, type Transaction } from "@/lib/data"
import { cn } from "@/lib/utils"
import { auth } from "@/lib/firebase"

interface SmartQuickAddProps {
  onAdd: (transaction: Omit<Transaction, "id">) => Promise<void>
}

export function SmartQuickAdd({ onAdd }: SmartQuickAddProps) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [parsedData, setParsedData] = useState<Partial<Transaction> | null>(null)
  
  // For manual edit fallback
  const [modalOpen, setModalOpen] = useState(false)

  const handleParse = async () => {
    if (!input.trim()) return
    
    setLoading(true)
    setError("")
    setParsedData(null)

    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error("Must be logged in to use smart quick add.")
      }
      const token = await user.getIdToken()

      const res = await fetch("/api/parse-transaction", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          input,
          currentDate: new Date().toISOString().split("T")[0]
        })
      })

      if (!res.ok) {
        throw new Error("Failed to parse transaction")
      }

      const data = await res.json()
      
      // Basic validation
      if (!data.amount || !data.category) {
        throw new Error("AI couldn't understand the transaction details.")
      }

      setParsedData(data)
    } catch (err: any) {
      setError(err.message || "Failed to contact AI")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!parsedData) return
    setLoading(true)
    try {
      await onAdd(parsedData as Omit<Transaction, "id">)
      // Reset after save
      setInput("")
      setParsedData(null)
    } catch (err) {
      setError("Failed to save transaction.")
    } finally {
      setLoading(false)
    }
  }

  const getCategoryColor = (name: string) =>
    categories.find((c) => c.name === name)?.color ?? "#6b7280"

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative">
      <CardContent className="p-4 sm:p-6 flex flex-col gap-4">
        
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Textarea
              placeholder="Describe your transaction... (e.g. spent 450 on food at mess yesterday)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[50px] resize-none pr-12 text-sm sm:text-base border-primary/20 bg-background/50 focus-visible:ring-primary/50"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleParse()
                }
              }}
            />
            {/* AI Sparkles indicator */}
            <div className="absolute right-3 top-3 text-primary/40 pointer-events-none">
              <Sparkles className="size-5" />
            </div>
          </div>
          
          <Button 
            onClick={handleParse} 
            disabled={loading || !input.trim() || !!parsedData}
            className="w-full sm:w-auto shrink-0 gap-2 font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading && !parsedData ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Parse with AI
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive font-medium">{error}</p>
        )}

        {/* ── Extracted Preview Card ── */}
        {parsedData && !loading && (
          <div className="rounded-xl border bg-card p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              
              {/* Info */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className={cn(
                  "flex items-center gap-1 font-bold text-2xl tracking-tight",
                  parsedData.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                )}>
                  {parsedData.type === "income" ? "+" : "−"}₹{parsedData.amount}
                </div>
                
                <div className="flex flex-col justify-center">
                  <p className="font-medium text-sm leading-none mb-1.5">{parsedData.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: `${getCategoryColor(parsedData.category!)}18`,
                        color: getCategoryColor(parsedData.category!),
                      }}
                      className="px-2 text-[10px]"
                    >
                      {parsedData.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{parsedData.date}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex w-full sm:w-auto items-center gap-2 justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setModalOpen(true)}
                  className="flex-1 sm:flex-none h-9 text-xs"
                >
                  Edit Manually
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  disabled={loading}
                  className="flex-1 sm:flex-none h-9 text-xs font-semibold gap-1.5"
                >
                  <IndianRupee className="size-3.5" /> Save Transaction
                </Button>
              </div>

            </div>
          </div>
        )}

      </CardContent>

      <AddTransactionModal 
        onAdd={async (data) => {
          await onAdd(data)
          setModalOpen(false)
          setInput("")
          setParsedData(null)
        }} 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        initialData={parsedData || undefined}
        trigger={<div className="hidden"></div>} /* hidden trigger to bypass native internal button */
      />
    </Card>
  )
}
