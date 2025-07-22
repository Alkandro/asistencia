import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Importar pantallas
import UserListScreen from './UserListScreen';
import AdminMessagesScreen from './AdminMessagesScreen';
import AdminDashboardScreen from './AdminDashboardScreen';
import AdminSettingsScreen from './AdminSettingsScreen';

const Tab = createBottomTabNavigator();

const AdminTabNavigator = () => {
  const { t } = useTranslation();

  const getTabBarIcon = (routeName, focused, color, size) => {
    let iconName;

    switch (routeName) {
      case 'Dashboard':
        iconName = focused ? 'analytics' : 'analytics-outline';
        break;
      case 'Users':
        iconName = focused ? 'people' : 'people-outline';
        break;
      case 'Messages':
        iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
        break;
      case 'Settings':
        iconName = focused ? 'settings' : 'settings-outline';
        break;
      default:
        iconName = 'help-outline';
    }

    return <Ionicons name={iconName} size={size} color={color} />;
  };

  const CustomTabBarLabel = ({ focused, children }) => (
    <Text style={[
      styles.tabLabel,
      { color: focused ? '#111827' : '#6B7280' }
    ]}>
      {children}
    </Text>
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) =>
          getTabBarIcon(route.name, focused, color, size),
         
        tabBarLabel: ({ focused, children }) => (
          <CustomTabBarLabel focused={focused}>
            {children}
          </CustomTabBarLabel>
        ),
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        headerShown: false,
        tabBarHideOnKeyboard: true,
        
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarLabel: 'Panel',
        }}
      />
      <Tab.Screen
        name="Users"
        component={UserListScreen}
        options={{
          tabBarLabel: 'Usuarios',
        }}
      />
      <Tab.Screen
        name="Messages"
        component={AdminMessagesScreen}
        options={{
          tabBarLabel: 'Mensajes',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={AdminSettingsScreen}
        options={{
          tabBarLabel: 'Ajustes',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 4,
    paddingBottom: 18,
    height: 80,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default AdminTabNavigator;
