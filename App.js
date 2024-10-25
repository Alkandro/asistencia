import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import LoginScreen from "./Login";
import CheckInScreen from "./CheckInScreen";
import AttendanceHistoryScreen from "./AttendanceHistoryScreen";
import RegisterScreen from "./RegisterScreen";
import UserProfileScreen from "./UserProfileScreen";
import UserListScreen from "./UserListScreen";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const UserBottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "CheckIn") {
            iconName = "checkmark-circle-outline";
          } else if (route.name === "AttendanceHistory") {
            iconName = "time-outline";
          } else if (route.name === "UserProfile") {
            iconName = "person-outline";
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "blue",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="CheckIn" component={CheckInScreen} options={{ title: "Check In" }} />
      <Tab.Screen 
      name="AttendanceHistory" 
      component={AttendanceHistoryScreen} 
      options={{ title: "Historial de Asistencia", headerTitleAlign: "center" }}
     
      
       />
      <Tab.Screen name="UserProfile" component={UserProfileScreen} options={{ title: "Perfil" }} />
    </Tab.Navigator>
  );
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

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

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? (role === "admin" ? "UserList" : "UserTabs") : "Login"}>
        {!user ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                headerShown: false,
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
            }} />
          </>
        ) : (
          <Stack.Screen
            name="UserTabs"
            component={UserBottomTabs}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
