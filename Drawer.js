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
import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import "dayjs/locale/es";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ButtonGradient from "./ButtonGradient";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase"; // Asegúrate de tener configurado Firebase
import { useDrawerStatus } from '@react-navigation/drawer';


const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

dayjs.extend(localeData);
dayjs.locale("es");

const CustomDrawerContent = ({ monthlyCheckInCount, onRefresh, ...props }) => {
  const { navigation } = props; // Obtén navigation desde props si es necesario
  const [refreshing, setRefreshing] = useState(false);
  const [expandedYear, setExpandedYear] = useState(null);
  const [userImageUri, setUserImageUri] = useState(null); // Estado para la imagen del usuario
  const [username, setUsername] = useState(""); // Estado para el username

  const drawerStatus = useDrawerStatus(); // "open" o "closed"
  // Función para cargar la información del usuario desde Firebase y AsyncStorage
  const loadUserData = async () => {
    // Cargar la imagen del usuario desde AsyncStorage
    const imageUri = await AsyncStorage.getItem("userImageUri");
    setUserImageUri(imageUri);

    // Obtener el username desde Firebase
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, "users", user.uid); // Obtén el documento del usuario
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUsername(data.username || "Usuario"); // Asigna el username
      }
    }
  };

  
  // Actualizar datos al hacer refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh(); // Actualizar el check-in
    await loadUserData(); // Recargar los datos del usuario (foto y username)
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

  // Agrupa los meses por año
  const groupedByYear = Object.keys(monthlyCheckInCount).reduce(
    (acc, month) => {
      const year = dayjs(month).year();
      if (!acc[year]) acc[year] = [];
      acc[year].push({ month, count: monthlyCheckInCount[month] });
      return acc;
    },
    {}
  );

  const toggleYear = (year) => {
    setExpandedYear(expandedYear === year ? null : year);
  };
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      // Redirige al login después de cerrar sesión
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
     
        <View style={styles.profileContainer}>
          {/* Muestra la imagen del usuario */}
          {userImageUri ? (
            <Image source={{ uri: userImageUri }} style={styles.profileImage} />
          ) : (
            <Image
              source={require("./assets/fotos/tashiro1.png")}
              style={styles.profileImage}
            />
          )}
          {/* Muestra el username debajo de la imagen */}
          <Text style={styles.username}>{username}</Text>
        </View>
         <Text style={styles.title}>Historial</Text>
        <ScrollView
        contentContainerStyle={styles.drawerContainer}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
       
        {Object.keys(groupedByYear).length > 0 ? (
          Object.keys(groupedByYear)
            .sort((a, b) => a - b) // Ordenar por año de forma descendente
            .map((year) => (
              <View key={year}>
                <TouchableOpacity
                  onPress={() => toggleYear(year)}
                  style={styles.yearRow}
                >
                  <Text style={styles.yearText}>{year}</Text>
                  <Icon
                    name={expandedYear === year ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#333"
                  />
                </TouchableOpacity>
                {expandedYear === year && (
                  <View style={styles.monthContainer}>
                    {groupedByYear[year]
                      .sort((a, b) => dayjs(a.month).diff(dayjs(b.month)))
                      .map(({ month, count }) => (
                        <View key={month} style={styles.monthRow}>
                          <Text style={styles.monthText}>
                            {dayjs(month)
                              .format("MMMM")
                              .charAt(0)
                              .toUpperCase() +
                              dayjs(month).format("MMMM").slice(1)}
                          </Text>
                          <Text style={styles.countText}>{count}</Text>
                        </View>
                      ))}
                  </View>
                )}
              </View>
            ))
        ) : (
          <Text style={styles.noDataText}>
            No hay datos de historial disponibles
          </Text>
        )}
      </ScrollView>
      <View style={styles.buttonContainer}>
      <ButtonGradient
        onPress={handleSignOut}
        title="Sign Out"
        style={styles.button}
      />
</View>
     
    </SafeAreaView>
  );
};

const UserBottomTabs = ({ navigation, route }) => {
  // Cambiar dinámicamente el título de la pantalla activa
  useLayoutEffect(() => {
    let title = "";

    // Cambiar el título según la pantalla activa
    if (route.name === "CheckIn") {
      title = "Check In";
    } else if (route.name === "AttendanceHistory") {
      title = "Historial de Asistencia";
    } else if (route.name === "UserProfile") {
      title = "Perfil";
    }

    // Actualizar el título de la cabecera
    navigation.setOptions({
      title: title,
    });
  }, [navigation, route]); // Dependencia: cuando cambie la navegación o la pantalla

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Registrarse") iconName = "checkmark-circle-outline";
          else if (route.name === "Historial")
            iconName = "time-outline";
          else if (route.name === "Profile") iconName = "person-outline";
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "blue",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="Registrarse"
        component={CheckInScreen}
        options={{
          headerShown: false ,
        }}
      />
      <Tab.Screen
        name="Historial"
        component={AttendanceHistoryScreen}
        options={{
          headerShown: false ,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={UserProfileScreen}
        options={{
           headerShown: false ,
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
      headerTintColor: "#fff",
    }}
  >
    <Drawer.Screen
      name="UserTabs"
      component={UserBottomTabs}
      options={{ title: "Inicio", headerTitleAlign: "center" }}
    />
    <Drawer.Screen
      name="Information"
      component={Information}
      options={{ title: "Información" }}
    />
    {/* <Drawer.Screen
      name="AttendanceHistory"
      component={AttendanceHistoryScreen}
      options={{ title: "Información" }}
    /> */}
  </Drawer.Navigator>
);

const styles = StyleSheet.create({
  drawerContainer: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    flexGrow: 1,
    paddingBottom: 0
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginTop: Platform.OS === "ios" ? 50 : 30, // Ajuste de margen superior específico
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: Platform.OS === "ios" ? 20 : 10, // Ajuste de margen superior específico
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
    marginLeft:80,
    marginRight:80,
  },
  yearRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#e9e9e9",
    paddingHorizontal: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  yearText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  monthContainer: {
    paddingLeft: 20,
    paddingTop: 10,
  },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  monthText: {
    fontSize: 16,
    color: "#333",
  },
  countText: {
    fontSize: 16,
    color: "#888",
  },
  noDataText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  drawerStyle: {
    width: 250,
    flex:1,
    // backgroundColor:"transparent",
  },
  headerStyle: {
    backgroundColor: "black",
  },
  buttonContainer: {
   
    height: 90,
    
  },
  button: {
    width: "80%",
    height: 50,
    borderRadius: 25,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: "auto",
    marginVertical: "auto",
  },
});

export default AppDrawer;
