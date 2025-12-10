import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAZSWYqX3_56uyPcpvqv_VT48rmMgMfTNs",
  authDomain: "chatify-99ce2.firebaseapp.com",
  projectId: "chatify-99ce2",
  storageBucket: "chatify-99ce2.firebasestorage.app",
  messagingSenderId: "124265175890",
  appId: "1:124265175890:web:dfaf5f4cb0ff2a4388b88b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
