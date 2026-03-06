import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID

export const isFirebaseConfigured =
  typeof apiKey === 'string' && apiKey.length > 0 &&
  typeof projectId === 'string' && projectId.length > 0

// Only initialize Firebase when credentials are present.
// getAuth() throws auth/invalid-api-key at module load time if apiKey is missing,
// which would crash the entire renderer before React even mounts.
let _app: FirebaseApp | undefined
let _auth: Auth | undefined
let _db: Firestore | undefined

if (isFirebaseConfigured) {
  _app = initializeApp({
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  })
  _auth = getAuth(_app)
  _db = getFirestore(_app)
}

// Consumers always guard with isFirebaseConfigured before using these
export const app = _app as FirebaseApp
export const auth = _auth as Auth
export const db = _db as Firestore
export default app
