import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

const firebaseConfig = Object.freeze({
  apiKey: "__FIREBASE_WEB_API_KEY__",
  authDomain: "gabo-service.firebaseapp.com",
  projectId: "gabo-service",
  storageBucket: "gabo-service.firebasestorage.app",
  messagingSenderId: "397025942439",
  appId: "1:397025942439:web:4cc0abc537ca63e0213482",
});

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
