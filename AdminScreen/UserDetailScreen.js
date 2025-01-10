// UserDetailScreen.js

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
} from "react-native";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase"; // Ajusta la ruta según tu configuración
import { useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import "dayjs/locale/es";
import StarRating from 'react-native-star-rating-widget'; // Importa StarRating

dayjs.extend(localeData);
dayjs.locale("es");

export default function UserDetailScreen() {
  const route = useRoute();
  const { userId } = route.params; // Recibe el UID del usuario

  // Estados
  const [userData, setUserData] = useState(null);
  const [monthlyCheckInCount, setMonthlyCheckInCount] = useState({});
  const [ratings, setRatings] = useState([]); // Historial de puntuaciones
  const [score, setScore] = useState(5); // Valor inicial de la puntuación
  const [averageRating, setAverageRating] = useState(null); // Promedio de puntuaciones
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedYear, setExpandedYear] = useState(null); // Año que se muestra expandido

  // Carga inicial de datos
  useEffect(() => {
    loadData();
  }, [userId]);

  /**
   * Función que carga toda la información necesaria
   */
  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchUserData(), fetchMonthlyCheckInCount(), fetchRatings()]);
    setLoading(false);
  };

  /**
   * Pull to Refresh
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
      } else {
        Alert.alert("Error", "El usuario no existe.");
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
      Alert.alert("Error", "No se pudo obtener los datos del usuario.");
    }
  };

  /**
   * Obtiene los documentos de "attendanceHistory" filtrados por userId,
   * y crea un objeto { "YYYY-MM-01": conteo } para cada mes.
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
      Alert.alert("Error", "No se pudo obtener el historial de entrenamientos.");
    }
  }, [userId]);

  /**
   * Obtiene las puntuaciones del usuario desde la subcolección "ratings"
   */
  const fetchRatings = useCallback(async () => {
    try {
      const ratingsRef = collection(db, "users", userId, "ratings");
      const q = query(ratingsRef, orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const ratingsList = [];
          querySnapshot.forEach((docSnap) => {
            ratingsList.push({ id: docSnap.id, ...docSnap.data() });
          });
          setRatings(ratingsList);

          // Calcular promedio
          if (ratingsList.length > 0) {
            const total = ratingsList.reduce((acc, curr) => acc + curr.score, 0);
            const average = (total / ratingsList.length).toFixed(1);
            setAverageRating(average);
          } else {
            setAverageRating(null);
          }
        },
        (error) => {
          console.error("Error al obtener las puntuaciones: ", error);
          Alert.alert(
            "Error",
            "No se pudo obtener las puntuaciones del usuario."
          );
        }
      );

      // Cancelar suscripción cuando el componente se desmonte
      return () => unsubscribe();
    } catch (error) {
      console.error("Error al obtener puntuaciones:", error);
    }
  }, [userId]);

  /**
   * Agrupa monthlyCheckInCount por año en un objeto de la forma:
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

  /**
   * Envía una nueva puntuación a la subcolección "ratings" del usuario
   */
  const handleSubmitRating = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Error", "Debes estar autenticado para enviar una puntuación.");
        return;
      }

      const ratingsRef = collection(db, "users", userId, "ratings");
      await addDoc(ratingsRef, {
        score: score,
        createdAt: serverTimestamp(),
        ratedBy: currentUser.uid, // Opcional: quién dio la puntuación
      });

      Alert.alert("Éxito", "Puntuación enviada correctamente.");
      setScore(5); // Resetear la puntuación si lo deseas
    } catch (error) {
      console.error("Error al enviar la puntuación: ", error);
      Alert.alert("Error", "No se pudo enviar la puntuación.");
    }
  };

  /**
   * Renderiza cada ítem del historial de puntuaciones
   */
  const renderRatingItem = ({ item }) => (
    <View style={styles.ratingItem}>
      <Text style={styles.ratingScore}>⭐ {item.score}/10</Text>
      <Text style={styles.ratingDate}>
        {item.createdAt
          ? dayjs(item.createdAt.toDate()).format("DD/MM/YYYY HH:mm")
          : "Sin fecha"}
      </Text>
    </View>
  );

  /**
   * Expande o colapsa la vista de un año en el historial
   */
  const toggleYear = (year) => {
    setExpandedYear(expandedYear === year ? null : year);
  };

  /**
   * Renderiza la cabecera de la lista (datos del usuario y rating)
   */
  const ListHeader = () => (
    <View>
      <Text style={styles.title}>Detalle del Usuario</Text>
      <Text style={styles.text}>Username: {userData.username || "No registrado"}</Text>
      <Text style={styles.text}>Nombre: {userData.nombre || "No registrado"}</Text>
      <Text style={styles.text}>Apellido: {userData.apellido || "No registrado"}</Text>
      <Text style={styles.text}>Email: {userData.email || "No registrado"}</Text>
      <Text style={styles.text}>Teléfono: {userData.phone || "No registrado"}</Text>
      <Text style={styles.text}>Cinturón: {userData.cinturon || "No registrado"}</Text>
      <Text style={styles.text}>Ciudad: {userData.ciudad || "No registrado"}</Text>
      <Text style={styles.text}>Provincia: {userData.provincia || "No registrado"}</Text>
      <Text style={styles.text}>Peso: {userData.peso || "No registrado"}</Text>
      <Text style={styles.text}>Altura: {userData.altura || "No registrado"}</Text>
      <Text style={styles.text}>Edad: {userData.edad || "No registrado"}</Text>
      <Text style={styles.text}>Género: {userData.genero || "No registrado"}</Text>

      {averageRating && (
        <View style={styles.averageContainer}>
          <Text style={styles.averageText}>
            Promedio de Puntuaciones: {averageRating}/10
          </Text>
        </View>
      )}

      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>Puntuación:</Text>
        <StarRating
          rating={score}
          onChange={setScore}
          starCount={10}
          color="#f1c40f"
          starSize={30}
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitRating}>
          <Text style={styles.submitButtonText}>Enviar Puntuación</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Historial de Puntuaciones:</Text>
        {ratings.length === 0 ? (
          <Text style={styles.noRatingsText}>No hay puntuaciones aún.</Text>
        ) : null}
      </View>
    </View>
  );

  // Mientras se cargan los datos, mostramos ActivityIndicator
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Si no se encontró el usuario, mostramos un mensaje
  if (!userData) {
    return (
      <View style={styles.center}>
        <Text>No se encontraron datos del usuario.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={ratings}
      keyExtractor={(item) => item.id}
      renderItem={renderRatingItem}
      ListHeaderComponent={<ListHeader />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      }
      // -- AQUÍ VIENE LA MODIFICACIÓN IMPORTANTE --
      ListFooterComponent={
        Object.keys(groupedByYear).length > 0 ? (
          // Envolvemos el resultado del map en un único contenedor
          <View>
            {Object.keys(groupedByYear)
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
                  {/* Si el año está expandido, mostramos los meses */}
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
                              <Text style={styles.monthText}>
                                {formattedMonth}
                              </Text>
                              <Text style={styles.countText}>{count}</Text>
                            </View>
                          );
                        })}
                    </View>
                  )}
                </View>
              ))}
          </View>
        ) : (
          <Text style={styles.text}>No hay datos de historial disponibles</Text>
        )
      }
    />
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
  // Promedio de Puntuaciones
  averageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  averageText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  // Sistema de Puntuación
  ratingContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  submitButton: {
    marginTop: 15,
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Historial de Puntuaciones
  historyContainer: {
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  noRatingsText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
  ratingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  ratingScore: {
    fontSize: 16,
    color: '#333',
  },
  ratingDate: {
    fontSize: 14,
    color: '#999',
  },
  // Historial de Entrenamientos
  yearContainer: {
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    padding: 10,
  },
  yearRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
});
