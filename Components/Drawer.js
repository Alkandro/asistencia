import React, {
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer";
import {
  View,
  SafeAreaView,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import CheckInScreen from "./CheckInScreen";
import AttendanceHistoryScreen from "../Attendace/AttendanceHistoryScreen";
import UserProfileScreen from "../LoginScreens/UserProfileScreen";
import Information from "../LoginScreens/Information";
import BeltProgressScreen from "../Styles/BeltProgressScreen";

// ✅ IMPORTS PARA TIENDA
import ShopScreen from "../ShopUsers/ShopScreen";
import ProductDetailScreen from "../ShopUsers/ProductDetailScreen";
import CartScreen from "../ShopUsers/CartScreen";
import CheckoutScreen from "../ShopUsers/CheckoutScreen";
import OrderConfirmationScreen from "../ShopUsers/OrderConfirmationScreen";
// 🆕 IMPORT PARA HISTORIAL DE PEDIDOS
import OrderHistoryScreen from "../ShopUsers/OrderHistoryScreen";

// 🆕 NUEVOS IMPORTS PARA GESTIÓN DE PAGOS Y DIRECCIONES
import AddressManagementScreen from "../ComponentsShop/AddressManagementScreen";
import PaymentManagementScreen from "../ComponentsShop/PaymentManagementScreen";

import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import "dayjs/locale/pt";
import "dayjs/locale/ja";
import "dayjs/locale/en";
import "dayjs/locale/es";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useDrawerStatus } from '@react-navigation/drawer';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

dayjs.extend(localeData);

// Mapeo de imágenes de cinturones
const beltImages = {
  white: require("../assets/fotos/whitebelt.png"),
  blue: require("../assets/fotos/bluebelt.png"),
  purple: require("../assets/fotos/purplebelt.png"),
  brown: require("../assets/fotos/brownbelt.png"),
  black: require("../assets/fotos/blackbelt.png"),
};

const getBeltImage = (belt) =>
  beltImages[belt?.toLowerCase()] || beltImages["white"];

const CustomDrawerContent = ({ monthlyCheckInCount, onRefresh, ...props }) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language || "es";
  const { navigation } = props;
  const [refreshing, setRefreshing] = useState(false);
  const [userImageUri, setUserImageUri] = useState(null);
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [userBelt, setUserBelt] = useState("white");
  const [allTimeCheckIns, setAllTimeCheckIns] = useState(0);
  const [monthlyCheckIns, setMonthlyCheckIns] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // ✅ ESTADOS PARA CARRITO Y NUEVAS FUNCIONALIDADES
  const [cartItemCount, setCartItemCount] = useState(0);
  // 🆕 NUEVOS ESTADOS PARA CONTADORES
  const [addressCount, setAddressCount] = useState(0);
  const [paymentCount, setPaymentCount] = useState(0);
  // 🆕 ESTADO PARA PEDIDOS
  const [orderCount, setOrderCount] = useState(0);

  const drawerStatus = useDrawerStatus();

  // ✅ FUNCIÓN PARA CARGAR CONTADOR DEL CARRITO
  const loadCartCount = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const cartRef = collection(db, 'cart');
      const q = query(cartRef, where('userId', '==', userId));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let totalItems = 0;
        snapshot.forEach((doc) => {
          const item = doc.data();
          totalItems += parseInt(item.quantity) || 0;
        });
        setCartItemCount(totalItems);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading cart count:', error);
      setCartItemCount(0);
    }
  };

  // 🆕 FUNCIÓN PARA CARGAR CONTADOR DE PEDIDOS
  const loadOrderCount = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('userId', '==', userId));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setOrderCount(snapshot.size);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading order count:', error);
      setOrderCount(0);
    }
  };

  // 🆕 FUNCIÓN PARA CARGAR CONTADORES DE DIRECCIONES Y MÉTODOS DE PAGO
  const loadPaymentAddressCounts = async () => {
    try {
      // Contar direcciones guardadas
      const savedAddresses = await AsyncStorage.getItem('savedAddresses');
      if (savedAddresses) {
        const addresses = JSON.parse(savedAddresses);
        setAddressCount(Array.isArray(addresses) ? addresses.length : 0);
      } else {
        setAddressCount(0);
      }

      // Contar métodos de pago guardados
      const savedCards = await AsyncStorage.getItem('savedCards');
      if (savedCards) {
        const cards = JSON.parse(savedCards);
        setPaymentCount(Array.isArray(cards) ? cards.length : 0);
      } else {
        setPaymentCount(0);
      }
    } catch (error) {
      console.error('Error loading payment/address counts:', error);
      setAddressCount(0);
      setPaymentCount(0);
    }
  };

  // Función para cargar la información del usuario
  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Cargar imagen desde AsyncStorage
      const imageUri = await AsyncStorage.getItem("userImageUri");
      setUserImageUri(imageUri);

      // Obtener datos del usuario desde Firebase
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username || "Usuario");
          setFirstName(data.nombre || data.username || "Usuario");
          setUserBelt(data.cinturon || "white");
          setAllTimeCheckIns(data.allTimeCheckIns || 0);
        }
      }

      // Calcular entrenamientos del mes actual
      const currentMonthKey = dayjs().format("YYYY-MM");
      const monthCount = monthlyCheckInCount[currentMonthKey] || 0;
      setMonthlyCheckIns(monthCount);

      // ✅ CARGAR TODOS LOS CONTADORES
      await loadCartCount();
      await loadOrderCount();
      // 🆕 CARGAR CONTADORES DE DIRECCIONES Y PAGOS
      await loadPaymentAddressCounts();
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar datos al hacer refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    await loadUserData();
    setRefreshing(false);
  }, [onRefresh]);

  useFocusEffect(
    useCallback(() => {
      handleRefresh();
    }, [handleRefresh])
  );

  // Llamar handleRefresh cada vez que el drawer se abra
  useEffect(() => {
    if (drawerStatus === 'open') {
      handleRefresh();
    }
  }, [drawerStatus, handleRefresh]);

  // Función para cerrar sesión
  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Cambiar idioma de dayjs según el idioma seleccionado
  useEffect(() => {
    dayjs.locale(currentLanguage);
  }, [currentLanguage]);

  // Calcular progreso del cinturón
  const calculateDanInfo = (beltColor, totalCheckIns) => {
    const color = beltColor?.toLowerCase() || "white";
    const total = totalCheckIns || 0;
    const groupSize = color === "white" ? 40 : 60;
    const maxDan = 4;

    const rawGroup = Math.floor(total / groupSize);
    let currentDan = rawGroup + 1;
    if (currentDan > maxDan) currentDan = maxDan;

    let countInGroup = total % groupSize;
    if (countInGroup === 0 && total > 0) {
      countInGroup = groupSize;
    }

    return { rawGroup, currentDan, groupSize, countInGroup };
  };

  function getDanLabel(danNumber) {
    switch (danNumber) {
      case 1:
        return t("Primer Dan");
      case 2:
        return t("Segundo Dan");
      case 3:
        return t("Tercer Dan");
      case 4:
        return t("Cuarto Dan");
      default:
        return "";
    }
  }

  const { currentDan, groupSize, countInGroup } = calculateDanInfo(userBelt, allTimeCheckIns);
  const currentDanLabel = getDanLabel(currentDan);
  const beltProgressText = `${countInGroup}/${groupSize} - ${currentDanLabel}`;

  // Función para obtener el color del cinturón
  const getBeltColor = (belt) => {
    const beltColorMap = {
      white: "#000000",
      blue: "#4285F4",
      purple: "#AA60C8",
      brown: "#8B4513",
      black: "#000000",
    };
    return beltColorMap[belt] || "#333333";
  };

  // ✅ OPCIONES DEL MENÚ ACTUALIZADAS CON NUEVAS FUNCIONALIDADES
  const menuItems = [
    {
      id: 'home',
      title: t("Inicio"),
      icon: "home-outline",
      onPress: () => navigation.navigate("UserTabs"),
    },
    {
      id: 'profile',
      title: t("Mi Perfil"),
      icon: "person-outline",
      onPress: () => navigation.navigate("UserTabs", { screen: "Profile" }),
    },
    {
      id: 'history',
      title: t("Historia"),
      icon: "time-outline",
      onPress: () => navigation.navigate("UserTabs", { screen: "Historial" }),
    },
    {
      id: 'progress',
      title: t("Progreso del Cinturón"),
      icon: "trophy-outline",
      onPress: () => navigation.navigate("BeltProgress"),
    },
    // ✅ SECCIÓN DE TIENDA
    {
      id: 'shop',
      title: t("Tienda"),
      icon: "storefront-outline",
      onPress: () => navigation.navigate("UserTabs", { screen: "Shop" }),
    },
    {
      id: 'cart',
      title: t("Mi Carrito"),
      icon: "bag-outline",
      badge: cartItemCount > 0 ? cartItemCount : null,
      onPress: () => navigation.navigate("UserTabs", { screen: "Cart" }),
    },
    {
      id: 'orders',
      title: t("Mis Pedidos"),
      icon: "receipt-outline",
      badge: orderCount > 0 ? orderCount : null,
      badgeColor: "#10B981",
      onPress: () => navigation.navigate("UserTabs", { screen: "Orders" }),
    },
    // 🆕 NUEVA SECCIÓN - GESTIÓN DE COMPRAS
    {
      id: 'section_divider_1',
      type: 'divider',
      title: t("Gestión de Compras"),
    },
    {
      id: 'addresses',
      title: t("Direcciones de Envío"),
      icon: "location-outline",
      badge: addressCount > 0 ? addressCount : null,
      badgeColor: "#3B82F6",
      onPress: () => navigation.navigate("AddressManagement"),
    },
    {
      id: 'payments',
      title: t("Métodos de Pago"),
      icon: "card-outline",
      badge: paymentCount > 0 ? paymentCount : null,
      badgeColor: "#10B981",
      onPress: () => navigation.navigate("PaymentManagement"),
    },
    // ✅ SECCIÓN ORIGINAL
    {
      id: 'section_divider_2',
      type: 'divider',
      title: t("Configuración"),
    },
    {
      id: 'messages',
      title: t("Mensajes"),
      icon: "chatbubble-outline",
      onPress: () => navigation.navigate("UserTabs", { screen: "Registrarse" }),
    },
    {
      id: 'settings',
      title: t("Configuración"),
      icon: "settings-outline",
      onPress: () => navigation.navigate("Information"),
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>{t("Cargando...")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor="#000000"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Perfil del usuario */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {userImageUri ? (
              <Image 
                source={{ uri: userImageUri }} 
                style={styles.avatar}
                defaultSource={require("../assets/fotos/tashiro1.png")}
              />
            ) : (
              <Image
                source={require("../assets/fotos/tashiro1.png")}
                style={styles.avatar}
              />
            )}
          </View>
          <Text style={styles.userName}>{firstName}</Text>
          <Text style={styles.userHandle}>@{username}</Text>
          
          {/* Progreso del cinturón debajo de la foto - CON IMAGEN DEL CINTURÓN */}
          <View style={styles.beltProgressSection}>
            <View style={styles.beltProgressHeader}>
              <Image
                source={getBeltImage(userBelt)}
                style={styles.beltImage}
              />
              <View style={styles.beltProgressInfo}>
                <Text style={styles.progressText}>{beltProgressText}</Text>
                <Text style={[styles.beltText, { color: getBeltColor(userBelt) }]}>
                  {userBelt.charAt(0).toUpperCase() + userBelt.slice(1)}
                </Text>
              </View>
            </View>
            <Text style={styles.monthlyText}>
              {t("Entrenamientos este mes: {{count}}", { count: monthlyCheckIns })}
            </Text>
          </View>
        </View>

        {/* ✅ SECCIÓN DE TIENDA (EXISTENTE) */}
        {cartItemCount > 0 && (
          <View style={styles.shopSection}>
            <View style={styles.shopHeader}>
              <Ionicons name="bag-outline" size={20} color="#3B82F6" />
              <Text style={styles.shopTitle}>{t("Tienda TASHIRO")}</Text>
            </View>
            <Text style={styles.shopSubtitle}>
              {t("{{count}} producto{{plural}} en tu carrito", { 
                count: cartItemCount, 
                plural: cartItemCount !== 1 ? 's' : '' 
              })}
            </Text>
            <TouchableOpacity
              style={styles.quickCartButton}
              onPress={() => navigation.navigate("UserTabs", { screen: "Cart" })}
              activeOpacity={0.7}
            >
              <Text style={styles.quickCartText}>{t("Ver Carrito")}</Text>
              <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        )}

        {/* 🆕 NUEVA SECCIÓN - INFORMACIÓN DE GESTIÓN DE COMPRAS */}
        {(addressCount > 0 || paymentCount > 0) && (
          <View style={styles.managementSection}>
            <View style={styles.managementHeader}>
              <Ionicons name="shield-checkmark" size={18} color="#10B981" />
              <Text style={styles.managementTitle}>{t("Datos Guardados")}</Text>
            </View>
            <View style={styles.managementStats}>
              {addressCount > 0 && (
                <View style={styles.statItem}>
                  <Ionicons name="location" size={14} color="#3B82F6" />
                  <Text style={styles.statText}>
                    {t("{{count}} dirección{{plural}}", { 
                      count: addressCount, 
                      plural: addressCount !== 1 ? 'es' : '' 
                    })}
                  </Text>
                </View>
              )}
              {paymentCount > 0 && (
                <View style={styles.statItem}>
                  <Ionicons name="card" size={14} color="#10B981" />
                  <Text style={styles.statText}>
                    {t("{{count}} método{{plural}} de pago", { 
                      count: paymentCount, 
                      plural: paymentCount !== 1 ? 's' : '' 
                    })}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.managementSubtitle}>
              {t("Guardados de forma segura en tu dispositivo")}
            </Text>
          </View>
        )}

        {/* Navegación principal */}
        <View style={styles.navigationSection}>
          {menuItems.map((item) => {
            // 🆕 RENDERIZAR DIVISORES DE SECCIÓN
            if (item.type === 'divider') {
              return (
                <View key={item.id} style={styles.sectionDivider}>
                  <Text style={styles.sectionDividerText}>{item.title}</Text>
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon} size={20} color="#333333" style={styles.menuIcon} />
                  <Text style={styles.menuText}>{item.title}</Text>
                </View>
                {/* ✅ BADGE MEJORADO CON COLORES PERSONALIZADOS */}
                {item.badge && (
                  <View style={[
                    styles.badge, 
                    { backgroundColor: item.badgeColor || "#3B82F6" }
                  ]}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Información de la app */}
        <View style={styles.appInfoSection}>
          <Text style={styles.versionText}>v1.2.0</Text>
        </View>
      </ScrollView>

      {/* Botón de cerrar sesión - solo texto e icono sin fondo */}
      <View style={styles.logoutSection}>
        <TouchableOpacity
          onPress={handleSignOut}
          style={styles.logoutButton}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#DC3545" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>{t("Cerrar Sesión")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// 🆕 TAB NAVIGATOR ACTUALIZADO CON MI CARRITO Y PEDIDOS
const UserBottomTabs = ({ navigation, route }) => {
  const { t } = useTranslation();
  const [cartItemCount, setCartItemCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  // ✅ CARGAR CONTADORES EN TIEMPO REAL
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        // Contador del carrito
        const cartRef = collection(db, 'cart');
        const cartQuery = query(cartRef, where('userId', '==', userId));
        
        const cartUnsubscribe = onSnapshot(cartQuery, (snapshot) => {
          let totalItems = 0;
          snapshot.forEach((doc) => {
            const item = doc.data();
            totalItems += parseInt(item.quantity) || 0;
          });
          setCartItemCount(totalItems);
        });

        // Contador de pedidos
        const ordersRef = collection(db, 'orders');
        const ordersQuery = query(ordersRef, where('userId', '==', userId));
        
        const ordersUnsubscribe = onSnapshot(ordersQuery, (snapshot) => {
          setOrderCount(snapshot.size);
        });

        return () => {
          cartUnsubscribe();
          ordersUnsubscribe();
        };
      } catch (error) {
        console.error('Error loading counts:', error);
      }
    };

    loadCounts();
  }, []);

  // Cambiar dinámicamente el título de la pantalla activa
  useLayoutEffect(() => {
    let title = "";

    if (route.name === "CheckIn") {
      title = "Check In";
    } else if (route.name === "AttendanceHistory") {
      title = "Historial de Asistencia";
    } else if (route.name === "UserProfile") {
      title = "Perfil";
    } else if (route.name === "Shop") {
      title = "Shop";
    } else if (route.name === "Cart") {
      title = "Mi Carrito";
    } else if (route.name === "Orders") {
      title = "Mis Pedidos";
    }

    navigation.setOptions({
      title: title,
    });
  }, [navigation, route]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Registrarse") iconName = "checkmark-circle-outline";
          else if (route.name === "Historial") iconName = "time-outline";
          else if (route.name === "Shop") iconName = "storefront-outline";
          else if (route.name === "Cart") iconName = "bag-outline";
          else if (route.name === "Orders") iconName = "receipt-outline";
          else if (route.name === "Profile") iconName = "person-outline";
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#666666",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E0E0E0",
          height: Platform.OS === 'ios' ? 85 : 60,
          paddingBottom: Platform.OS === 'ios' ? 25 : 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        // 🆕 BADGES EN LAS PESTAÑAS
        tabBarBadge: route.name === "Cart" && cartItemCount > 0 ? cartItemCount : 
                    route.name === "Orders" && orderCount > 0 ? orderCount : undefined,
        tabBarBadgeStyle: {
          backgroundColor: route.name === "Cart" ? "#3B82F6" : "#10B981",
          color: "#FFFFFF",
          fontSize: 10,
          fontWeight: "600",
        },
      })}
    >
      <Tab.Screen
        name="Registrarse"
        component={CheckInScreen}
        options={{
          title: t("Inicio"),
          headerShown: false,
        }}
      />
      
      
      
      <Tab.Screen
        name="Shop"
        component={ShopScreen}
        options={{
          title: t("Tienda"),
          headerShown: false,
        }}
      />
      
      {/* 🆕 NUEVA PESTAÑA - MI CARRITO */}
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: t("Carrito"),
          headerShown: false,
        }}
      />
      
      {/* 🆕 NUEVA PESTAÑA - MIS PEDIDOS */}
      <Tab.Screen
        name="Orders"
        component={OrderHistoryScreen}
        options={{
          title: t("Pedidos"),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Historial"
        component={AttendanceHistoryScreen}
        options={{
          title: t("Historial"),
          headerShown: false,
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={UserProfileScreen}
        options={{
          title: t("Perfil"),
          headerShown: false,
        }}
      />
      
    </Tab.Navigator>
  );
};

const AppDrawer = ({ monthlyCheckInCount, fetchMonthlyCheckInCount }) => (
  <Drawer.Navigator
    initialRouteName="UserTabs"
    drawerContent={(props) => (
      <CustomDrawerContent
        {...props}
        monthlyCheckInCount={monthlyCheckInCount}
        onRefresh={fetchMonthlyCheckInCount}
      />
    )}
    screenOptions={{
      drawerStyle: styles.drawerStyle,
      headerStyle: styles.headerStyle,
      headerTintColor: "#000000",
      headerTitleStyle: {
        fontWeight: '600',
        color: "#000000",
        
      },
    }}
  >
    <Drawer.Screen
      name="UserTabs"
      component={UserBottomTabs}
      options={{ 
        title: "TASHIRO JIU-JITSU", 
        headerTitleAlign: "center",
      }}
    />
    <Drawer.Screen
      name="Information"
      component={Information}
      options={{ title: "Información" }}
    />
    <Drawer.Screen
      name="BeltProgress"
      component={BeltProgressScreen}
      options={{ title: "Progreso del Cinturón" }}
    />
    {/* ✅ PANTALLAS DE TIENDA EXISTENTES */}
    <Drawer.Screen
      name="Shop"
      component={ShopScreen}
      options={{ title: "Tienda TASHIRO" }}
    />
    <Drawer.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={{ title: "Detalle del Producto" }}
    />
    <Drawer.Screen
      name="Cart"
      component={CartScreen}
      options={{ title: "Mi Carrito" }}
    />
    <Drawer.Screen
      name="Checkout"
      component={CheckoutScreen}
      options={{ title: "Finalizar Compra" }}
    />
    <Drawer.Screen
      name="OrderConfirmation"
      component={OrderConfirmationScreen}
      options={{ title: "Pedido Confirmado" }}
    />
    {/* 🆕 NUEVA PANTALLA - HISTORIAL DE PEDIDOS */}
    <Drawer.Screen
      name="OrderHistory"
      component={OrderHistoryScreen}
      options={{ title: "Historial de Pedidos" }}
    />
    {/* 🆕 NUEVAS PANTALLAS - GESTIÓN DE DIRECCIONES Y PAGOS */}
    <Drawer.Screen
      name="AddressManagement"
      component={AddressManagementScreen}
      options={{ title: "Direcciones de Envío" }}
    />
    <Drawer.Screen
      name="PaymentManagement"
      component={PaymentManagementScreen}
      options={{ title: "Métodos de Pago" }}
    />
  </Drawer.Navigator>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#E0E0E0",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 5,
  },
  userHandle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 15,
  },
  beltProgressSection: {
    alignItems: "center",
    width: "100%",
  },
  beltProgressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  beltImage: {
    width: 40,
    height: 25,
    resizeMode: "contain",
  },
  beltProgressInfo: {
    alignItems: "center",
  },
  progressText: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 2,
  },
  beltText: {
    fontSize: 14,
    fontWeight: "600",
  },
  monthlyText: {
    fontSize: 12,
    color: "#888888",
    textAlign: "center",
  },
  shopSection: {
    backgroundColor: "#F8FAFC",
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  shopHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  shopTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  shopSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 12,
  },
  quickCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  quickCartText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3B82F6",
  },
  managementSection: {
    backgroundColor: "#F0FDF4",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  managementHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  managementTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#065F46",
  },
  managementStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: "#047857",
    fontWeight: "500",
  },
  managementSubtitle: {
    fontSize: 10,
    color: "#059669",
    fontStyle: "italic",
  },
  navigationSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionDivider: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 8,
  },
  sectionDividerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    marginRight: 16,
    width: 20,
  },
  menuText: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "500",
  },
  badge: {
    backgroundColor: "#3B82F6",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  appInfoSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: "#AAAAAA",
  },
  logoutSection: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutIcon: {
    marginRight: 4,
  },
  logoutText: {
    fontSize: 16,
    color: "#DC3545",
    fontWeight: "500",
  },
  drawerStyle: {
    backgroundColor: "#FFFFFF",
    width: 300,
  },
  headerStyle: {
    backgroundColor: "#FFFFFF",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
});

export default AppDrawer;
