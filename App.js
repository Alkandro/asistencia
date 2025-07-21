import React, { useEffect, useState, useCallback, } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ActivityIndicator, View, Text } from "react-native";
import { auth, db } from "./firebase"; // Importa Firebase Auth y Firestore desde tu configuración de Firebase
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Provider as PaperProvider } from 'react-native-paper';
import dayjs from "dayjs";
import { useTranslation } from "react-i18next"; // Importar traducción
import "./i18n"; // Importar configuración de idiomas

// Importar los nuevos stacks
import AuthStack from "./Stacks/AuthStack";
import AdminStack from "./Stacks/AdminStack";
import UserStack from "./Stacks/UserStack";
import AppSplashScreen from "./LoginScreens/SplashScreen";

const Stack = createStackNavigator();

const App = () => {
  const { t, i18n } = useTranslation(); // Hook para traducir textos
  const [isSplashLoading, setIsSplashLoading] = useState(true); // Estado para la pantalla de carga inicial
  const [isLoading, setIsLoading] = useState(true); // Estado para el proceso de autenticación
  const [user, setUser] = useState(null); // Estado para el usuario actual
  const [role, setRole] = useState(null); // Estado para el rol del usuario
  const [monthlyCheckInCount, setMonthlyCheckInCount] = useState({}); // Estado para el conteo mensual de check-ins

   // Detectar idioma al iniciar
   useEffect(() => {
    console.log("🌍 Idioma actual:", i18n.language); 
    i18n.changeLanguage(i18n.language); // Asegurar que se actualiza el idioma
  }, [i18n]);
  // Función para obtener el conteo mensual de check-ins del usuario desde Firestore
  const fetchMonthlyCheckInCount = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const q = query(
        collection(db, "attendanceHistory"),
        where("userId", "==", currentUser.uid)  );
      const querySnapshot = await getDocs(q);
      const counts = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.seconds
          ? new Date(data.timestamp.seconds * 1000)
          : null;
        if (timestamp) {
          const monthKey = dayjs(timestamp).format("YYYY-MM");
          counts[monthKey] = (counts[monthKey] || 0) + 1;
        }
      });
      setMonthlyCheckInCount(counts);
    }
  }, []);

  // Llama a fetchMonthlyCheckInCount al montar el componente
  useEffect(() => {
    fetchMonthlyCheckInCount();
  }, [fetchMonthlyCheckInCount]);

  // Controla la pantalla de splash al iniciar la aplicación
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashLoading(false);
    }, 14000); // Puedes ajustar el tiempo aquí
    return () => clearTimeout(timer);
  }, []);

  // Configura el listener para cambios en la autenticación del usuario
  // Auth listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        const userDocRef = doc(db, "users", authUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isSplashLoading) {
    return <AppSplashScreen />;
  }
 
  // Muestra un indicador de carga si la autenticación aún se está procesando
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>{t("loading")}</Text>
      </View>
    );
  }
  

  // Configuración de la navegación
  return (
    <PaperProvider>
    <NavigationContainer>
    {!user ? (
      // Si no hay usuario, stack de autenticación
      <AuthStack />
    ) : role === "admin" ? (
      // Si es admin, stack para admin
      <AdminStack />
    ) : (
      // Si es usuario normal, stack para usuario
      <UserStack 
        monthlyCheckInCount={monthlyCheckInCount} 
        fetchMonthlyCheckInCount={fetchMonthlyCheckInCount}
      />
    )}
  </NavigationContainer>
  </PaperProvider>
);
};

export default App;
