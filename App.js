import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ActivityIndicator, View } from "react-native";
import LoginScreen from "./Login";
import CheckInScreen from "./CheckInScreen";
import AttendanceHistoryScreen from "./AttendanceHistoryScreen";
import RegisterScreen from "./RegisterScreen";
import UserProfileScreen from "./UserProfileScreen";
import UserListScreen from "./UserListScreen"; // Importa la pantalla para admins
import { auth, db } from "./firebase"; // Asegúrate de importar Firestore
import { doc, getDoc } from "firebase/firestore";

const Stack = createStackNavigator();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // Nuevo estado para almacenar el rol del usuario

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        // Obtener el rol del usuario desde Firestore
        const userDocRef = doc(db, "users", authUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setRole(userDoc.data().role); // Establecer el rol del usuario
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup al desmontar el componente
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? (role === "admin" ? "UserList" : "CheckIn") : "Login"}>
        {!user ? (
          <>
            <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{
             headerShown:false,
            }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{
                title: "Registro de Usuario",
                headerTitleAlign: "center",
                headerStyle: {
                  backgroundColor: "white",
                },
                headerTintColor: "black",
                headerTitleStyle: {
                  fontWeight: "bold",
                },
              }}
            />
          </>
        ) : role === "admin" ? (
          <>
            <Stack.Screen name="UserListScreen" component={UserListScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="CheckIn" component={CheckInScreen} />
            <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
