
import * as firebaseApp from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Workaround: Cast to any to bypass TypeScript errors regarding missing exports in firebase/app
const { initializeApp, getApps, getApp } = firebaseApp as any;

const firebaseConfig = {
  apiKey: "AIzaSyCKfFRG53GggBNgMyEuBGy-FJKFf4Eqni8",
  authDomain: "lumina-f7d88.firebaseapp.com",
  projectId: "lumina-f7d88",
  storageBucket: "lumina-f7d88.firebasestorage.app",
  messagingSenderId: "31263065340",
  appId: "1:31263065340:web:b7857a93cec5a70565c379",
  measurementId: "G-BRW8RLKY2X"
};

// Initialize Firebase
// Singleton pattern to prevent hot-reload errors
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
