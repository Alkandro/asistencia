// AdminStack.js
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import UserDetailScreen from "../AdminScreen/UserDetailScreen";
import UserProfileScreen from "../LoginScreens/UserProfileScreen";
import AdminTabNavigator from "../AdminScreen/AdminTabNavigator";
import AdminProductManagementScreen from "../ShopAdmin/AdminProductManagementScreen";
import { useTranslation } from "react-i18next";

const Stack = createStackNavigator();

const AdminStack = () => {
  const { t } = useTranslation();
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
          title: t("Detalle del Usuario") ,
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="UserProfileScreen"
        component={UserProfileScreen}
        options={{ title: "Perfil de Usuario", headerTitleAlign: "center" }}
      />
       <Stack.Screen
        name="AdminProductManagementScreen" // <--- Este nombre debe coincidir con navigation.navigate()
        component={AdminProductManagementScreen}
        options={{
          title: "Gestión de Productos", // Título que aparecerá en el encabezado
          headerBackTitleVisible: false, // Oculta el título de la pantalla anterior
        }}
      />
    </Stack.Navigator>
  );
};

export default AdminStack;



// import React from "react";
// import { createStackNavigator } from "@react-navigation/stack";
// import UserDetailScreen from "../AdminScreen/UserDetailScreen";
// import UserProfileScreen from "../LoginScreens/UserProfileScreen";
// import AdminTabNavigator from "../AdminScreen/AdminTabNavigator";

// const Stack = createStackNavigator();

// const AdminStack = () => {
//   return (
//     <Stack.Navigator 
//       initialRouteName="AdminTabs"
//       screenOptions={{
//         headerStyle: {
//           backgroundColor: '#fff',
//           elevation: 0,
//           shadowOpacity: 0,
//           borderBottomWidth: 1,
//           borderBottomColor: '#E5E7EB',
//         },
//         headerTitleStyle: {
//           fontSize: 18,
//           fontWeight: '600',
//           color: '#111827',
//         },
//         headerTintColor: '#111827',
//         headerBackTitleVisible: false,
//       }}
//     >
//       {/* Navegación principal por pestañas */}
//       <Stack.Screen
//         name="AdminTabs"
//         component={AdminTabNavigator}
//         options={{ 
//           headerShown: false 
//         }}
//       />

//       {/* Pantalla de detalle de usuario */}
//       <Stack.Screen
//         name="UserDetailScreen"
//         component={UserDetailScreen}
//         options={{ 
//           title: "Detalle del Usuario",
//           headerTitleAlign: "center",
//         }}
//       />

//       {/* Pantalla de perfil de usuario (si es necesaria) */}
//       <Stack.Screen
//         name="UserProfileScreen"
//         component={UserProfileScreen}
//         options={{ 
//           title: "Perfil de Usuario", 
//           headerTitleAlign: "center" 
//         }}
//       />
//     </Stack.Navigator>
//   );
// };

// export default AdminStack;
