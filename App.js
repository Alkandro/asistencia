// import React, { useEffect, useState } from "react";
// import { NavigationContainer } from "@react-navigation/native";
// import { createStackNavigator } from "@react-navigation/stack";
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import { createDrawerNavigator } from "@react-navigation/drawer";  // Importa el Drawer Navigator
// import { ActivityIndicator, View } from "react-native";
// import Icon from "react-native-vector-icons/Ionicons";
// import LoginScreen from "./Login";
// import CheckInScreen from "./CheckInScreen";
// import AttendanceHistoryScreen from "./AttendanceHistoryScreen";
// import RegisterScreen from "./RegisterScreen";
// import UserProfileScreen from "./UserProfileScreen";
// import UserListScreen from "./UserListScreen";
// import Information from "./Information";
// import { auth, db } from "./firebase";
// import { doc, getDoc } from "firebase/firestore";
// import 'react-native-gesture-handler';
// import 'react-native-reanimated';

// const Stack = createStackNavigator();
// const Tab = createBottomTabNavigator();
// const Drawer = createDrawerNavigator(); // Define el Drawer Navigator

// const UserBottomTabs = () => {
//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         tabBarIcon: ({ color, size }) => {
//           let iconName;
//           if (route.name === "CheckIn") {
//             iconName = "checkmark-circle-outline";
//           } else if (route.name === "AttendanceHistory") {
//             iconName = "time-outline";
//           } else if (route.name === "UserProfile") {
//             iconName = "person-outline";
//           }
//           return <Icon name={iconName} size={size} color={color} />;
//         },
//         tabBarActiveTintColor: "blue",
//         tabBarInactiveTintColor: "gray",
//       })}
//     >
//       <Tab.Screen name="CheckIn" component={CheckInScreen} options={{ title: "Check In" }} />
//       <Tab.Screen 
//       name="AttendanceHistory" 
//       component={AttendanceHistoryScreen} 
//       options={{ title: "Historial de Asistencia", headerTitleAlign: "center" }}
     
      
//        />
//       <Tab.Screen name="UserProfile" component={UserProfileScreen} options={{ title: "Perfil" }} />
//     </Tab.Navigator>
//   );
// };
// // Configuración del Drawer Navigator
// const AppDrawer = () => (
//   <Drawer.Navigator initialRouteName="Home">
//     <Drawer.Screen name="Home" component={UserBottomTabs} />
//     <Drawer.Screen name="Monthly Report" component={AttendanceHistoryScreen} />
//     {/* Aquí puedes agregar más pantallas para los meses u otras propiedades */}
//   </Drawer.Navigator>
// );

// const App = () => {
//   const [isLoading, setIsLoading] = useState(true);
//   const [user, setUser] = useState(null);
//   const [role, setRole] = useState(null);

//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
//       if (authUser) {
//         setUser(authUser);
//         const userDocRef = doc(db, "users", authUser.uid);
//         const userDoc = await getDoc(userDocRef);
//         if (userDoc.exists()) {
//           setRole(userDoc.data().role);
//         }
//       } else {
//         setUser(null);
//         setRole(null);
//       }
//       setIsLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   if (isLoading) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" color="#0000ff" />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//       <Stack.Navigator initialRouteName={user ? (role === "admin" ? "UserList" : "UserTabs") : "Login"}>
//         {!user ? (
//           <>
//             <Stack.Screen
//               name="Login"
//               component={LoginScreen}
//               options={{
//                 headerShown: false,
//               }}
//             />
//             <Stack.Screen name="Information" component={Information} />
//             <Stack.Screen
//               name="Register"
//               component={RegisterScreen}
//               options={{
//                 title: "Registro de Usuario",
//                 headerTitleAlign: "center",
//                 headerStyle: { backgroundColor: "white" },
//                 headerTintColor: "black",
//                 headerTitleStyle: { fontWeight: "bold" },
//               }}
//             />
//           </>
//         ) : role === "admin" ? (
//           <>
//             <Stack.Screen name="UserList" component={UserListScreen} />
            
//             <Stack.Screen 
//             name="UserProfile" 
//             component={UserProfileScreen}
//             options={{
//               title: "User Profile",
//               headerTitleAlign: "center",
//               headerStyle: { backgroundColor: "white" },
//               headerTintColor: "black",
//               headerTitleStyle: { fontWeight: "bold" },
//             }} />
//           </>
//         ) : (
//           <>
//           <Stack.Screen name="Drawer" component={AppDrawer} options={{ headerShown: false }} />  
//           <Stack.Screen
//             name="UserTabs"
//             component={UserBottomTabs}
//             options={{ headerShown: false }}
//           />
//           </>
//         )}
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default App;


import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer"; 
import { ActivityIndicator, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import LoginScreen from "./Login";
import CheckInScreen from "./CheckInScreen";
import AttendanceHistoryScreen from "./AttendanceHistoryScreen";
import RegisterScreen from "./RegisterScreen";
import UserProfileScreen from "./UserProfileScreen";
import UserListScreen from "./UserListScreen";
import Information from "./Information";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import AppSplashScreen from "./SplashScreen"; // Importa tu componente de SplashScreen

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const UserBottomTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === "CheckIn") iconName = "checkmark-circle-outline";
        else if (route.name === "AttendanceHistory") iconName = "time-outline";
        else if (route.name === "UserProfile") iconName = "person-outline";
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "blue",
      tabBarInactiveTintColor: "gray",
    })}
  >
    <Tab.Screen name="CheckIn" component={CheckInScreen} options={{ title: "Check In", headerTitleAlign: "center" }} />
    <Tab.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} options={{ title: "Historial de Asistencia", headerTitleAlign: "center" }} />
    <Tab.Screen name="UserProfile" component={UserProfileScreen} options={{ title: "Perfil", headerTitleAlign: "center" }} />
  </Tab.Navigator>
);

const AppDrawer = () => (
  <Drawer.Navigator initialRouteName="UserTabs">
    <Drawer.Screen name="UserTabs" component={UserBottomTabs} options={{ title: "Inicio", headerTitleAlign: "center" }} />
    <Drawer.Screen name="Information" component={Information} options={{ title: "Información" }} />
  </Drawer.Navigator>
);

const App = () => {
  const [isSplashLoading, setIsSplashLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  // Controla la duración del splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        const userDocRef = doc(db, "users", authUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) setRole(userDoc.data().role);
      } else {
        setUser(null);
        setRole(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isSplashLoading) {
    return <AppSplashScreen />; // Splash screen mientras carga
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? (role === "admin" ? "UserList" : "Drawer") : "Login"}>
        {!user ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Information" 
              component={Information}
              options={{
                title: "Information",
                headerTitleAlign: "center",
                headerStyle: { backgroundColor: "black" },
                headerTintColor: "white",
                headerTitleStyle: { fontWeight: "bold" },
              }} 
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{
                title: "Registro de Usuario",
                headerTitleAlign: "center",
                headerStyle: { backgroundColor: "white" },
                headerTintColor: "black",
                headerTitleStyle: { fontWeight: "bold" },
              }}
            />
          </>
        ) : role === "admin" ? (
          <>
            <Stack.Screen name="UserList" component={UserListScreen} />
            <Stack.Screen
              name="UserProfile"
              component={UserProfileScreen}
              options={{
                title: "User Profile",
                headerTitleAlign: "center",
                headerStyle: { backgroundColor: "white" },
                headerTintColor: "black",
                headerTitleStyle: { fontWeight: "bold" },
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Drawer" component={AppDrawer} options={{ headerShown: false, headerTitleAlign: "center" }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
