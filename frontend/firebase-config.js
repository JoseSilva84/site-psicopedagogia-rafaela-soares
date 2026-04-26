import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";

// SUAS CHAVES DO FIREBASE ABAIXO
const firebaseConfig = {
  apiKey: "AIzaSyBbhFXd8ry5hyCnrQE1AC_SUGtU1yhGSI4",
  authDomain: "blog-rafaela-3174c.firebaseapp.com",
  projectId: "blog-rafaela-3174c",
  storageBucket: "blog-rafaela-3174c.firebasestorage.app",
  messagingSenderId: "611810141622",
  appId: "1:611810141622:web:5704c54d862be12b004d17",
  measurementId: "G-KFS834N7C5"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { 
  app, db, auth, storage,
  collection, getDocs, getDoc, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy, 
  signInWithEmailAndPassword, onAuthStateChanged, signOut,
  ref, uploadBytes, getDownloadURL
};
