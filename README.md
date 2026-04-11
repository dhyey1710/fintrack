# FinTrack — Personal Finance Dashboard

A comprehensive, real-time personal finance application built to help users seamlessly track expenses, visualize spending patterns, and maintain a healthy budget. Clean design meets powerful AI-driven data handling.

## 🚀 Features

- **✨ AI-Powered Smart Quick Add** — Type a natural sentence like _"spent ₹450 on food at mess yesterday"_ and Gemini AI automatically extracts the amount, categorizes the expense, and structures the date for instant saving.
- **Real-time Dashboard** — Instantly view balance, income, expenses, and savings rate.
- **Visual Analytics** — Interactive pie charts for spending distribution and area charts for daily spending trends.
- **Transaction Management** — Add, edit, and delete income/expense records natively or via AI.
- **Secure Authentication** — Powered by Firebase Authentication (Email/Password) with secure route protection.
- **Cloud Data Sync** — Built on Firebase Firestore for instant, real-time data synchronization across devices.
- **Dark/Light Mode** — First-class support for system-based or manual theme toggling.
- **Fully Responsive** — A beautiful UI that works perfectly on desktop, tablet, and mobile.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, React 19) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Charts | [Recharts](https://recharts.org/) |
| AI | [Google Gemini](https://ai.google.dev/) (via `@google/genai`) |
| Backend & DB | [Firebase](https://firebase.google.com/) (Authentication & Firestore) |
| Deployment | [Vercel](https://vercel.com/) |

## 💻 Getting Started

### Prerequisites

- Node.js 18+ installed

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dhyey1710/fintrack.git
   cd fintrack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Then fill in your Firebase and Gemini API credentials in `.env.local`.

   - **Firebase**: Create a project at [console.firebase.google.com](https://console.firebase.google.com/), enable **Email/Password Authentication** and **Firestore Database**, then copy the config values.
   - **Gemini**: Get an API key from [Google AI Studio](https://aistudio.google.com/apikey).

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🛡️ Firestore Security Rules

FinTrack uses robust Firestore security rules to ensure user data privacy:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /transactions/{transactionId} {
      allow read, delete, update: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

## 🚀 Deploying to Vercel

1. Push this repo to GitHub
2. Import the repo on [vercel.com/new](https://vercel.com/new)
3. Add the following **Environment Variables** in the Vercel dashboard:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `GEMINI_API_KEY`
4. Deploy — Vercel will auto-detect Next.js and build it

## 📬 Contact & Links

- **Developer:** Dhyey
- **Repository:** [github.com/dhyey1710/fintrack](https://github.com/dhyey1710/fintrack)
