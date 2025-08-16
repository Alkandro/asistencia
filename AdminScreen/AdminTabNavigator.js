// AdminTabNavigator.js - AdminTabNavigator con sistema de navegación integrado
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity,Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../firebase';
import { useTranslation } from 'react-i18next'; // Importación añadida

// Pantallas
import AdminDashboardScreen from './AdminDashboardScreen';
import UserListScreen from './UserListScreen';
import AdminMessagesScreen from './AdminMessagesScreen';
import AdminSettingsScreen from './AdminSettingsScreen';
import AdminProductsScreen from './AdminProductsScreen';
import AdminOrdersScreen from './AdminOrdersScreen';
import AdminProductManagementScreen from '../ShopAdmin/AdminProductManagementScreen';
import AdminCategoryBackgroundsScreen from './AdminCategoryBackgroundsScreen';

// ✅ RUTAS CON ICONOS CORREGIDOS Y VERIFICADOS
const routes = [
  { 
    key: 'dashboard', 
    title: 'Panel', 
    icon: 'analytics-outline', 
    iconFocused: 'analytics' 
  },
  { 
    key: 'users', 
    title: 'Usuarios', 
    icon: 'people-outline', 
    iconFocused: 'people' 
  },
  { 
    key: 'products', 
    title: 'Productos', 
    icon: 'cube-outline', 
    iconFocused: 'cube' 
  },
  { 
    key: 'gestionar', 
    title: 'Gestionar', 
    icon: 'add-circle-outline', 
    iconFocused: 'add-circle' 
  },
  { 
    key: 'orders', 
    title: 'Pedidos', 
    icon: 'receipt-outline', 
    iconFocused: 'receipt' 
  },
  { 
    key: 'messages', 
    title: 'Mensajes', 
    icon: 'chatbubbles-outline', 
    iconFocused: 'chatbubbles' 
  },
  { 
    key: 'settings', 
    title: 'Config', 
    icon: 'settings-outline', 
    iconFocused: 'settings' 
  },
  { 
    key: 'backgrounds', 
    title: 'Fondos', 
    icon: 'image-outline', 
    iconFocused: 'image' 
  },
];

// ✅ MAPEO DE ESCENAS CORREGIDO
const renderScene = SceneMap({
  dashboard: AdminDashboardScreen,
  users: UserListScreen,
  products: AdminProductsScreen,
  gestionar: AdminProductManagementScreen,
  orders: AdminOrdersScreen,
  messages: AdminMessagesScreen,
  backgrounds: AdminCategoryBackgroundsScreen,
  settings: AdminSettingsScreen,
});

const AdminTabNavigator = () => {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const tabViewRef = useRef(null);
  
  const { t } = useTranslation();

  // ✅ CONFIGURAR NAVEGACIÓN GLOBAL PARA DASHBOARD
  useEffect(() => {
    // Crear referencia global para navegación
    global.tabNavigationRef = {
      setIndex: (newIndex) => {
        console.log('🧭 Navegando a índice:', newIndex);
        setIndex(newIndex);
      },
      getCurrentIndex: () => index,
      getRoutes: () => routes,
    };

    // Crear emisor de eventos para navegación
    global.tabNavigationEmitter = {
      emit: (event, data) => {
        if (event === 'navigateToTab') {
          const tabIndex = getTabIndex(data);
          console.log('🧭 Navegando a pestaña:', data, 'índice:', tabIndex);
          setIndex(tabIndex);
        }
      }
    };

    // Cleanup
    return () => {
      global.tabNavigationRef = null;
      global.tabNavigationEmitter = null;
    };
  }, [index]);

  // ✅ FUNCIÓN AUXILIAR PARA OBTENER ÍNDICE DE PESTAÑA
  const getTabIndex = (tabKey) => {
    const tabIndex = routes.findIndex(route => route.key === tabKey);
    return tabIndex >= 0 ? tabIndex : 0;
  };

  // ✅ FUNCIÓN PARA RENDERIZAR ICONOS CON VERIFICACIÓN
  const renderTabIcon = ({ route, focused, color }) => {
    // Verificar que el icono existe, usar fallback si no
    const iconName = focused 
      ? (route.iconFocused || route.icon || 'help-circle') 
      : (route.icon || 'help-circle-outline');
    
    const iconSize = focused ? 20 : 18;
    


   
    return (
      <View style={[
        styles.tabIconContainer, 
        focused && styles.tabIconFocused
      ]}>
        <Ionicons 
          name={iconName} 
          size={iconSize} 
          color={color}
          style={styles.iconStyle}
        />
      </View>
    );
  };

  // ✅ FUNCIÓN PARA RENDERIZAR LABELS
  const renderTabLabel = ({ route, focused, color }) => (
    <Text style={[
      styles.tabLabel, 
      { color },
      focused && styles.tabLabelFocused
    ]}>
      {route.title}
    </Text>
  );

  // ✅ TABBAR MEJORADO CON ICONOS CORREGIDOS
  const renderTabBar = props => (
    <TabBar
      {...props}
      scrollEnabled={true}
      indicatorStyle={styles.indicator}
      style={styles.tabBar}
      renderIcon={renderTabIcon}
      renderLabel={renderTabLabel}
      activeColor="#3B82F6"
      inactiveColor="#6B7280"
      tabStyle={styles.tabStyle}
      pressColor="rgba(59, 130, 246, 0.1)"
      pressOpacity={0.8}
      bounces={false}
    />
  );

  // ✅ FUNCIÓN PARA MANEJAR CAMBIO DE PESTAÑA
  const handleIndexChange = (newIndex) => {
    console.log('📱 Cambiando a pestaña:', routes[newIndex]?.title, 'índice:', newIndex);
    setIndex(newIndex);
  };

  const handleSignOut = async () => {
    Alert.alert(
      t("Cerrar Sesión"),
      t("¿Estás seguro de que quieres cerrar sesión?"),
      [
        { text: t("Cancelar"), style: "cancel" },
        {
          text: t("Cerrar Sesión"),
          style: "destructive",
          onPress: async () => {
            try {
              await auth.signOut();
            } catch (error) {
              console.error("Error al cerrar sesión:", error);
              Alert.alert("Error", "No se pudo cerrar la sesión");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ HEADER MEJORADO SIN useTranslation */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Panel de Administración</Text>
          <Text style={styles.headerSubtitle}>TASHIRO JIU-JITSU</Text>
        </View>
        
        <View style={styles.headerActions}>
          {/* Badge de notificaciones */}
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={22} color="#6B7280" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
          
          {/* Icono de admin */}
          <View style={styles.headerIcon}>
            <TouchableOpacity onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ✅ TABVIEW OPTIMIZADO CON NAVEGACIÓN */}
      <TabView
        ref={tabViewRef}
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={handleIndexChange}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
        lazy={true}
        lazyPreloadDistance={1}
        swipeEnabled={false}
        animationEnabled={true}
        removeClippedSubviews={true}
        optimizationsEnabled={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // ✅ HEADER MEJORADO
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
   
    alignItems: 'center',
    justifyContent: 'center',

    
  },

  // ✅ TABBAR MEJORADO
  tabBar: {
    backgroundColor: '#fff',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 4,
    paddingBottom: 2,
  },
  indicator: {
    backgroundColor: '#3B82F6',
    height: 4,
    borderRadius: 2,
    marginBottom: -1,
  },
  tabStyle: {
    width: 'auto',
    minWidth: 85,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  // ✅ ICONOS Y LABELS MEJORADOS
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    marginBottom: 2,
  },
  tabIconFocused: {
    backgroundColor: '#EFF6FF',
    transform: [{ scale: 1.05 }],
  },
  iconStyle: {
    textAlign: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'none',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  tabLabelFocused: {
    fontWeight: '700',
    fontSize: 12,
  },
});

export default AdminTabNavigator;
