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




import React, { useCallback } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

// ✅ IMPORTS EXISTENTES
import AdminDashboardScreen from './AdminDashboardScreen';
import UserListScreen from './UserListScreen';
import AdminMessagesScreen from './AdminMessagesScreen';
import AdminSettingsScreen from './AdminSettingsScreen';

// ✅ NUEVOS IMPORTS PARA GESTIÓN DE TIENDA
import AdminProductsScreen from '../ShopAdmin/AdminProductsScreen';
import AdminOrdersScreen from '../ShopAdmin/AdminOrdersScreen';

const Tab = createMaterialTopTabNavigator();

const TabIcon = ({ name, color, size = 18, focused }) => (
  <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
    <Ionicons name={name} size={size} color={color} />
  </View>
);

const AdminTabNavigator = () => {
  // ✅ Usar traducción de forma segura
  const { t } = useTranslation();
  
  // ✅ Función t segura para evitar errores
  const safeT = useCallback((key, fallback = key) => {
    try {
      return t(key) || fallback;
    } catch (error) {
      console.warn(`Translation error for key "${key}":`, error);
      return fallback;
    }
  }, [t]);

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {safeT('admin.panel.title', 'Panel de Administración')}
          </Text>
          <Text style={styles.headerSubtitle}>
            {safeT('admin.panel.subtitle', 'TASHIRO JIU-JITSU')}
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
        </View>
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#111827',
          tabBarInactiveTintColor: '#6B7280',
          tabBarIndicatorStyle: { 
            backgroundColor: '#111827', 
            height: 3,
            borderRadius: 2,
          },
          tabBarStyle: { 
            backgroundColor: '#fff',
            elevation: 4,
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          },
          tabBarLabelStyle: { 
            fontSize: 11, 
            fontWeight: '600',
            textTransform: 'none',
            marginTop: 4,
          },
          tabBarScrollEnabled: true,
          tabBarItemStyle: { 
            width: 'auto', 
            minWidth: 90,
            paddingHorizontal: 8,
          },
          tabBarIconStyle: {
            marginBottom: 2,
          },
        }}
      >
       
        <Tab.Screen
          name="Dashboard"
          component={AdminDashboardScreen}
          options={{
            title: safeT('admin.tabs.dashboard', 'Panel'),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon 
                name="analytics-outline" 
                color={color} 
                focused={focused}
              />
            ),
          }}
        />

       
        <Tab.Screen
          name="Users"
          component={UserListScreen}
          options={{
            title: safeT('admin.tabs.users', 'Usuarios'),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon 
                name="people-outline" 
                color={color} 
                focused={focused}
              />
            ),
          }}
        />

        
        <Tab.Screen
          name="Products"
          component={AdminProductsScreen}
          options={{
            title: safeT('admin.tabs.products', 'Productos'),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon 
                name="cube-outline" 
                color={color} 
                focused={focused}
              />
            ),
          }}
        />

       
        <Tab.Screen
          name="Orders"
          component={AdminOrdersScreen}
          options={{
            title: safeT('admin.tabs.orders', 'Pedidos'),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon 
                name="receipt-outline" 
                color={color} 
                focused={focused}
              />
            ),
          }}
        />

        
        <Tab.Screen
          name="Messages"
          component={AdminMessagesScreen}
          options={{
            title: safeT('admin.tabs.messages', 'Mensajes'),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon 
                name="chatbubbles-outline" 
                color={color} 
                focused={focused}
              />
            ),
          }}
        />

        
        <Tab.Screen
          name="Settings"
          component={AdminSettingsScreen}
          options={{
            title: safeT('admin.tabs.settings', 'Config'),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon 
                name="settings-outline" 
                color={color} 
                focused={focused}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    flex: 1,
  },
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

  // Tab icons
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