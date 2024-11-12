import React, { useState, useCallback } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import CheckInScreen from "./CheckInScreen";
import AttendanceHistoryScreen from "./AttendanceHistoryScreen";
import UserProfileScreen from "./UserProfileScreen";
import Information from "./Information";
import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import "dayjs/locale/es";

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

dayjs.extend(localeData);
dayjs.locale("es");

const CustomDrawerContent = ({ monthlyCheckInCount, onRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh(); // Ejecuta la función de actualización
    setRefreshing(false);
  }, [onRefresh]);

  return (
    <ScrollView
      contentContainerStyle={styles.drawerContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Text style={styles.title}>Historial Mensual</Text>
      {Object.keys(monthlyCheckInCount).length > 0 ? (
        Object.keys(monthlyCheckInCount).map((month) => (
          <View key={month} style={styles.monthRow}>
            <Text style={styles.monthText}>{dayjs(month).format("MMMM YYYY")}</Text>
            <Text style={styles.countText}>{monthlyCheckInCount[month]}</Text>
          </View>
        ))
      ) : (
        <Text>No hay datos de historial disponibles</Text>
      )}
    </ScrollView>
  );
};

const UserBottomTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === "CheckIn") iconName = "checkmark-circle-outline";
        else if (route.name === "AttendanceHistory") iconName = "time-outline";
        else if (route.name === "UserProfile") iconName = "person-outline";
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "blue",
      tabBarInactiveTintColor: "gray",
    })}
  >
    <Tab.Screen name="CheckIn" component={CheckInScreen} options={{ title: "Check In", headerTitleAlign: "center" }} />
    <Tab.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} options={{ title: "Historial de Asistencia", headerTitleAlign: "center" }} />
    <Tab.Screen name="UserProfile" component={UserProfileScreen} options={{ title: "Perfil", headerTitleAlign: "center" }} />
  </Tab.Navigator>
);

const AppDrawer = ({ monthlyCheckInCount, fetchMonthlyCheckInCount }) => (
  <Drawer.Navigator
    initialRouteName="UserTabs"
    drawerContent={(props) => (
      <CustomDrawerContent
        {...props}
        monthlyCheckInCount={monthlyCheckInCount}
        onRefresh={fetchMonthlyCheckInCount} // Pasa la función de actualización
      />
    )}
  >
    <Drawer.Screen name="UserTabs" component={UserBottomTabs} options={{ title: "Inicio", headerTitleAlign: "center" }} />
    <Drawer.Screen name="Information" component={Information} options={{ title: "Información" }} />
    <Drawer.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
  </Drawer.Navigator>
);

const styles = StyleSheet.create({
  drawerContainer: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  monthText: {
    fontSize: 16,
  },
  countText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AppDrawer;
