// import React, { useEffect, useState } from "react";
// import { NavigationContainer } from "@react-navigation/native";
// import { createStackNavigator } from "@react-navigation/stack";
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import { createDrawerNavigator } from "@react-navigation/drawer";
// import { ActivityIndicator, View, StyleSheet, Text } from "react-native";
// import Icon from "react-native-vector-icons/Ionicons";
// import LoginScreen from "./Login";
// import CheckInScreen from "./CheckInScreen";
// import AttendanceHistoryScreen from "./AttendanceHistoryScreen";
// import RegisterScreen from "./RegisterScreen";
// import UserProfileScreen from "./UserProfileScreen";
// import UserListScreen from "./UserListScreen";
// import Information from "./Information";
// import { auth, db } from "./firebase";
// import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"; // Asegúrate de importar correctamente estos métodos
// import AppSplashScreen from "./SplashScreen";
// import dayjs from "dayjs";

// const Stack = createStackNavigator();
// const Tab = createBottomTabNavigator();
// const Drawer = createDrawerNavigator();

// const CustomDrawerContent = ({ monthlyCheckInCount }) => (
//   <View style={styles.drawerContainer}>
//     <Text style={styles.title}>Historial Mensual</Text>
//     {Object.keys(monthlyCheckInCount).map((month) => (
//       <View key={month} style={styles.monthRow}>
//         <Text style={styles.monthText}>{month}</Text>
//         <Text style={styles.countText}>{monthlyCheckInCount[month]}</Text>
//       </View>
//     ))}
//   </View>
// );

// const UserBottomTabs = () => (
//   <Tab.Navigator
//     screenOptions={({ route }) => ({
//       tabBarIcon: ({ color, size }) => {
//         let iconName;
//         if (route.name === "CheckIn") iconName = "checkmark-circle-outline";
//         else if (route.name === "AttendanceHistory") iconName = "time-outline";
//         else if (route.name === "UserProfile") iconName = "person-outline";
//         return <Icon name={iconName} size={size} color={color} />;
//       },
//       tabBarActiveTintColor: "blue",
//       tabBarInactiveTintColor: "gray",
//     })}
//   >
//     <Tab.Screen name="CheckIn" component={CheckInScreen} options={{ title: "Check In", headerTitleAlign: "center" }} />
//     <Tab.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} options={{ title: "Historial de Asistencia", headerTitleAlign: "center" }} />
//     <Tab.Screen name="UserProfile" component={UserProfileScreen} options={{ title: "Perfil", headerTitleAlign: "center" }} />
//   </Tab.Navigator>
// );

// const AppDrawer = ({ monthlyCheckInCount }) => (
//   <Drawer.Navigator
//     initialRouteName="UserTabs"
//     drawerContent={(props) => <CustomDrawerContent {...props} monthlyCheckInCount={monthlyCheckInCount} />}
//   >
//     <Drawer.Screen name="UserTabs" component={UserBottomTabs} options={{ title: "Inicio", headerTitleAlign: "center" }} />
//     <Drawer.Screen name="Information" component={Information} options={{ title: "Información" }} />
//     <Drawer.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
//   </Drawer.Navigator>
// );

// const App = () => {
//   const [isSplashLoading, setIsSplashLoading] = useState(true);
//   const [isLoading, setIsLoading] = useState(true);
//   const [user, setUser] = useState(null);
//   const [role, setRole] = useState(null);
//   const [monthlyCheckInCount, setMonthlyCheckInCount] = useState({});

//   // UseEffect para cargar el conteo de check-ins mensuales
//   useEffect(() => {
//     const fetchMonthlyCheckInCount = async () => {
//       const user = auth.currentUser;
//       if (user) {
//         const q = query(collection(db, "attendanceHistory"), where("userId", "==", user.uid));
//         const querySnapshot = await getDocs(q);
//         const counts = {}; // Objeto para contar los check-ins por mes
//         querySnapshot.forEach((doc) => {
//           const data = doc.data();
//           const timestamp = data.timestamp?.seconds ? new Date(data.timestamp.seconds * 1000) : null;
//           if (timestamp) {
//             const monthKey = dayjs(timestamp).format("YYYY-MM"); // Formato 'YYYY-MM' (Ej: '2024-01')
//             counts[monthKey] = (counts[monthKey] || 0) + 1; // Aumenta el contador para ese mes
//           }
//         });
//         setMonthlyCheckInCount(counts); // Actualiza el estado con el conteo
//       }
//     };

//     fetchMonthlyCheckInCount();
//   }, []); // Se ejecuta una vez al montar el componente

//   // Temporizador para el splash screen
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setIsSplashLoading(false);
//     }, 15000);
//     return () => clearTimeout(timer);
//   }, []);

//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
//       if (authUser) {
//         setUser(authUser);
//         const userDocRef = doc(db, "users", authUser.uid);
//         const userDoc = await getDoc(userDocRef);
//         if (userDoc.exists()) setRole(userDoc.data().role);
//       } else {
//         setUser(null);
//         setRole(null);
//       }
//       setIsLoading(false);
//     });
//     return () => unsubscribe();
//   }, []);

//   if (isSplashLoading) {
//     return <AppSplashScreen />;
//   }

//   if (isLoading) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" color="#0000ff" />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//       <Stack.Navigator initialRouteName={user ? (role === "admin" ? "UserList" : "Drawer") : "Login"}>
//         {!user ? (
//           <>
//             <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
//             <Stack.Screen name="Information" component={Information} options={{ title: "Information", headerTitleAlign: "center" }} />
//             <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Registro de Usuario", headerTitleAlign: "center" }} />
//           </>
//         ) : role === "admin" ? (
//           <>
//             <Stack.Screen name="UserList" component={UserListScreen} />
//             <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: "User Profile", headerTitleAlign: "center" }} />
//           </>
//         ) : (
//           <Stack.Screen name="Drawer" options={{ headerShown: false, headerTitleAlign: "center" }}>
//             {(props) => <AppDrawer {...props} monthlyCheckInCount={monthlyCheckInCount} />}
//           </Stack.Screen>
//         )}
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// const styles = StyleSheet.create({
//   drawerContainer: {
//     padding: 16,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   monthRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingVertical: 5,
//   },
//   monthText: {
//     fontSize: 16,
//   },
//   countText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });

// export default App;

// App.js
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
    }, 15000); // Puedes ajustar el tiempo aquí
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
