import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";
import Information from "./Information";
import { useTranslation } from 'react-i18next';

const Stack = createStackNavigator();

const AuthStack = () => {
  const { t } = useTranslation();  // Hook para traducción
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
        options={{ title: t("Información"), headerTitleAlign: "center" ,headerBackTitle:false}} 
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
