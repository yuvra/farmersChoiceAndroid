// firebaseConfig.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBU71SqoPEOXGc0VuL0bgkQ_aNsBDGltMQ",
  authDomain: "krushisarthi-be143.firebaseapp.com",
  projectId: "krushisarthi-be143",
  storageBucket: "krushisarthi-be143.appspot.com", // fixed `.app` to `.com`
  messagingSenderId: "865127188679",
  appId: "1:865127188679:web:2c9f164bfdd1f7444bd6e2",
  measurementId: "G-XCNXMFQ28G",
};

// Prevent reinitializing on hot reloads
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export { firebaseApp, db, auth };
