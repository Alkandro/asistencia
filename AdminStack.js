// AdminStack.js
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import UserDetailScreen from "./AdminScreen/UserDetailScreen";
import UserProfileScreen from "./UserProfileScreen";
import AdminTabNavigator from "./AdminScreen/AdminTabNavigator";

const Stack = createStackNavigator();

const AdminStack = () => {
  return (
    <Stack.Navigator initialRouteName="AdminTabs">
      {/* 1) Ruta que muestra el TabNavigator */}
      <Stack.Screen
        name="AdminTabs"
        component={AdminTabNavigator}
        options={{ 
          headerShown: false }} // Para ocultar header si quieres
      />

      {/* 2) Otras pantallas stack adicionales (si las necesitas) */}
      <Stack.Screen
        name="UserDetailScreen"
        component={UserDetailScreen}
        options={{ 
          title: "Detalle del usuario" ,
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="UserProfileScreen"
        component={UserProfileScreen}
        options={{ title: "Perfil de Usuario", headerTitleAlign: "center" }}
      />
    </Stack.Navigator>
  );
};

export default AdminStack;
