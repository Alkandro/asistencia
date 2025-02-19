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
import { useTranslation } from 'react-i18next';


const AttendanceHistoryScreen = () => {
  const { t } = useTranslation();  // Hook para traducción
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monthlyCheckInCount, setMonthlyCheckInCount] = useState({});

  // Estados para los dropdowns
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  // Valor animado para el parpadeo
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Función para obtener el historial de asistencia y contar los check-ins por mes
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
        const monthlyCounts = {};

        querySnapshot.forEach((docItem) => {
          const data = docItem.data();
          const timestamp = data.timestamp?.seconds
            ? new Date(data.timestamp.seconds * 1000)
            : null;

          if (timestamp) {
            const monthKey = dayjs(timestamp).format("YYYY-MM");
            monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
          }

          history.push({ id: docItem.id, ...data });
        });

        setAttendanceHistory(history);
        setMonthlyCheckInCount(monthlyCounts);
      }
    } catch (error) {
      console.error("Error al obtener el historial de asistencia:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar los datos
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendanceHistory();
    setRefreshing(false);
  };

  // Ejecuta cada vez que la pantalla gana el foco
  useFocusEffect(
    React.useCallback(() => {
      fetchAttendanceHistory();
    }, [])
  );

  // Obtiene el conteo de check-ins para el mes actual
  const currentMonthKey = dayjs().format("YYYY-MM");
  const currentMonthCheckIns = monthlyCheckInCount[currentMonthKey] || 0;

  // Efecto de parpadeo
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  // 1) AÑOS únicos
  const uniqueYears = Array.from(
    new Set(
      attendanceHistory.map((item) =>
        dayjs(new Date(item.timestamp?.seconds * 1000)).format("YYYY")
      )
    )
  ).sort();

  // 2) MESES únicos para el año seleccionado
  const uniqueMonthsForSelectedYear = selectedYear
    ? Array.from(
        new Set(
          attendanceHistory
            .filter(
              (item) =>
                dayjs(new Date(item.timestamp?.seconds * 1000)).format(
                  "YYYY"
                ) === selectedYear
            )
            .map((item) =>
              dayjs(new Date(item.timestamp?.seconds * 1000)).format("MM")
            )
        )
      ).sort()
    : [];

  // 3) Filtramos la lista final según año y mes seleccionados
  const filteredAttendanceHistory = attendanceHistory.filter((item) => {
    const itemDate = new Date(item.timestamp?.seconds * 1000);
    const itemYear = dayjs(itemDate).format("YYYY");
    const itemMonth = dayjs(itemDate).format("MM");

    if (selectedYear && itemYear !== selectedYear) {
      return false;
    }
    if (selectedMonth && itemMonth !== selectedMonth) {
      return false;
    }
    return true;
  });

  // Función para borrar un item
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "attendanceHistory", id));
      setAttendanceHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error al eliminar el registro:", error);
    }
  };

  // Render del Swipeable
  const renderItem = ({ item }) => {
    const swipeRightActions = () => {
      return (
        <View style={styles.deleteContainer}>
          <Text style={styles.deleteText} onPress={() => handleDelete(item.id)}>
            Borrar
          </Text>
        </View>
      );
    };

    return (
      <Swipeable renderRightActions={swipeRightActions}>
        <View style={styles.itemContainer}>
        <Text>
  <Text style={{ fontWeight: 'bold', color: 'black' }}>{t(" User:")}</Text>
  <Text style={{ color: 'blue' }}> {item.username}</Text>
</Text>
          <Text>
           {t(" Date:")}{" "}
            {new Date(item.timestamp?.seconds * 1000).toLocaleDateString()}
          </Text>
        </View>
      </Swipeable>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Picker Año */}
        <Text style={styles.label}>{t("Selecciona el año:")}</Text>
        <Picker
          selectedValue={selectedYear}
          onValueChange={(itemValue) => {
            setSelectedYear(itemValue);
            setSelectedMonth("");
          }}
          style={
            Platform.OS === "ios" ? styles.pickerIOS : styles.pickerDefault
          }
          itemStyle={Platform.OS === "ios" ? styles.pickerItemIOS : null}
        >
          <Picker.Item label={t("Todos")} value="" />
          {uniqueYears.map((year) => (
            <Picker.Item label={year} value={year} key={year} />
          ))}
        </Picker>

        {/* Picker Mes (depende del año seleccionado) */}
        {selectedYear ? (
          <>
            <Text style={styles.label}>{t("Selecciona el mes:")}</Text>
            <Picker
              selectedValue={selectedMonth}
              onValueChange={(itemValue) => setSelectedMonth(itemValue)}
              style={
                Platform.OS === "ios" ? styles.pickerIOS : styles.pickerDefault
              }
              itemStyle={Platform.OS === "ios" ? styles.pickerItemIOS : null}
            >
              <Picker.Item label={t("Todos")} value="" />
              {uniqueMonthsForSelectedYear.map((month) => (
                <Picker.Item label={month} value={month} key={month} />
              ))}
            </Picker>
          </>
        ) : null}

        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <FlatList
            data={filteredAttendanceHistory}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 35 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}

        <View style={styles.footer}>
          <Animated.Text
            style={[
              styles.footerText,
              { opacity: fadeAnim }, // Animación de opacidad
            ]}
          >
            Congratulations! You have worked out
            <Text style={styles.texto}> {currentMonthCheckIns} </Text>
            times this month.
          </Animated.Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  pickerIOS: {
    // Ajusta la altura para que sea más compacto
    height: 80,
    marginVertical: 5,
  },
  pickerItemIOS: {
    // Ajusta el alto de cada fila de ítem y su tamaño de fuente
    height: 80,
    fontSize: 16,
  },
  pickerDefault: {
    marginVertical: 5,
  },
  label: {
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
  itemContainer: {
    padding: 10,
    borderBottomWidth: 0.8,
    backgroundColor: "#fff",
    fontStyle: "italic",
  },
  deleteContainer: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginVertical: 1,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "bold",
    padding: 10,
  },
  footer: {
    backgroundColor: "#fff",

    alignItems: "center",
    borderTopWidth: 3,
    borderTopColor: "#ccc",
  },
  footerText: {
    fontSize: 15,
    fontWeight: "bold",
  },
  texto: {
    color: "#3D3BF3",
  },
});

export default AttendanceHistoryScreen;
