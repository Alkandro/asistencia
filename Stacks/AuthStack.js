import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "../LoginScreens/LoginScreen";
import RegisterScreen from "../LoginScreens/RegisterScreen";
import Information from "../LoginScreens/Information";
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
        options={{ title: t("Registro de Usuario"), headerTitleAlign: "center" }} 
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
