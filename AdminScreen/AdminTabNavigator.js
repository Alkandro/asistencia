import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/FontAwesome6";

// Importa las pantallas que quieras en las pestañas
import UserListScreen from "./UserListScreen";
import MessagePreviewScreen from "./MessagePreviewScreen"; // Opcional
import CreateMessageScreen from "./CreateMessageScreen";
import { useTranslation } from "react-i18next";

const Tab = createBottomTabNavigator();

const AdminTabNavigator = () => {
  const { t, } = useTranslation(); // Hook para traducción
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Íconos para cada pestaña
        tabBarIcon: ({ color, size }) => {
          let iconName = "home"; 
          if (route.name === "UserList") iconName = "user-group";
          else if (route.name === "CreateMessage") iconName = "envelopes-bulk";
          else if (route.name === "MessagePreviewScreen") iconName = "eye";
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "blue",
        tabBarInactiveTintColor: "black",
        headerTitleAlign: 'center',
        tabBarStyle: {
          backgroundColor: "#d3d3d3", // Por ejemplo, un gris claro
        },
      })}
    >
      <Tab.Screen 
        name="UserList" 
        component={UserListScreen} 
        options={{ title: t("Usuarios") }}
      />
      {/* Agrega más pestañas si lo deseas */}
      <Tab.Screen 
        name="CreateMessage" 
        component={CreateMessageScreen}
        options={{ title:t("Mensaje") }}
      />
      <Tab.Screen
        name="MessagePreviewScreen"
        component={MessagePreviewScreen}
        options={{ title: t("Vista previa") }}
      />
    </Tab.Navigator>
  );
};

export default AdminTabNavigator;
