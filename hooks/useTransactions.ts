/**
 * hooks/useTransactions.ts
 * ──────────────────────────────────────────────────────────
 * Custom hook that:
 *  1. Subscribes to the current user's Firestore transactions
 *     in real-time (onSnapshot) — UI updates the instant
 *     data changes in the database.
 *  2. Exposes addTransaction + deleteTransaction helpers.
 *
 * Firestore collection path:
 *   transactions/{docId}     (field: userId == currentUser.uid)
 *
 * Security: each document records which user it belongs to.
 *           Firestore Rules enforce that users can only
 *           read/write their own documents.
 * ──────────────────────────────────────────────────────────
 */

"use client"

import { useEffect, useState } from "react"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"
import type { Transaction } from "@/lib/data"

// ─── Types ──────────────────────────────────────────────
type NewTransaction = Omit<Transaction, "id">

interface UseTransactionsReturn {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  addTransaction:    (data: NewTransaction) => Promise<string>
  deleteTransaction: (id: string) => Promise<void>
}

// ─── Hook ───────────────────────────────────────────────
export function useTransactions(): UseTransactionsReturn {
  const { currentUser } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) {
      setTransactions([])
      setLoading(false)
      return
    }

    // Build a query that:
    //  • filters to only THIS user's transactions
    //  • orders newest first
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", currentUser.uid),
      orderBy("date", "desc"),
    )

    // Subscribe to real-time updates.
    // onSnapshot fires immediately with existing docs, then again on change.
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const txns: Transaction[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return {
            id:          docSnap.id,
            description: data.description ?? "",
            category:    data.category    ?? "",
            type:        data.type        ?? "expense",
            amount:      data.amount      ?? 0,
            // Convert Firestore Timestamp → "YYYY-MM-DD" string
            date: (data.date instanceof Timestamp)
              ? data.date.toDate().toISOString().split("T")[0]
              : String(data.date ?? ""),
          }
        })
        setTransactions(txns)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error("useTransactions – Firestore error:", err)
        setError("Failed to load transactions. Please try again.")
        setLoading(false)
      },
    )

    // Clean up the listener when the user changes or the component unmounts
    return () => unsubscribe()
  }, [currentUser])

  // ── addTransaction ───────────────────────────────────
  async function addTransaction(data: NewTransaction): Promise<string> {
    if (!currentUser) throw new Error("Must be logged in to add transactions")

    const docData = {
      ...data,
      amount: parseFloat(String(data.amount)),          // ensure number
      date:   Timestamp.fromDate(new Date(data.date)),  // store as Timestamp
      userId: currentUser.uid,                          // tie to user
      createdAt: serverTimestamp(),                     // server-side ordering
    }

    // TODO: this is where we write to Firebase Firestore
    const ref = await addDoc(collection(db, "transactions"), docData)
    return ref.id
  }

  // ── deleteTransaction ────────────────────────────────
  async function deleteTransaction(id: string): Promise<void> {
    if (!currentUser) throw new Error("Must be logged in to delete transactions")
    // TODO: this deletes the document from Firestore
    await deleteDoc(doc(db, "transactions", id))
  }

  return { transactions, loading, error, addTransaction, deleteTransaction }
}
