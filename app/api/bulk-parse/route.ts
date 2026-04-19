/**
 * app/api/bulk-parse/route.ts
 * ──────────────────────────────────────────────────────────
 * Authenticated API route that accepts CSV text or PDF base64,
 * sends it to Gemini 2.5 Flash for bulk transaction parsing,
 * and returns a validated JSON array of transactions.
 *
 * Security:
 *  • Firebase Admin token verification on every request.
 *  • Input size limits to prevent abuse.
 *  • Response schema enforced via Gemini's structured output.
 *  • Category validation against the canonical list.
 * ──────────────────────────────────────────────────────────
 */

import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { categories } from "@/lib/data"
import { customInitApp, getAuth } from "@/lib/firebase-admin"

// Maximum sizes to prevent abuse (in characters / bytes)
const MAX_CSV_LENGTH = 500_000    // ~500 KB of CSV text
const MAX_PDF_SIZE   = 10_000_000 // ~10 MB of base64-encoded PDF
const MAX_TRANSACTIONS = 200      // cap AI output to prevent huge writes

// Rate Limiter: max 2 bulk uploads per minute per user to prevent high API token usage
const rateLimitMap = new Map<string, { count: number, resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 2

export async function POST(request: Request) {
  try {
    // ── 1. Verify Authorization Token ───────────────────
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    customInitApp()
    const token = authHeader.split("Bearer ")[1]
    let decodedToken
    try {
      decodedToken = await getAuth().verifyIdToken(token)
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!decodedToken || !decodedToken.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ── 1.5 Rate Limiting ───────────────────────────────
    const now = Date.now()
    const uid = decodedToken.uid
    const userLimit = rateLimitMap.get(uid)

    if (!userLimit || now > userLimit.resetTime) {
      rateLimitMap.set(uid, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    } else {
      if (userLimit.count >= MAX_REQUESTS) {
        return NextResponse.json(
          { error: "Too many requests. Please wait a minute before uploading another bulk file." },
          { status: 429 }
        )
      }
      userLimit.count++
    }

    // ── 2. Parse request body ───────────────────────────
    const body = await request.json()
    const { fileType, csvText, pdfBase64 } = body as {
      fileType: "csv" | "pdf"
      csvText?: string
      pdfBase64?: string
    }

    if (!fileType || !["csv", "pdf"].includes(fileType)) {
      return NextResponse.json(
        { error: "fileType must be 'csv' or 'pdf'" },
        { status: 400 }
      )
    }

    // Validate inputs exist and don't exceed size limits
    if (fileType === "csv") {
      if (!csvText || typeof csvText !== "string") {
        return NextResponse.json(
          { error: "csvText is required for CSV uploads" },
          { status: 400 }
        )
      }
      if (csvText.length > MAX_CSV_LENGTH) {
        return NextResponse.json(
          { error: "CSV content is too large. Maximum ~500 KB." },
          { status: 413 }
        )
      }
    }

    if (fileType === "pdf") {
      if (!pdfBase64 || typeof pdfBase64 !== "string") {
        return NextResponse.json(
          { error: "pdfBase64 is required for PDF uploads" },
          { status: 400 }
        )
      }
      if (pdfBase64.length > MAX_PDF_SIZE) {
        return NextResponse.json(
          { error: "PDF file is too large. Maximum ~7.5 MB." },
          { status: 413 }
        )
      }
    }

    // ── 3. Initialize Gemini AI ─────────────────────────
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === "missing_key") {
      return NextResponse.json(
        { error: "Gemini API key is not configured" },
        { status: 500 }
      )
    }
    const ai = new GoogleGenAI({ apiKey })

    const availableCategories = categories.map((c) => c.name).join(", ")
    const incomeCategories = ["Salary", "Freelance", "Other"].join(", ")

    const systemPrompt = `You are a financial transaction parser specializing in Indian bank statements and payment histories.
Your job is to extract every transaction from the provided document and return them as a JSON array.

Rules:
1. "type": Must be exactly "income" or "expense". Credit/deposit = income. Debit/payment/purchase = expense.
2. "amount": A positive number. Remove currency symbols and commas.
3. "category": Must be one of exactly: [${availableCategories}]. Guess the closest match. Use [${incomeCategories}] for income transactions.
4. "date": In YYYY-MM-DD format. Parse from any date format you find in the document.
5. "description": A short, clean summary of the transaction (max 6 words). Do not include amounts or dates.

Important:
- Skip header rows, footer rows, balance summaries, and non-transaction lines.
- If a row is unclear or not a transaction, skip it.
- Return at most ${MAX_TRANSACTIONS} transactions.
- If you find zero valid transactions, return an empty array [].`

    // ── 4. Build the Gemini request ─────────────────────
    const responseSchema = {
      type: "ARRAY" as const,
      items: {
        type: "OBJECT" as const,
        properties: {
          type:        { type: "STRING" as const, enum: ["income", "expense"] },
          amount:      { type: "NUMBER" as const },
          category:    { type: "STRING" as const },
          date:        { type: "STRING" as const, description: "YYYY-MM-DD" },
          description: { type: "STRING" as const },
        },
        required: ["type", "amount", "category", "date", "description"],
      },
    }

    let response

    if (fileType === "csv") {
      // CSV: send as text content
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `${systemPrompt}\n\nHere is the CSV data:\n\n${csvText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema,
        },
      })
    } else {
      // PDF: send as inline data (Gemini can natively read PDFs)
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: systemPrompt + "\n\nParse all transactions from this PDF document:" },
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: pdfBase64,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema,
        },
      })
    }

    const text = response.text
    if (!text) {
      throw new Error("Empty response from AI")
    }

    // ── 5. Parse & validate the response ────────────────
    const parsed: unknown[] = JSON.parse(text)

    if (!Array.isArray(parsed)) {
      throw new Error("AI response is not an array")
    }

    // Validate and sanitize each transaction
    const validCategoryNames = new Set(categories.map((c) => c.name))

    const validated = parsed
      .slice(0, MAX_TRANSACTIONS)
      .map((item: any) => {
        // Ensure category is valid, otherwise default to "Other"
        const category = validCategoryNames.has(item.category)
          ? item.category
          : "Other"

        // Ensure amount is a positive number
        const amount = Math.abs(Number(item.amount) || 0)
        if (amount <= 0) return null // skip zero-amount entries

        // Ensure type is valid
        const type = item.type === "income" ? "income" : "expense"

        // Ensure date is valid YYYY-MM-DD
        const dateMatch = String(item.date || "").match(/^\d{4}-\d{2}-\d{2}$/)
        const date = dateMatch ? item.date : new Date().toISOString().split("T")[0]

        // Sanitize description (limit length, strip any HTML)
        const description = String(item.description || "Transaction")
          .replace(/<[^>]*>/g, "")
          .slice(0, 100)

        return { type, amount, category, date, description }
      })
      .filter(Boolean)

    return NextResponse.json({ transactions: validated })
  } catch (error) {
    console.error("Bulk Parse API Error:", error)
    return NextResponse.json(
      { error: "Failed to parse document. Please try a different file." },
      { status: 500 }
    )
  }
}
