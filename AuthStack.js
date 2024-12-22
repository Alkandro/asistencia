import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";
import Information from "./Information";
import UserListScreen from "./UserListScreen";

const Stack = createStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator initialRouteName="LoginScreen">
      <Stack.Screen 
        name="LoginScreen" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
      />
      
      <Stack.Screen 
        name="Information" 
        component={Information} 
        options={{ title: "Información", headerTitleAlign: "center" }} 
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ title: "Registro de Usuario", headerTitleAlign: "center" }} 
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
