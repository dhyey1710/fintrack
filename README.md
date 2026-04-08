# FinTrack - Personal Finance Dashboard

![FinTrack Dashboard Demo](https://via.placeholder.com/1000x500?text=FinTrack+Dashboard)

FinTrack is a comprehensive, real-time personal finance application built to help users seamlessly track their expenses, visualize spending patterns, and maintain a healthy budget. Clean design meets powerful data handling.

## 🚀 Features

*   **Real-time Dashboard:** Instantly view balance, income, expenses, and savings rate.
*   **Visual Analytics:** Interactive pie charts for spending distribution and area charts for daily spending trends.
*   **Transaction Management:** Add, edit, and delete income/expense records with intelligent categorization.
*   **Secure Authentication:** Powered by Firebase Authentication (Email/Password) with secure route protection.
*   **Cloud Data Sync:** Built on Firebase Firestore for instant, real-time data synchronization across devices.
*   **Dark/Light Mode:** First-class support for system-based or manual theme toggling.
*   **Fully Responsive:** A beautiful UI that works perfectly on desktop, tablet, and mobile.

## 🛠️ Tech Stack

*   **Framework:** [Next.js 16](https://nextjs.org/) (App Router, React 19)
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
*   **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Charts:** [Recharts](https://recharts.org/)
*   **Backend & DB:** [Firebase](https://firebase.google.com/) (Authentication & Firestore)
*   **Deployment:** [Vercel](https://vercel.com/)

## 💻 Getting Started

### Prerequisites
*   Node.js 18+ installed

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/fintrack.git
    cd fintrack
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Firebase**
    *   Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)
    *   Enable **Authentication** (Email/Password)
    *   Enable **Firestore Database**
    *   Create a `.env.local` file in the root based on `.env.local.example` and add your Firebase config keys.

4.  **Run the development server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

## 🛡️ Firestore Security Rules

To ensure user data privacy, FinTrack uses robust Firestore security rules:

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

## 📬 Contact & Links

*   **Live Demo:** [Add your deployed link here]
*   **Developer:** [Your Name / Link to Portfolio]
