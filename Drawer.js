// import React, {
//   useState,
//   useCallback,
//   useEffect,
//   useLayoutEffect,
// } from "react";
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import { createDrawerNavigator } from "@react-navigation/drawer";
// import {
//   View,
//   SafeAreaView,
//   Text,
//   StyleSheet,
//   ScrollView,
//   RefreshControl,
//   TouchableOpacity,
//   Image,
//   Platform,
// } from "react-native";
// import Icon from "react-native-vector-icons/Ionicons";
// import CheckInScreen from "./CheckInScreen";
// import AttendanceHistoryScreen from "./AttendanceHistoryScreen";
// import UserProfileScreen from "./UserProfileScreen";
// import Information from "./Information";
// import { useFocusEffect } from "@react-navigation/native";
// import dayjs from "dayjs";
// import localeData from "dayjs/plugin/localeData";
// import "dayjs/locale/pt";
// import "dayjs/locale/ja";
// import "dayjs/locale/en";
// import "dayjs/locale/es";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import ButtonGradient from "./ButtonGradient";
// import { doc, getDoc } from "firebase/firestore";
// import { auth, db } from "./firebase"; // Asegúrate de tener configurado Firebase
// import { useDrawerStatus } from '@react-navigation/drawer';
// import { useTranslation } from 'react-i18next'; 
// // import FloatingFlags from "./FloatingFlags"; 


// const Tab = createBottomTabNavigator();
// const Drawer = createDrawerNavigator();

// dayjs.extend(localeData);


// const CustomDrawerContent = ({ monthlyCheckInCount, onRefresh, ...props }) => {
//   const { t, i18n } = useTranslation();  // Hook para traducción
//   const currentLanguage = i18n.language || "es"; // Idioma actual
//   const { navigation } = props; // Obtén navigation desde props si es necesario
//   const [refreshing, setRefreshing] = useState(false);
//   const [expandedYear, setExpandedYear] = useState(null);
//   const [userImageUri, setUserImageUri] = useState(null); // Estado para la imagen del usuario
//   const [username, setUsername] = useState(""); // Estado para el username

//   const drawerStatus = useDrawerStatus(); // "open" o "closed"
//   // Función para cargar la información del usuario desde Firebase y AsyncStorage
//   const loadUserData = async () => {
//     // Cargar la imagen del usuario desde AsyncStorage
//     const imageUri = await AsyncStorage.getItem("userImageUri");
//     setUserImageUri(imageUri);

//     // Obtener el username desde Firebase
//     const user = auth.currentUser;
//     if (user) {
//       const userDocRef = doc(db, "users", user.uid); // Obtén el documento del usuario
//       const userDoc = await getDoc(userDocRef);
//       if (userDoc.exists()) {
//         const data = userDoc.data();
//         setUsername(data.username || "Usuario"); // Asigna el username
//       }
//     }
//   };

  
//   // Actualizar datos al hacer refresh
//   const handleRefresh = useCallback(async () => {
//     setRefreshing(true);
//     await onRefresh(); // Actualizar el check-in
//     await loadUserData(); // Recargar los datos del usuario (foto y username)
//     setRefreshing(false);
//   }, [onRefresh]);

//   useFocusEffect(
//     useCallback(() => {
//       handleRefresh();
//     }, [handleRefresh])
//   );
//    // Llamar handleRefresh cada vez que el drawer se abra
//    useEffect(() => {
//     if (drawerStatus === 'open') {
//       handleRefresh();
//     }
//   }, [drawerStatus, handleRefresh]);

//   // Agrupa los meses por año
//   const groupedByYear = Object.keys(monthlyCheckInCount).reduce(
//     (acc, month) => {
//       const year = dayjs(month).year();
//       if (!acc[year]) acc[year] = [];
//       acc[year].push({ month, count: monthlyCheckInCount[month] });
//       return acc;
//     },
//     {}
//   );

//   const toggleYear = (year) => {
//     setExpandedYear(expandedYear === year ? null : year);
//   };
//   const handleSignOut = async () => {
//     try {
//       await auth.signOut();
//       // Redirige al login después de cerrar sesión
//     } catch (error) {
//       console.error("Error al cerrar sesión:", error);
//     }
//   };
//   // Cambiar idioma de dayjs según el idioma seleccionado en la app
//   useEffect(() => {
//     dayjs.locale(currentLanguage);
//   }, [currentLanguage]);

//   return (
//     <SafeAreaView style={{ flex: 1 }}>
     
//         <View style={styles.profileContainer}>
//           {/* Muestra la imagen del usuario */}
//           {userImageUri ? (
//             <Image source={{ uri: userImageUri }} style={styles.profileImage} />
//           ) : (
//             <Image
//               source={require("./assets/fotos/tashiro1.png")}
//               style={styles.profileImage}
//             />
//           )}
//           {/* Muestra el username debajo de la imagen */}
//           <Text style={styles.username}>{username}</Text>
           
         
//         {/* <FloatingFlags 
//     handleLanguageChange={i18n.changeLanguage} 
//     selectedLanguage={currentLanguage} 
//     containerStyle={styles.floatingFlagsDrawer}
//     /> */}
      
 
//         </View>
       
//          <Text style={styles.title}>{t("Historial")}</Text>
//         <ScrollView
//         contentContainerStyle={styles.drawerContainer}
//         contentInsetAdjustmentBehavior="automatic"
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
//         }
//       >
       
//         {Object.keys(groupedByYear).length > 0 ? (
//           Object.keys(groupedByYear)
//             .sort((a, b) => a - b) // Ordenar por año de forma descendente
//             .map((year) => (
//               <View key={year}>
//                 <TouchableOpacity
//                   onPress={() => toggleYear(year)}
//                   style={styles.yearRow}
//                 >
//                   <Text style={styles.yearText}>{year}</Text>
//                   <Icon
//                     name={expandedYear === year ? "chevron-up" : "chevron-down"}
//                     size={20}
//                     color="#333"
//                   />
//                 </TouchableOpacity>
//                 {expandedYear === year && (
//                   <View style={styles.monthContainer}>
//                     {groupedByYear[year]
//                       .sort((a, b) => dayjs(a.month).diff(dayjs(b.month)))
//                       .map(({ month, count }) => (
//                         <View key={month} style={styles.monthRow}>
//                           <Text style={styles.monthText}>
//                             {dayjs(month)
//                               .format("MMMM")
//                               .charAt(0)
//                               .toUpperCase() +
//                               dayjs(month).format("MMMM").slice(1)}
//                           </Text>
//                           <Text style={styles.countText}>{count}</Text>
//                         </View>
//                       ))}
//                   </View>
//                 )}
//               </View>
//             ))
//         ) : (
//           <Text style={styles.noDataText}>
//             No hay datos de historial disponibles
//           </Text>
//         )}
//       </ScrollView>
//       <View style={styles.buttonContainer}>
//       <ButtonGradient
//         onPress={handleSignOut}
//         title={t("Salir")}
//         style={styles.button}
//       />
// </View>
     
//     </SafeAreaView>
//   );
// };

// const UserBottomTabs = ({ navigation, route }) => {
//   const { t } = useTranslation();  // Hook para traducción
//   // Cambiar dinámicamente el título de la pantalla activa
//   useLayoutEffect(() => {
//     let title = "";

//     // Cambiar el título según la pantalla activa
//     if (route.name === "CheckIn") {
//       title = "Check In";
//     } else if (route.name === "AttendanceHistory") {
//       title = "Historial de Asistencia";
//     } else if (route.name === "UserProfile") {
//       title = "Perfil";
//     }

//     // Actualizar el título de la cabecera
//     navigation.setOptions({
//       title: title,
//     });
//   }, [navigation, route]); // Dependencia: cuando cambie la navegación o la pantalla

//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         tabBarIcon: ({ color, size }) => {
//           let iconName;
//           if (route.name === "Registrarse") iconName = "checkmark-circle-outline";
//           else if (route.name === "Historial")
//             iconName = "time-outline";
//           else if (route.name === "Profile") iconName = "person-outline";
//           return <Icon name={iconName} size={size} color={color} />;
//         },
//         tabBarActiveTintColor: "blue",
//         tabBarInactiveTintColor: "black",
//         tabBarStyle: {
//           backgroundColor: "#d3d3d3", // Por ejemplo, un gris claro
//         },
//       })}
//     >
//       <Tab.Screen
//       name="Registrarse"
//         component={CheckInScreen}
//         options={{
//           title: t("Informacion"),
//           headerShown: false ,
//         }}
//       />
//       <Tab.Screen
//         name="Historial"
//         component={AttendanceHistoryScreen}
//         options={{
//           title: t("Historial"),
//           headerShown: false ,
//         }}
//       />
//       <Tab.Screen
//         name="Profile"
//         component={UserProfileScreen}
//         options={{
//           title: t("Profile"),
//            headerShown: false ,
//         }}
//       />
//     </Tab.Navigator>
//   );
// };

// const AppDrawer = ({ monthlyCheckInCount, fetchMonthlyCheckInCount }) => (
//   <Drawer.Navigator
//     initialRouteName="UserTabs"
//     drawerContent={(props) => (
//       <CustomDrawerContent
//         {...props}
//         monthlyCheckInCount={monthlyCheckInCount}
//         onRefresh={fetchMonthlyCheckInCount}
//       />
//     )}
//     screenOptions={{
//       drawerStyle: styles.drawerStyle,
//       headerStyle: styles.headerStyle,
//       headerTintColor: "#fff",
//     }}
//   >
//     <Drawer.Screen
//       name="UserTabs"
//       component={UserBottomTabs}
//       options={{ title: "Inicio", headerTitleAlign: "center" }}
//     />
//     <Drawer.Screen
//       name="Information"
//       component={Information}
//       options={{ title: "Información" }}
//     />
//     {/* <Drawer.Screen
//       name="AttendanceHistory"
//       component={AttendanceHistoryScreen}
//       options={{ title: "Información" }}
//     /> */}
//   </Drawer.Navigator>
// );

// const styles = StyleSheet.create({
//   drawerContainer: {
//     padding: 16,
//     backgroundColor: "#f5f5f5",
//     flexGrow: 1,
//     paddingBottom: 0
//   },
//   profileContainer: {
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   profileImage: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     alignSelf: "center",
//     marginTop: Platform.OS === "ios" ? 50 : 30, // Ajuste de margen superior específico
//   },
//   username: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#333",
//     marginTop: Platform.OS === "ios" ? 20 : 10, // Ajuste de margen superior específico
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginTop: 10,
//     color: "#333",
//     marginLeft:80,
//     marginRight:80,
//   },
//   yearRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: "#ddd",
//     backgroundColor: "#e9e9e9",
//     paddingHorizontal: 10,
//     borderRadius: 5,
//     marginVertical: 5,
//   },
//   yearText: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#333",
//   },
//   monthContainer: {
//     paddingLeft: 20,
//     paddingTop: 10,
//   },
//   monthRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingVertical: 5,
//   },
//   monthText: {
//     fontSize: 16,
//     color: "#333",
//   },
//   countText: {
//     fontSize: 16,
//     color: "#888",
//   },
//   noDataText: {
//     fontSize: 16,
//     color: "#888",
//     textAlign: "center",
//   },
//   drawerStyle: {
//     width: 250,
//     flex:1,
//     // backgroundColor:"transparent",
//   },
//   headerStyle: {
//     backgroundColor: "black",
//   },
//   buttonContainer: {
//     height: 90,
//   },
//   button: {
//     width: "80%",
//     height: 50,
//     borderRadius: 25,
//     padding: 10,
//     alignItems: "center",
//     justifyContent: "center",
//     marginHorizontal: "auto",
//     marginVertical: "auto",
//   },
//   // floatingFlagsDrawer: {
//   //   flexDirection: "row",
//   //   marginBottom: -10,
//   //   backgroundColor: "transparent", // Si quieres cambiar el fondo
//   //   paddingHorizontal: 10, // Ajustar separación si es necesario
//   // },
// });

// export default AppDrawer;
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
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import CheckInScreen from "./CheckInScreen";
import AttendanceHistoryScreen from "./AttendanceHistoryScreen";
import UserProfileScreen from "./UserProfileScreen";
import Information from "./Information";
import ButtonMinimal from "./ButtonMinimal";
import CardMinimal from "./CardMinimal";
import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import "dayjs/locale/pt";
import "dayjs/locale/ja";
import "dayjs/locale/en";
import "dayjs/locale/es";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { useDrawerStatus } from '@react-navigation/drawer';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

dayjs.extend(localeData);

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

  const drawerStatus = useDrawerStatus();

  // Función para cargar la información del usuario
  const loadUserData = async () => {
    try {
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
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error);
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
    const color = beltColor.toLowerCase();
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

  // Opciones del menú
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
      onPress: () => {
        // Navegar a una pantalla de progreso detallado si existe
        navigation.closeDrawer();
      },
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header con logo */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.closeDrawer()}>
            <Icon name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>
         
        </View>

        {/* Perfil del usuario */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {userImageUri ? (
              <Image source={{ uri: userImageUri }} style={styles.avatar} />
            ) : (
              <Image
                source={require("./assets/fotos/tashiro1.png")}
                style={styles.avatar}
              />
            )}
          </View>
          <Text style={styles.userName}>{firstName}</Text>
          <Text style={styles.userHandle}>@{username}</Text>
        </View>

        {/* Card de progreso rápido */}
        <CardMinimal style={styles.progressCard}>
          <View style={styles.progressRow}>
            <View style={styles.beltIconContainer}>
              <View 
                style={[
                  styles.beltIcon,
                  { backgroundColor: getBeltColor(userBelt) }
                ]}
              />
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>{beltProgressText}</Text>
              <Text style={styles.monthlyText}>
                {t("Entrenamientos este mes: {{count}}", { count: monthlyCheckIns })}
              </Text>
            </View>
          </View>
        </CardMinimal>

        {/* Navegación principal */}
        <View style={styles.navigationSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Icon name={item.icon} size={20} color="#333333" style={styles.menuIcon} />
              <Text style={styles.menuText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Información de la app */}
        <View style={styles.appInfoSection}>
          <Text style={styles.versionText}>v1.2.0</Text>
        </View>
      </ScrollView>

      {/* Botón de cerrar sesión */}
      <View style={styles.logoutSection}>
        <ButtonMinimal
          onPress={handleSignOut}
          title={t("Cerrar Sesión")}
          variant="danger"
          style={styles.logoutButton}
        />
      </View>
    </SafeAreaView>
  );
};

const UserBottomTabs = ({ navigation, route }) => {
  const { t } = useTranslation();

  // Cambiar dinámicamente el título de la pantalla activa
  useLayoutEffect(() => {
    let title = "";

    if (route.name === "CheckIn") {
      title = "Check In";
    } else if (route.name === "AttendanceHistory") {
      title = "Historial de Asistencia";
    } else if (route.name === "UserProfile") {
      title = "Perfil";
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
          else if (route.name === "Profile") iconName = "person-outline";
          return <Icon name={iconName} size={size} color={color} />;
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
          fontSize: 12,
          fontWeight: '500',
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
      headerTintColor: "#FFFFFF",
      headerTitleStyle: {
        fontWeight: '600',
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
      options={{ 
        title: "Información",
        headerTitleAlign: "center",
      }}
    />
  </Drawer.Navigator>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 10,
  },
  logoContainer: {
    flex: 1,
    alignItems: "center",
    marginLeft: -24, // Compensar el botón de atrás
  },
  logo: {
    width: 40,
    height: 40,
    marginBottom: 8,
    resizeMode: "contain",
  },
  logoText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    letterSpacing: 1,
  },
  logoSubtext: {
    fontSize: 12,
    color: "#666666",
    letterSpacing: 0.5,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    marginTop:-40,
  },
  avatarContainer: {
    marginBottom: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 14,
    color: "#666666",
  },
  progressCard: {
    marginHorizontal: 20,
    marginBottom: 5,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  beltIconContainer: {
    marginRight: 12,
  },
  beltIcon: {
    width: 30,
    height: 15,
    borderRadius: 3,
  },
  progressInfo: {
    flex: 1,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  monthlyText: {
    fontSize: 14,
    color: "#666666",
  },
  navigationSection: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 2,
    borderRadius: 8,
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
  appInfoSection: {
    paddingHorizontal: 20,
    paddingTop: 5,
    alignItems: "center",
  },
  versionText: {
    fontSize: 12,
    color: "#999999",
  },
  logoutSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  logoutButton: {
    marginBottom: Platform.OS === 'ios' ? 10 : 0,
  },
  drawerStyle: {
    width: 280,
    backgroundColor: "#FFFFFF",
  },
  headerStyle: {
    backgroundColor: "#000000",
    elevation: 0,
    shadowOpacity: 0,
  },
});

export default AppDrawer;
