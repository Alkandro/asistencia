// Attendance.js
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase'; // Asegúrate de que Firebase esté correctamente configurado

export const recordCheckIn = async (userData) => {
  // Verifica si el usuario está autenticado
  if (!auth.currentUser) {
    throw new Error('El usuario no está autenticado');
  }

  const newRecord = {
    userId: auth.currentUser.uid,  // Asegúrate de que el userId esté correcto
    email: auth.currentUser.email, // Se incluye el email del usuario
    timestamp: serverTimestamp(),
    type: 'check-in',

    // Agrega aquí los campos que tengas en "users":
    phone: userData?.phone || "",
    ciudad: userData?.ciudad || "",
    provincia: userData?.provincia || "",
    peso: userData?.peso || "",
    altura: userData?.altura || "",
    edad: userData?.edad || "",
    genero: userData?.genero || "",
    nombre: userData?.nombre || "",
    apellido: userData?.apellido || "",
    username: userData?.username || "",
    // etc... Asegúrate de que coincidan los nombres que guardas en "users".
  };

  try {
    // Registra el check-in en la colección attendanceHistory
    const docRef = await addDoc(collection(db, 'attendanceHistory'), newRecord);
    console.log("Check-in registrado con ID: ", docRef.id);
    return docRef.id;
  } catch (err) {
    console.error("Error al registrar el check-in:", err);
    throw new Error(`Error recording check-in: ${err.message}`);
  }
};
