// import React, { useState, useRef, useEffect } from "react";
// import {
//   View,
//   Text,
//   ActivityIndicator,
//   FlatList,
//   RefreshControl,
//   StyleSheet,
//   Animated,
//   Platform,
// } from "react-native";
// import { Picker } from "@react-native-picker/picker";
// import { Swipeable } from "react-native-gesture-handler";
// import {
//   collection,
//   query,
//   where,
//   getDocs,
//   doc,
//   deleteDoc,
// } from "firebase/firestore";
// import { auth, db } from "./firebase";
// import { useFocusEffect } from "@react-navigation/native";
// import dayjs from "dayjs";
// import { SafeAreaView } from "react-native";
// import { useTranslation } from "react-i18next";

// const AttendanceHistoryScreen = () => {
//   const { t } = useTranslation();
//   const [attendanceHistory, setAttendanceHistory] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [monthlyCheckInCount, setMonthlyCheckInCount] = useState({});

//   // Filtros
//   const [selectedYear, setSelectedYear] = useState("");
//   const [selectedMonth, setSelectedMonth] = useState("");

//   // Animación
//   const fadeAnim = useRef(new Animated.Value(1)).current;

//   const fetchAttendanceHistory = async () => {
//     try {
//       setLoading(true);
//       const user = auth.currentUser;

//       if (user) {
//         const q = query(
//           collection(db, "attendanceHistory"),
//           where("userId", "==", user.uid)
//         );

//         const querySnapshot = await getDocs(q);
//         const history = [];
//         const monthlyCounts = {};

//         querySnapshot.forEach((docItem) => {
//           const data = docItem.data();
//           const timestamp = data.timestamp?.seconds
//             ? new Date(data.timestamp.seconds * 1000)
//             : null;

//           if (timestamp) {
//             const monthKey = dayjs(timestamp).format("YYYY-MM");
//             monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
//           }

//           history.push({ id: docItem.id, ...data });
//         });

//         setAttendanceHistory(history);
//         setMonthlyCheckInCount(monthlyCounts);
//       }
//     } catch (error) {
//       console.error("Error al obtener el historial de asistencia:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Pull to refresh
//   const onRefresh = async () => {
//     setRefreshing(true);
//     await fetchAttendanceHistory();
//     setRefreshing(false);
//   };

//   useFocusEffect(
//     React.useCallback(() => {
//       fetchAttendanceHistory();
//     }, [])
//   );

//   // Conteo del mes actual
//   const currentMonthKey = dayjs().format("YYYY-MM");
//   const currentMonthCheckIns = monthlyCheckInCount[currentMonthKey] || 0;

//   // Animación de parpadeo
//   useEffect(() => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(fadeAnim, {
//           toValue: 0,
//           duration: 500,
//           useNativeDriver: true,
//         }),
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 500,
//           useNativeDriver: true,
//         }),
//       ])
//     ).start();
//   }, [fadeAnim]);

//   // Años únicos
//   const uniqueYears = Array.from(
//     new Set(
//       attendanceHistory.map((item) =>
//         dayjs(new Date(item.timestamp?.seconds * 1000)).format("YYYY")
//       )
//     )
//   ).sort();

//   // Meses únicos para el año seleccionado
//   const uniqueMonthsForSelectedYear = selectedYear
//     ? Array.from(
//         new Set(
//           attendanceHistory
//             .filter(
//               (item) =>
//                 dayjs(new Date(item.timestamp?.seconds * 1000)).format("YYYY") ===
//                 selectedYear
//             )
//             .map((item) =>
//               dayjs(new Date(item.timestamp?.seconds * 1000)).format("MM")
//             )
//         )
//       ).sort()
//     : [];

//   // Filtro final
//   const filteredAttendanceHistory = attendanceHistory.filter((item) => {
//     const itemDate = new Date(item.timestamp?.seconds * 1000);
//     const itemYear = dayjs(itemDate).format("YYYY");
//     const itemMonth = dayjs(itemDate).format("MM");

//     if (selectedYear && itemYear !== selectedYear) {
//       return false;
//     }
//     if (selectedMonth && itemMonth !== selectedMonth) {
//       return false;
//     }
//     return true;
//   });

//   // Borrar un item
//   const handleDelete = async (id) => {
//     try {
//       await deleteDoc(doc(db, "attendanceHistory", id));
//       setAttendanceHistory((prev) => prev.filter((item) => item.id !== id));
//     } catch (error) {
//       console.error("Error al eliminar el registro:", error);
//     }
//   };

//   const renderItem = ({ item }) => {
//     const swipeRightActions = () => {
//       return (
//         <View style={styles.deleteContainer}>
//           <Text style={styles.deleteText} onPress={() => handleDelete(item.id)}>
//             {t("Borrar")}
//           </Text>
//         </View>
//       );
//     };

//     return (
//       <Swipeable renderRightActions={swipeRightActions}>
//         <View style={styles.itemContainer}>
//           <Text>
//             <Text style={{ fontWeight: "bold", color: "black" }}>
//               {t(" User:")}
//             </Text>
//             <Text style={{ color: "blue" }}> {item.username}</Text>
//           </Text>
//           <Text>
//             {t(" Date:")}{" "}
//             {new Date(item.timestamp?.seconds * 1000).toLocaleDateString()}
//           </Text>
//         </View>
//       </Swipeable>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.safeContainer}>
//       <View style={styles.container}>
//         <Text style={styles.label}>{t("Selecciona el año:")}</Text>
//         <Picker
//           selectedValue={selectedYear}
//           onValueChange={(itemValue) => {
//             setSelectedYear(itemValue);
//             setSelectedMonth("");
//           }}
//           style={Platform.OS === "ios" ? styles.pickerIOS : styles.pickerDefault}
//           itemStyle={Platform.OS === "ios" ? styles.pickerItemIOS : null}
//         >
//           <Picker.Item label={t("Todos")} value="" />
//           {uniqueYears.map((year) => (
//             <Picker.Item label={year} value={year} key={year} />
//           ))}
//         </Picker>

//         {selectedYear ? (
//           <>
//             <Text style={styles.label}>{t("Selecciona el mes:")}</Text>
//             <Picker
//               selectedValue={selectedMonth}
//               onValueChange={(itemValue) => setSelectedMonth(itemValue)}
//               style={
//                 Platform.OS === "ios" ? styles.pickerIOS : styles.pickerDefault
//               }
//               itemStyle={Platform.OS === "ios" ? styles.pickerItemIOS : null}
//             >
//               <Picker.Item label={t("Todos")} value="" />
//               {uniqueMonthsForSelectedYear.map((month) => (
//                 <Picker.Item label={month} value={month} key={month} />
//               ))}
//             </Picker>
//           </>
//         ) : null}

//         {loading ? (
//           <ActivityIndicator size="large" color="#0000ff" />
//         ) : (
//           <FlatList
//             data={filteredAttendanceHistory}
//             keyExtractor={(item) => item.id}
//             renderItem={renderItem}
//             contentContainerStyle={{ paddingBottom: 35 }}
//             refreshControl={
//               <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//             }
//           />
//         )}

//         <View style={styles.footer}>
//           <Animated.Text
//             style={[
//               styles.footerText,
//               { opacity: fadeAnim }, // parpadeo
//             ]}
//           >
//             {t("Congratulations! You have worked out")}{" "}
//             <Text style={styles.texto}>{currentMonthCheckIns}</Text>{" "}
//             {t("times this month.")}
//           </Animated.Text>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// export default AttendanceHistoryScreen;

// const styles = StyleSheet.create({
//   safeContainer: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   container: {
//     flex: 1,
//     padding: 20,
//   },
//   pickerIOS: {
//     height: 80,
//     marginVertical: 5,
//   },
//   pickerItemIOS: {
//     height: 80,
//     fontSize: 16,
//   },
//   pickerDefault: {
//     marginVertical: 5,
//   },
//   label: {
//     fontWeight: "bold",
//     marginTop: 10,
//     marginBottom: 5,
//   },
//   itemContainer: {
//     padding: 10,
//     borderBottomWidth: 0.8,
//     backgroundColor: "#fff",
//   },
//   deleteContainer: {
//     backgroundColor: "red",
//     justifyContent: "center",
//     alignItems: "flex-end",
//     paddingHorizontal: 20,
//     marginVertical: 1,
//   },
//   deleteText: {
//     color: "#fff",
//     fontWeight: "bold",
//     padding: 10,
//   },
//   footer: {
//     backgroundColor: "#fff",
//     alignItems: "center",
//     borderTopWidth: 3,
//     borderTopColor: "#ccc",
//     paddingTop: 10,
//     marginTop: 10,
//   },
//   footerText: {
//     fontSize: 15,
//     fontWeight: "bold",
//   },
//   texto: {
//     color: "#3D3BF3",
//   },
// });


import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Animated,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Swipeable } from "react-native-gesture-handler";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";
import { SafeAreaView } from "react-native";
import { useTranslation } from "react-i18next";
import CardMinimal from "./CardMinimal";
import ButtonMinimal from "./ButtonMinimal";
import Icon from "react-native-vector-icons/Ionicons";

const AttendanceHistoryScreen = () => {
  const { t } = useTranslation();
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monthlyCheckInCount, setMonthlyCheckInCount] = useState({});

  // Filtros
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  // Animación
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;

      if (user) {
        const q = query(
          collection(db, "attendanceHistory"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const history = [];
        const monthlyCount = {};

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const timestamp = data.timestamp?.seconds
            ? new Date(data.timestamp.seconds * 1000)
            : null;

          if (timestamp) {
            history.push({
              id: docSnap.id,
              ...data,
              timestamp,
            });

            // Contar por mes
            const monthKey = dayjs(timestamp).format("YYYY-MM");
            monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1;
          }
        });

        // Ordenar por fecha descendente
        history.sort((a, b) => b.timestamp - a.timestamp);
        setAttendanceHistory(history);
        setMonthlyCheckInCount(monthlyCount);

        // Establecer año actual por defecto
        if (!selectedYear && history.length > 0) {
          setSelectedYear(dayjs().year().toString());
        }
      }
    } catch (error) {
      console.error("Error al obtener el historial:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendanceHistory();
    setRefreshing(false);
  };

  const deleteAttendanceRecord = async (id) => {
    try {
      await deleteDoc(doc(db, "attendanceHistory", id));
      
      // Animación de desvanecimiento
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        fetchAttendanceHistory();
        fadeAnim.setValue(1);
      });
    } catch (error) {
      console.error("Error al eliminar registro:", error);
    }
  };

  const renderDeleteAction = (id) => (
    <Animated.View style={[styles.deleteAction, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteAttendanceRecord(id)}
      >
        <Icon name="trash-outline" size={20} color="#FFFFFF" />
        <Text style={styles.deleteText}>{t("Eliminar")}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  useFocusEffect(
    React.useCallback(() => {
      fetchAttendanceHistory();
    }, [])
  );

  // Filtrar datos
  const filteredHistory = attendanceHistory.filter((item) => {
    const itemYear = dayjs(item.timestamp).year().toString();
    const itemMonth = dayjs(item.timestamp).format("MM");
    
    const yearMatch = !selectedYear || itemYear === selectedYear;
    const monthMatch = !selectedMonth || itemMonth === selectedMonth;
    
    return yearMatch && monthMatch;
  });

  // Obtener años únicos
  const availableYears = [...new Set(
    attendanceHistory.map(item => dayjs(item.timestamp).year().toString())
  )].sort((a, b) => b - a);

  // Obtener meses únicos para el año seleccionado
  const availableMonths = [...new Set(
    attendanceHistory
      .filter(item => !selectedYear || dayjs(item.timestamp).year().toString() === selectedYear)
      .map(item => dayjs(item.timestamp).format("MM"))
  )].sort();

  const monthNames = {
    "01": t("Enero"), "02": t("Febrero"), "03": t("Marzo"),
    "04": t("Abril"), "05": t("Mayo"), "06": t("Junio"),
    "07": t("Julio"), "08": t("Agosto"), "09": t("Septiembre"),
    "10": t("Octubre"), "11": t("Noviembre"), "12": t("Diciembre")
  };

  const renderAttendanceItem = ({ item }) => (
    <Swipeable renderRightActions={() => renderDeleteAction(item.id)}>
      <CardMinimal style={styles.attendanceCard}>
        <View style={styles.attendanceHeader}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {dayjs(item.timestamp).format("DD")}
            </Text>
            <Text style={styles.monthText}>
              {dayjs(item.timestamp).format("MMM").toUpperCase()}
            </Text>
          </View>
          <View style={styles.attendanceInfo}>
            <Text style={styles.userText}>{t("Usuario")}: {item.username}</Text>
            <Text style={styles.timestampText}>
              {dayjs(item.timestamp).format("DD/MM/YYYY - HH:mm")}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{t("Completado")}</Text>
          </View>
        </View>
      </CardMinimal>
    </Swipeable>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>{t("Historial de Entrenamientos")}</Text>
      
      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>{t("Año")}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedYear}
                onValueChange={setSelectedYear}
                style={styles.picker}
              >
                <Picker.Item label={t("Todos los años")} value="" />
                {availableYears.map(year => (
                  <Picker.Item key={year} label={year} value={year} />
                ))}
              </Picker>
            </View>
          </View>
          
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>{t("Mes")}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedMonth}
                onValueChange={setSelectedMonth}
                style={styles.picker}
              >
                <Picker.Item label={t("Todos los meses")} value="" />
                {availableMonths.map(month => (
                  <Picker.Item 
                    key={month} 
                    label={monthNames[month]} 
                    value={month} 
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {(selectedYear || selectedMonth) && (
          <ButtonMinimal
            title={t("Limpiar filtros")}
            onPress={() => {
              setSelectedYear("");
              setSelectedMonth("");
            }}
            variant="outline"
            style={styles.clearButton}
          />
        )}
      </View>

      {/* Estadísticas */}
      <CardMinimal style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{filteredHistory.length}</Text>
            <Text style={styles.statLabel}>{t("Entrenamientos")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {selectedYear && selectedMonth 
                ? monthlyCheckInCount[`${selectedYear}-${selectedMonth}`] || 0
                : Object.values(monthlyCheckInCount).reduce((a, b) => a + b, 0)
              }
            </Text>
            <Text style={styles.statLabel}>
              {selectedYear && selectedMonth ? t("Este mes") : t("Total")}
            </Text>
          </View>
        </View>
      </CardMinimal>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="fitness-outline" size={64} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>{t("Sin entrenamientos")}</Text>
      <Text style={styles.emptyText}>
        {selectedYear || selectedMonth 
          ? t("No hay entrenamientos para los filtros seleccionados")
          : t("Aún no has registrado ningún entrenamiento")
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredHistory}
        renderItem={renderAttendanceItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#000000"
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  listContainer: {
    paddingBottom: 20,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 24,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filterRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  picker: {
    height: Platform.OS === "ios" ? 120 : 50,
    color: "#333333",
  },
  clearButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
  },
  statsCard: {
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666666",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 20,
  },
  attendanceCard: {
    marginHorizontal: 20,
    marginVertical: 4,
  },
  attendanceHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateContainer: {
    alignItems: "center",
    marginRight: 16,
    minWidth: 50,
  },
  dateText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
  },
  monthText: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "500",
  },
  attendanceInfo: {
    flex: 1,
  },
  userText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 4,
  },
  timestampText: {
    fontSize: 14,
    color: "#666666",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#28A745",
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#28A745",
    fontWeight: "500",
  },
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    backgroundColor: "#DC3545",
    marginVertical: 4,
    borderRadius: 8,
  },
  deleteButton: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: "100%",
  },
  deleteText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
  },
});

export default AttendanceHistoryScreen;
