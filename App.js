import React, { useEffect, useState, useCallback, } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ActivityIndicator, View, SafeAreaView } from "react-native";
import { auth, db } from "./firebase"; // Importa Firebase Auth y Firestore desde tu configuración de Firebase
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import dayjs from "dayjs";

// Importar los nuevos stacks
import AuthStack from "./AuthStack";
import AdminStack from "./AdminStack";
import UserStack from "./UserStack";
// Importa los componentes y pantallas de la aplicación
import AppDrawer from "./Drawer";
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";
import UserProfileScreen from "./UserProfileScreen";
import UserListScreen from "./AdminScreen/UserListScreen";
import Information from "./Information";
import AppSplashScreen from "./SplashScreen";

const Stack = createStackNavigator();

const App = () => {
  const [isSplashLoading, setIsSplashLoading] = useState(true); // Estado para la pantalla de carga inicial
  const [isLoading, setIsLoading] = useState(true); // Estado para el proceso de autenticación
  const [user, setUser] = useState(null); // Estado para el usuario actual
  const [role, setRole] = useState(null); // Estado para el rol del usuario
  const [monthlyCheckInCount, setMonthlyCheckInCount] = useState({}); // Estado para el conteo mensual de check-ins

  // Función para obtener el conteo mensual de check-ins del usuario desde Firestore
  const fetchMonthlyCheckInCount = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log("Fetching check-in count for user:", currentUser.uid);

      const q = query(
        collection(db, "attendanceHistory"),
        where("userId", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);

      const counts = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Check-in document data:", data);

        const timestamp = data.timestamp?.seconds
          ? new Date(data.timestamp.seconds * 1000)
          : null;
        if (timestamp) {
          const monthKey = dayjs(timestamp).format("YYYY-MM");
          counts[monthKey] = (counts[monthKey] || 0) + 1;
        }
      });
      console.log("Monthly check-in count:", counts);
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
      </View>
    );
  }
  

  // Configuración de la navegación
  return (
    
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
);
};

export default App;
