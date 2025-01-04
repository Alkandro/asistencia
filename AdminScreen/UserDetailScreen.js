import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  RefreshControl, // Importante: para usar Pull to Refresh
} from "react-native";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase"; // Ajusta la ruta según tu configuración
import { useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";

// dayjs para formatear fechas
import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import "dayjs/locale/es";

dayjs.extend(localeData);
dayjs.locale("es");

export default function UserDetailScreen() {
  const route = useRoute();
  const { userId } = route.params; // Recibe el UID del usuario

  // Estados
  const [userData, setUserData] = useState(null);
  const [monthlyCheckInCount, setMonthlyCheckInCount] = useState({});
  const [loading, setLoading] = useState(true);

  // Para expandir/colapsar los años en la sección de historial
  const [expandedYear, setExpandedYear] = useState(null);

  // Estado para el RefreshControl
  const [refreshing, setRefreshing] = useState(false);

  // Carga inicial de datos
  useEffect(() => {
    loadData();
  }, [userId]);

  /**
   * Encapsulamos la carga de datos en una función para poder llamarla
   * tanto en useEffect como en el Pull to Refresh
   */
  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchUserData(), fetchMonthlyCheckInCount()]);
    setLoading(false);
  };

  /**
   * Al hacer "pull to refresh", actualizamos el estado 'refreshing',
   * volvemos a cargar la data, y luego lo ponemos en false.
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [userId]);

  /**
   * Obtiene la info del usuario desde la colección "users".
   * Se asume que el doc tiene ID == userId.
   */
  const fetchUserData = async () => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserData(userSnap.data());
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
    }
  };

  /**
   * Obtiene los documentos de "attendanceHistory" filtrados por userId,
   * y forma un objeto { "YYYY-MM-01": conteo } para mostrar cuántas asistencias hubo cada mes.
   */
  const fetchMonthlyCheckInCount = useCallback(async () => {
    try {
      const attendanceRef = collection(db, "attendanceHistory");
      const q = query(attendanceRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      const countsByMonth = {};

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const timestamp = data.timestamp?.seconds
          ? new Date(data.timestamp.seconds * 1000)
          : null;

        if (timestamp) {
          // Ejemplo de llave "2023-09-01"
          const monthKey = dayjs(timestamp).format("YYYY-MM-01");
          countsByMonth[monthKey] = (countsByMonth[monthKey] || 0) + 1;
        }
      });

      setMonthlyCheckInCount(countsByMonth);
    } catch (error) {
      console.error("Error al obtener historial del usuario:", error);
    }
  }, [userId]);

  /**
   * Agrupa el objeto monthlyCheckInCount en un objeto así:
   * {
   *   2023: [ { month: "2023-01-01", count: 5 }, { month: "2023-02-01", count: 8 } ],
   *   2024: [ { month: "2024-01-01", count: 2 }, ...]
   * }
   */
  const groupedByYear = Object.keys(monthlyCheckInCount).reduce((acc, month) => {
    const year = dayjs(month).year();
    if (!acc[year]) acc[year] = [];
    acc[year].push({ month, count: monthlyCheckInCount[month] });
    return acc;
  }, {});

  // Expande/colapsa el año
  const toggleYear = (year) => {
    setExpandedYear(expandedYear === year ? null : year);
  };

  // Muestra un indicador si aún estamos cargando (primera carga)
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Si no se encontró el usuario, mensaje
  if (!userData) {
    return (
      <View style={styles.center}>
        <Text>No se encontraron datos del usuario.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      // Aquí añadimos el RefreshControl para el pull-to-refresh
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Info básica del usuario */}
      <Text style={styles.title}>Detalle del Usuario</Text>
      <Text style={styles.text}>Username: {userData.username}</Text>
      <Text style={styles.text}>Nombre: {userData.nombre}</Text>
      <Text style={styles.text}>Apellido: {userData.apellido}</Text>
      <Text style={styles.text}>Email: {userData.email}</Text>
      <Text style={styles.text}>Teléfono: {userData.phone}</Text>
      <Text style={styles.text}>Cinturón: {userData.cinturon}</Text>
      <Text style={styles.text}>Ciudad: {userData.ciudad}</Text>
      <Text style={styles.text}>Provincia: {userData.provincia}</Text>
      <Text style={styles.text}>Peso: {userData.peso}</Text>
      <Text style={styles.text}>Altura: {userData.altura}</Text>
      <Text style={styles.text}>Edad: {userData.edad}</Text>
      <Text style={styles.text}>Género: {userData.genero}</Text>

      {/* Historial de Entrenamientos */}
      <Text style={[styles.title, { marginTop: 20 }]}>
        Historial de Entrenamientos
      </Text>
      {Object.keys(groupedByYear).length > 0 ? (
        // Recorremos cada año
        Object.keys(groupedByYear)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map((year) => (
            <View key={year} style={styles.yearContainer}>
              <TouchableOpacity
                onPress={() => toggleYear(year)}
                style={styles.yearRow}
              >
                <Text style={styles.yearText}>Año {year}</Text>
                <Icon
                  name={expandedYear === year ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#333"
                />
              </TouchableOpacity>
              {/* Si el año está expandido, mostramos sus meses */}
              {expandedYear === year && (
                <View style={styles.monthContainer}>
                  {groupedByYear[year]
                    .sort((a, b) => dayjs(a.month).diff(dayjs(b.month)))
                    .map(({ month, count }) => {
                      // Formateamos el mes en español, con mayúscula inicial
                      const formattedMonth =
                        dayjs(month).format("MMMM").charAt(0).toUpperCase() +
                        dayjs(month).format("MMMM").slice(1);

                      return (
                        <View key={month} style={styles.monthRow}>
                          <Text style={styles.monthText}>{formattedMonth}</Text>
                          <Text style={styles.countText}>{count}</Text>
                        </View>
                      );
                    })}
                </View>
              )}
            </View>
          ))
      ) : (
        <Text style={styles.text}>No hay datos de historial disponibles</Text>
      )}
    </ScrollView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
  // Historial
  yearContainer: {
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  yearRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  yearText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  monthContainer: {
    paddingLeft: 20,
    paddingBottom: 10,
  },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    marginRight: 10,
  },
  monthText: {
    fontSize: 16,
    color: "#333",
  },
  countText: {
    fontSize: 16,
    color: "#888",
  },
});
