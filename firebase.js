import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeAuth, 
  getAuth, 
  getReactNativePersistence 
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyAV_dlUCilsDOeX357aUcN5E3ySwJeljqI",
  authDomain: "asistencia-5f5b0.firebaseapp.com",
  projectId: "asistencia-5f5b0",
  storageBucket: "asistencia-5f5b0.appspot.com",
  messagingSenderId: "476024237486",
  appId: "1:476024237486:web:9de0fd507624b10f9e6c3f"
};

// 1. Chequea si ya existe una app inicializada.
//    Si no existe, la inicializa; si existe, la reutiliza.
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// 2. De igual manera, con Auth en React Native se usa initializeAuth solo
//    si no ha sido llamado antes; si ya está inicializado, tomamos getAuth.
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    throw error;
  }
}

// 3. Firestore
const db = getFirestore(app);

// 4. Functions (si lo necesitas)
const functions = getFunctions(app);
export const setAdminRole = async (uid) => {
  const setAdminRoleFn = httpsCallable(functions, 'setAdminRole');
  const result = await setAdminRoleFn({ uid });
  return result.data;
};

export { app, auth, db, functions };

