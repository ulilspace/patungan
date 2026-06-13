import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCeIXCqLfp6OVAhDzVTrejGtS51HkgTpwU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ulilspace-patungan.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ulilspace-patungan",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ulilspace-patungan.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "3093638951",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:3093638951:web:769d9be46b8ee84e15c302",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
