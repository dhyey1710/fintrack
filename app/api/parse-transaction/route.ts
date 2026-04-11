import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { categories } from "@/lib/data"
import { customInitApp, getAuth } from "@/lib/firebase-admin"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function POST(request: Request) {
  try {
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

    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
