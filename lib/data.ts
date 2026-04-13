export type Transaction = {
  id: string
  date: string
  description: string
  category: string
  amount: number
  type: "income" | "expense"
}

export type Category = {
  name: string
  color: string
  icon: string
}

export const categories: Category[] = [
  { name: "Food", color: "#3b82f6", icon: "utensils" },
  { name: "Transport", color: "#10b981", icon: "car" },
  { name: "Hostel", color: "#f59e0b", icon: "home" },
  { name: "College", color: "#8b5cf6", icon: "graduation-cap" },
  { name: "Entertainment", color: "#ec4899", icon: "gamepad-2" },
  { name: "Shopping", color: "#06b6d4", icon: "shopping-bag" },
  { name: "Healthcare", color: "#ef4444", icon: "heart-pulse" },
  { name: "Salary", color: "#22c55e", icon: "wallet" },
  { name: "Freelance", color: "#14b8a6", icon: "laptop" },
  { name: "Other", color: "#6b7280", icon: "ellipsis" },
]

export const sampleTransactions: Transaction[] = [
  {
    id: "1",
    date: "2026-04-09",
    description: "Monthly Salary",
    category: "Salary",
    amount: 5000,
    type: "income",
  },
  {
    id: "2",
    date: "2026-04-08",
    description: "Grocery Shopping",
    category: "Food",
    amount: 85.5,
    type: "expense",
  },
  {
    id: "3",
    date: "2026-04-07",
    description: "Uber Ride",
    category: "Transport",
    amount: 24.0,
    type: "expense",
  },
  {
    id: "4",
    date: "2026-04-07",
    description: "Netflix Subscription",
    category: "Entertainment",
    amount: 15.99,
    type: "expense",
  },
  {
    id: "5",
    date: "2026-04-06",
    description: "Freelance Project",
    category: "Freelance",
    amount: 750,
    type: "income",
  },
  {
    id: "6",
    date: "2026-04-05",
    description: "Hostel Rent",
    category: "Hostel",
    amount: 450,
    type: "expense",
  },
  {
    id: "7",
    date: "2026-04-04",
    description: "College Tuition",
    category: "College",
    amount: 1200,
    type: "expense",
  },
  {
    id: "8",
    date: "2026-04-03",
    description: "Lunch with Friends",
    category: "Food",
    amount: 45.0,
    type: "expense",
  },
  {
    id: "9",
    date: "2026-04-02",
    description: "Pharmacy",
    category: "Healthcare",
    amount: 32.5,
    type: "expense",
  },
  {
    id: "10",
    date: "2026-04-01",
    description: "Online Course",
    category: "College",
    amount: 99.0,
    type: "expense",
  },
  {
    id: "11",
    date: "2026-03-31",
    description: "Part-time Work",
    category: "Salary",
    amount: 320,
    type: "income",
  },
  {
    id: "12",
    date: "2026-03-30",
    description: "New Headphones",
    category: "Shopping",
    amount: 129.99,
    type: "expense",
  },
]

// Calculate daily spending for the last 30 days based on transactions
export function getDailySpending(transactions: Transaction[]) {
  const data = []
  const today = new Date()
  
  // Initialize map with last 30 days
  const dailyMap = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateString = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    dailyMap.set(dateString, 0)
  }

  // Aggregate expenses
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      // Create a stable local date by appending noon time, preventing timezone shifts
      const tDate = new Date(t.date + "T12:00:00")
      if (isNaN(tDate.getTime())) return

      const dateString = tDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      if (dailyMap.has(dateString)) {
        dailyMap.set(dateString, (dailyMap.get(dateString) || 0) + t.amount)
      }
    })

  // Convert map to array
  for (const [date, amount] of Array.from(dailyMap.entries())) {
    data.push({
      date,
      amount: Math.round(amount * 100) / 100,
    })
  }
  
  return data
}

// Calculate spending by category
export function getSpendingByCategory(transactions: Transaction[]) {
  const categoryMap = new Map<string, number>()
  
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const current = categoryMap.get(t.category) || 0
      categoryMap.set(t.category, current + t.amount)
    })
  
  return Array.from(categoryMap.entries()).map(([name, value]) => {
    const category = categories.find((c) => c.name === name)
    return {
      name,
      value: Math.round(value * 100) / 100,
      fill: category?.color || "#6b7280",
    }
  })
}

// Calculate summary statistics
export function calculateSummary(transactions: Transaction[]) {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
  
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)
  
  const balance = income - expenses
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0
  
  return {
    balance: Math.round(balance * 100) / 100,
    income: Math.round(income * 100) / 100,
    expenses: Math.round(expenses * 100) / 100,
    savingsRate: Math.round(savingsRate * 10) / 10,
  }
}
