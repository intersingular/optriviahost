// ─── Firebase Configuration ──────────────────────
// Replace the values below with YOUR Firebase project config.
// See README.md for step-by-step instructions on where to find these.

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD19V99NlV4F_kGqBq9FM78OvoeZsA0kxA",
  authDomain: "op-triviahost.firebaseapp.com",
  databaseURL: "https://op-triviahost-default-rtdb.firebaseio.com",
  projectId: "op-triviahost",
  storageBucket: "op-triviahost.firebasestorage.app",
  messagingSenderId: "999814681642",
  appId: "1:999814681642:web:7a492a76bc30da514e9f53",
  measurementId: "G-TKXYCXLE1X"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);
