import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";

// Importa las pantallas que quieras en las pestañas
import UserListScreen from "./UserListScreen";
import UserDetailScreen from "./UserDetailScreen"; // Opcional
import UserProfileScreen from "../UserProfileScreen"; // Opcional

const Tab = createBottomTabNavigator();

const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Íconos para cada pestaña
        tabBarIcon: ({ color, size }) => {
          let iconName = "home"; 
          if (route.name === "UserList") iconName = "people-outline";
          else if (route.name === "UserDetailsTab") iconName = "information-circle-outline";
          else if (route.name === "UserProfileTab") iconName = "person-outline";
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "blue",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen 
        name="UserList" 
        component={UserListScreen} 
        options={{ title: "Usuarios" }}
      />
      {/* Agrega más pestañas si lo deseas */}
      <Tab.Screen 
        name="UserDetailsTab" 
        component={UserDetailScreen}
        options={{ title: "Detalles" }}
      />
      <Tab.Screen
        name="UserProfileTab"
        component={UserProfileScreen}
        options={{ title: "Perfil" }}
      />
    </Tab.Navigator>
  );
};

export default AdminTabNavigator;
