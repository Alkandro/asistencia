// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { View, Text, StyleSheet } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useTranslation } from 'react-i18next';

// // Importar pantallas
// import UserListScreen from './UserListScreen';
// import AdminMessagesScreen from './AdminMessagesScreen';
// import AdminDashboardScreen from './AdminDashboardScreen';
// import AdminSettingsScreen from './AdminSettingsScreen';

// const Tab = createBottomTabNavigator();

// const AdminTabNavigator = () => {
//   const { t } = useTranslation();

//   const getTabBarIcon = (routeName, focused, color, size) => {
//     let iconName;

//     switch (routeName) {
//       case 'Dashboard':
//         iconName = focused ? 'analytics' : 'analytics-outline';
//         break;
//       case 'Users':
//         iconName = focused ? 'people' : 'people-outline';
//         break;
//       case 'Messages':
//         iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
//         break;
//       case 'Settings':
//         iconName = focused ? 'settings' : 'settings-outline';
//         break;
//       default:
//         iconName = 'help-outline';
//     }

//     return <Ionicons name={iconName} size={size} color={color} />;
//   };

//   const CustomTabBarLabel = ({ focused, children }) => (
//     <Text style={[
//       styles.tabLabel,
//       { color: focused ? '#111827' : '#6B7280' }
//     ]}>
//       {children}
//     </Text>
//   );

//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         tabBarIcon: ({ focused, color, size }) =>
//           getTabBarIcon(route.name, focused, color, size),
         
//         tabBarLabel: ({ focused, children }) => (
//           <CustomTabBarLabel focused={focused}>
//             {children}
//           </CustomTabBarLabel>
//         ),
//         tabBarActiveTintColor: '#111827',
//         tabBarInactiveTintColor: '#6B7280',
//         tabBarStyle: styles.tabBar,
//         tabBarItemStyle: styles.tabBarItem,
//         headerShown: false,
//         tabBarHideOnKeyboard: true,
        
//       })}
//     >
//       <Tab.Screen
//         name="Dashboard"
//         component={AdminDashboardScreen}
//         options={{
//           tabBarLabel: 'Panel',
//         }}
//       />
//       <Tab.Screen
//         name="Users"
//         component={UserListScreen}
//         options={{
//           tabBarLabel: 'Usuarios',
//         }}
//       />
//       <Tab.Screen
//         name="Messages"
//         component={AdminMessagesScreen}
//         options={{
//           tabBarLabel: 'Mensajes',
//         }}
//       />
      
//       <Tab.Screen
//         name="Settings"
//         component={AdminSettingsScreen}
//         options={{
//           tabBarLabel: 'Ajustes',
//         }}
//       />
//     </Tab.Navigator>
//   );
// };

// const styles = StyleSheet.create({
//   tabBar: {
//     backgroundColor: '#fff',
//     borderTopWidth: 1,
//     borderTopColor: '#E5E7EB',
//     paddingTop: 4,
//     paddingBottom: 18,
//     height: 80,
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   tabBarItem: {
//     paddingVertical: 4,
//   },
//   tabLabel: {
//     fontSize: 12,
//     fontWeight: '500',
//     marginTop: 4,
//   },
// });

// export default AdminTabNavigator;















// // AdminTabNavigator.js - AdminTabNavigator sin errores useLocale
// import React from 'react';
// import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
// import { View, Text, StyleSheet } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { SafeAreaView } from 'react-native-safe-area-context';

// // ✅ IMPORTS EXISTENTES (SIN PROBLEMAS)
// import AdminDashboardScreen from './AdminDashboardScreen';
// import UserListScreen from './UserListScreen';
// import AdminMessagesScreen from './AdminMessagesScreen';
// import AdminSettingsScreen from './AdminSettingsScreen';

// // ✅ IMPORTS CORREGIDOS (SIN useTranslation)
// import AdminProductsScreen from './AdminProductsScreen';
// import AdminOrdersScreen from './AdminOrdersScreen';

// const Tab = createMaterialTopTabNavigator();

// const TabIcon = ({ name, color, size = 18, focused }) => (
//   <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
//     <Ionicons name={name} size={size} color={color} />
//   </View>
// );

// const AdminTabNavigator = () => {
//   return (
//     <SafeAreaView style={styles.container}>
//       {/* ✅ HEADER SIN TRADUCCIONES */}
//       <View style={styles.header}>
//         <View style={styles.headerContent}>
//           <Text style={styles.headerTitle}>Panel de Administración</Text>
//           <Text style={styles.headerSubtitle}>TASHIRO JIU-JITSU</Text>
//         </View>
//         <View style={styles.headerIcon}>
//           <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
//         </View>
//       </View>

//       <Tab.Navigator
//         screenOptions={{
//           tabBarActiveTintColor: '#111827',
//           tabBarInactiveTintColor: '#6B7280',
//           tabBarIndicatorStyle: { 
//             backgroundColor: '#111827', 
//             height: 3,
//             borderRadius: 2,
//           },
//           tabBarStyle: { 
//             backgroundColor: '#fff',
//             elevation: 4,
//             shadowOpacity: 0.1,
//             shadowOffset: { width: 0, height: 2 },
//             shadowRadius: 4,
//             borderBottomWidth: 1,
//             borderBottomColor: '#E5E7EB',
//           },
//           tabBarLabelStyle: { 
//             fontSize: 11, 
//             fontWeight: '600',
//             textTransform: 'none',
//             marginTop: 4,
//           },
//           tabBarScrollEnabled: true,
//           tabBarItemStyle: { 
//             width: 'auto', 
//             minWidth: 90,
//             paddingHorizontal: 8,
//           },
//           tabBarIconStyle: {
//             marginBottom: 2,
//           },
//         }}
//       >
//         {/* ✅ PESTAÑA EXISTENTE - DASHBOARD */}
//         <Tab.Screen
//           name="Dashboard"
//           component={AdminDashboardScreen}
//           options={{
//             title: 'Panel',
//             tabBarIcon: ({ color, focused }) => (
//               <TabIcon 
//                 name="analytics-outline" 
//                 color={color} 
//                 focused={focused}
//               />
//             ),
//           }}
//         />

//         {/* ✅ PESTAÑA EXISTENTE - USUARIOS */}
//         <Tab.Screen
//           name="Users"
//           component={UserListScreen}
//           options={{
//             title: 'Usuarios',
//             tabBarIcon: ({ color, focused }) => (
//               <TabIcon 
//                 name="people-outline" 
//                 color={color} 
//                 focused={focused}
//               />
//             ),
//           }}
//         />

//         {/* ✅ NUEVA PESTAÑA - PRODUCTOS (CORREGIDA) */}
//         <Tab.Screen
//           name="Products"
//           component={AdminProductsScreen}
//           options={{
//             title: 'Productos',
//             tabBarIcon: ({ color, focused }) => (
//               <TabIcon 
//                 name="cube-outline" 
//                 color={color} 
//                 focused={focused}
//               />
//             ),
//           }}
//         />

//         {/* ✅ NUEVA PESTAÑA - PEDIDOS (CORREGIDA) */}
//         <Tab.Screen
//           name="Orders"
//           component={AdminOrdersScreen}
//           options={{
//             title: 'Pedidos',
//             tabBarIcon: ({ color, focused }) => (
//               <TabIcon 
//                 name="receipt-outline" 
//                 color={color} 
//                 focused={focused}
//               />
//             ),
//           }}
//         />

//         {/* ✅ PESTAÑA EXISTENTE - MENSAJES */}
//         <Tab.Screen
//           name="Messages"
//           component={AdminMessagesScreen}
//           options={{
//             title: 'Mensajes',
//             tabBarIcon: ({ color, focused }) => (
//               <TabIcon 
//                 name="chatbubbles-outline" 
//                 color={color} 
//                 focused={focused}
//               />
//             ),
//           }}
//         />

//         {/* ✅ PESTAÑA EXISTENTE - CONFIGURACIÓN */}
//         <Tab.Screen
//           name="Settings"
//           component={AdminSettingsScreen}
//           options={{
//             title: 'Config',
//             tabBarIcon: ({ color, focused }) => (
//               <TabIcon 
//                 name="settings-outline" 
//                 color={color} 
//                 focused={focused}
//               />
//             ),
//           }}
//         />
//       </Tab.Navigator>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },

//   // Header
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   headerContent: {
//     flex: 1,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#111827',
//     marginBottom: 2,
//   },
//   headerSubtitle: {
//     fontSize: 12,
//     color: '#6B7280',
//     fontWeight: '600',
//     letterSpacing: 1,
//     textTransform: 'uppercase',
//   },
//   headerIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#EFF6FF',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   // Tab icons
//   tabIconContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     backgroundColor: 'transparent',
//   },
//   tabIconFocused: {
//     backgroundColor: '#F3F4F6',
//   },
// });

// export default AdminTabNavigator;





import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { SafeAreaView } from 'react-native-safe-area-context';

// Pantallas
import AdminDashboardScreen from './AdminDashboardScreen';
import UserListScreen from './UserListScreen';
import AdminMessagesScreen from './AdminMessagesScreen';
import AdminSettingsScreen from './AdminSettingsScreen';
import AdminProductsScreen from './AdminProductsScreen';
import AdminOrdersScreen from './AdminOrdersScreen';
import AdminProductManagementScreen from '../ShopAdmin/AdminProductManagementScreen';

const routes = [
  { key: 'dashboard', title: 'Panel', icon: 'analytics-outline' },
  { key: 'users', title: 'Usuarios', icon: 'people-outline' },
  { key: 'products', title: 'Productos', icon: 'cube-outline' },
  { key: 'gestionar', title: 'Gestionar', icon: 'cube-outline' },
  { key: 'orders', title: 'Pedidos', icon: 'receipt-outline' },
  { key: 'messages', title: 'Mensajes', icon: 'chatbubbles-outline' },
  { key: 'settings', title: 'Config', icon: 'settings-outline' },
];

const renderScene = SceneMap({
  dashboard: AdminDashboardScreen,
  users: UserListScreen,
  products: AdminProductsScreen,
  gestionar:AdminProductManagementScreen,
  orders: AdminOrdersScreen,
  messages: AdminMessagesScreen,
  settings: AdminSettingsScreen,
});

const AdminTabNavigator = () => {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const renderTabBar = props => (
    <TabBar
      {...props}
      scrollEnabled
      indicatorStyle={{ backgroundColor: '#111827', height: 3, borderRadius: 2 }}
      style={styles.tabBar}
      renderIcon={({ route, focused, color }) => (
        <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
          <Ionicons name={route.icon} size={18} color={color} />
        </View>
      )}
      renderLabel={({ route, focused, color }) => (
        <Text style={[styles.tabLabel, { color }]}>{route.title}</Text>
      )}
      activeColor="#111827"
      inactiveColor="#6B7280"
      tabStyle={{ width: 'auto', minWidth: 90, paddingHorizontal: 8 }}
      iconStyle={{ marginBottom: 2 }}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Panel de Administración</Text>
          <Text style={styles.headerSubtitle}>TASHIRO JIU-JITSU</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
        </View>
      </View>

      {/* TabView */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  headerContent: { flex: 1 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    backgroundColor: '#fff',
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'none',
    marginTop: 4,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  tabIconFocused: {
    backgroundColor: '#F3F4F6',
  },
});

export default AdminTabNavigator;
