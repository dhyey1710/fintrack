import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { categories } from "@/lib/data"
import { customInitApp, getAuth } from "@/lib/firebase-admin"

// Simple in-memory rate limiter (5 requests / 1 minute)
const rateLimitMap = new Map<string, { count: number, resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 5

export async function POST(request: Request) {
  try {
    // Initialize AI at request time to prevent Vercel build-time warnings
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "missing_key" })

    // 1. Verify Authorization Token
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

    // 1.5 Rate Limiting
    const now = Date.now()
    const uid = decodedToken.uid
    const userLimit = rateLimitMap.get(uid)

    if (!userLimit || now > userLimit.resetTime) {
      // First request or window reset
      rateLimitMap.set(uid, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    } else {
      if (userLimit.count >= MAX_REQUESTS) {
        return NextResponse.json(
          { error: "Too many requests. Please wait a minute before trying again." },
          { status: 429 }
        )
      }
      userLimit.count++
    }

    // 2. Parse input
    const { input, currentDate } = await request.json()

    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Input is required" }, { status: 400 })
    }

    const availableCategories = categories.map((c) => c.name).join(", ")
    const incomeCategories = ["Salary", "Freelance", "Other"].join(", ")
    
    const prompt = `
You are a financial transaction parser. Extract the details from the user's natural language input.
Today's date is: ${currentDate || new Date().toISOString().split('T')[0]}

Rules:
1. "type": Must be exactly "income" or "expense".
2. "amount": A positive number.
3. "category": Must be one of exactly: [${availableCategories}]. Guess the closest match. Try to use [${incomeCategories}] for income.
4. "date": In YYYY-MM-DD format. Infer from relative terms like "yesterday", "last week", "today" based on today's date.
5. "description": A short, clean summary (max 5 words).

User Input: "${input}"
    `

    // Wait, the new SDK uses ai.models.generateContent() and we pass responseSchema for forced JSON
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            type:        { type: "STRING", enum: ["income", "expense"] },
            amount:      { type: "NUMBER" },
            category:    { type: "STRING" },
            date:        { type: "STRING", description: "YYYY-MM-DD" },
            description: { type: "STRING" }
          },
          required: ["type", "amount", "category", "date", "description"]
        }
      }
    })

    const text = response.text
    
    if (!text) {
      throw new Error("Empty response from AI")
    }

    const json = JSON.parse(text)
    
    // Ensure category is somewhat valid
    if (!categories.find(c => c.name === json.category)) {
       json.category = json.type === "income" ? "Other" : "Other"
    }

    return NextResponse.json(json)
  } catch (error) {
    console.error("Gemini API Error:", error)
    return NextResponse.json({ error: "Failed to parse transaction" }, { status: 500 })
  }
}
