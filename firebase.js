import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeAuth, 
  getAuth, 
  getReactNativePersistence 
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyCWuhsMbzOEWm6PRyETo0MDhQER6bW4adU",
  authDomain: "tashiro-jiujitsu.firebaseapp.com",
  projectId: "tashiro-jiujitsu",
  storageBucket: "tashiro-jiujitsu.firebasestorage.app",
  messagingSenderId: "949340466829",
  appId: "1:949340466829:web:a443b570ee1f49e3a97cc4"
  // apiKey: "AIzaSyAV_dlUCilsDOeX357aUcN5E3ySwJeljqI",
  // authDomain: "asistencia-5f5b0.firebaseapp.com",
  // projectId: "asistencia-5f5b0",
  // storageBucket: "asistencia-5f5b0.firebasestorage.app",
  // messagingSenderId: "476024237486",
  // appId: "1:476024237486:web:9de0fd507624b10f9e6c3f"
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
// 5. Storage: creamos y exportamos la instancia
const storage = getStorage(app);

export { app, auth, db, functions, storage };

