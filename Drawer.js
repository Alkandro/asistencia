import React, { useState, useCallback } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
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
  const [expandedYear, setExpandedYear] = useState(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  // Agrupa los meses por año
  const groupedByYear = Object.keys(monthlyCheckInCount).reduce((acc, month) => {
    const year = dayjs(month).year();
    if (!acc[year]) acc[year] = [];
    acc[year].push({ month, count: monthlyCheckInCount[month] });
    return acc;
  }, {});

  const toggleYear = (year) => {
    setExpandedYear(expandedYear === year ? null : year);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.drawerContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <Text style={styles.title}>Historial</Text>
      {Object.keys(groupedByYear).length > 0 ? (
        Object.keys(groupedByYear)
          .sort((a, b) => a - b) // Ordenar por año de forma descendente
          .map((year) => (
            <View key={year}>
              <TouchableOpacity onPress={() => toggleYear(year)} style={styles.yearRow}>
                <Text style={styles.yearText}>{year}</Text>
                <Icon name={expandedYear === year ? "chevron-up" : "chevron-down"} size={20} color="#333" />
              </TouchableOpacity>
              {expandedYear === year && (
                <View style={styles.monthContainer}>
                  {groupedByYear[year]
                    .sort((a, b) => dayjs(a.month).diff(dayjs(b.month)))
                    .map(({ month, count }) => (
                      <View key={month} style={styles.monthRow}>
                        <Text style={styles.monthText}>{dayjs(month).format("MMMM").charAt(0).toUpperCase() + dayjs(month).format("MMMM").slice(1)}</Text>
                        <Text style={styles.countText}>{count}</Text>
                      </View>
                    ))}
                </View>
              )}
            </View>
          ))
      ) : (
        <Text style={styles.noDataText}>No hay datos de historial disponibles</Text>
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
        onRefresh={fetchMonthlyCheckInCount}
      />
    )}
    screenOptions={{
      drawerStyle: styles.drawerStyle,
      headerStyle: styles.headerStyle,
      headerTintColor: "#fff",
    }}
  >
    <Drawer.Screen name="UserTabs" component={UserBottomTabs} options={{ title: "Inicio", headerTitleAlign: "center" }} />
    <Drawer.Screen name="Information" component={Information} options={{ title: "Información" }} />
    <Drawer.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
  </Drawer.Navigator>
);

const styles = StyleSheet.create({
  drawerContainer: {
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
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
    paddingTop: 5,
  },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  monthText: {
    fontSize: 16,
    color: "#444",
  },
  countText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  noDataText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
  drawerStyle: {
    backgroundColor: "#e0e0e0",
    width: 280,
  },
  headerStyle: {
    backgroundColor: "#6200ea",
  },
});

export default AppDrawer;

