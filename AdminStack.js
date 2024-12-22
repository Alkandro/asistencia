// AdminStack.js
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import UserListScreen from "./UserListScreen";
import UserProfileScreen from "./UserProfileScreen";

const Stack = createStackNavigator();

const AdminStack = () => {
  return (
    <Stack.Navigator initialRouteName="UserListScreen">
      <Stack.Screen
        name="UserListScreen"
        component={UserListScreen}
        options={{ title: "Lista de Usuarios", headerTitleAlign: "center" }}
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
