// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAV_dlUCilsDOeX357aUcN5E3ySwJeljqI",
  authDomain: "asistencia-5f5b0.firebaseapp.com",
  projectId: "asistencia-5f5b0",
  storageBucket: "asistencia-5f5b0.appspot.com",
  messagingSenderId: "476024237486",
  appId: "1:476024237486:web:9de0fd507624b10f9e6c3f"
};

// Inicializa Firebase App
const app = initializeApp(firebaseConfig);

// Inicializa Firebase Auth con persistencia
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Inicializa Firestore
const db = getFirestore(app);

export { auth, db };
