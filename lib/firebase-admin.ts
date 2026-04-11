/**
 * lib/firebase-admin.ts
 * ──────────────────────────────────────────────────────────
 * Initializes the Firebase Admin SDK for server-side environments.
 * Used exclusively to decode and verify JWT ID tokens passed 
 * by the client to authenticated API routes.
 * ──────────────────────────────────────────────────────────
 */

import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"

export function customInitApp() {
  if (getApps().length > 0) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Handle environments that might pass the private key with literal '\n'
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("⚠️ Firebase Admin credentials are not set. Authenticated routes will fail.");
    return;
  }

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export { getAuth };
