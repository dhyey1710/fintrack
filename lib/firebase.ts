/**
 * lib/firebase.ts
 * ──────────────────────────────────────────────────────────
 * Initialises Firebase and exports the services we use:
 *   • auth  — Firebase Authentication (email/password)
 *   • db    — Cloud Firestore (real-time database)
 *
 * All config values come from environment variables so that
 * your API keys never get committed to git.
 *
 * TODO (you): Copy .env.local.example → .env.local and fill
 *             in your Firebase project credentials.
 * ──────────────────────────────────────────────────────────
 */

import { initializeApp, getApps } from "firebase/app"
import { getAuth }                 from "firebase/auth"
import { getFirestore }            from "firebase/firestore"

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Prevent re-initialisation in Next.js hot-reload / SSR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)      // Auth service
export const db   = getFirestore(app) // Firestore service
export default app
