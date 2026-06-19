import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "mekanik-demo-2026",
  appId: "1:264860318859:web:f6f9950c3864a63686e88e",
  storageBucket: "mekanik-demo-2026.firebasestorage.app",
  apiKey: "AIzaSyAyWMp0MtcQQyX21vzvVrzXJ17nucNoOhQ",
  authDomain: "mekanik-demo-2026.firebaseapp.com",
  messagingSenderId: "264860318859"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
