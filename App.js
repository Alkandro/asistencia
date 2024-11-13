import React, { useEffect, useState, useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ActivityIndicator, View } from "react-native";
import { auth, db } from "./firebase"; // Importa Firebase Auth y Firestore desde tu configuración de Firebase
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import dayjs from "dayjs";

// Importa los componentes y pantallas de la aplicación
import AppDrawer from "./Drawer";
import LoginScreen from "./Login";
import RegisterScreen from "./RegisterScreen";
import UserProfileScreen from "./UserProfileScreen";
import UserListScreen from "./UserListScreen";
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
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        const userDocRef = doc(db, "users", authUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setRole(userDoc.data().role); // Actualiza el rol del usuario
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Muestra la pantalla de splash si está cargando
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
      
      <Stack.Navigator initialRouteName={user ? (role === "admin" ? "UserList" : "Drawer") : "Login"}>
        {!user ? (
          // Si el usuario no está autenticado, muestra las pantallas de Login y Registro
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Information" component={Information} options={{ title: "Información", headerTitleAlign: "center" }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Registro de Usuario", headerTitleAlign: "center" }} />
          </>
        ) : role === "admin" ? (
          // Si el usuario es administrador, muestra la lista de usuarios y el perfil
          <>
            <Stack.Screen name="UserList" component={UserListScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: "Perfil de Usuario", headerTitleAlign: "center" }} />
          </>
        ) : (
          // Si el usuario es normal, muestra el Drawer con las pestañas de usuario
          <Stack.Screen name="Drawer" options={{ headerShown: false, headerTitleAlign: "center" }}>
            {(props) => (
              <AppDrawer 
                {...props} 
                monthlyCheckInCount={monthlyCheckInCount} 
                fetchMonthlyCheckInCount={fetchMonthlyCheckInCount} 
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
