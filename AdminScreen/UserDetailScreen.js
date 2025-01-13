import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
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
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase"; // Ajusta la ruta
import { useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";

import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import "dayjs/locale/es";

import StarRating from "react-native-star-rating-widget";
import { SwipeListView } from "react-native-swipe-list-view"; // <--- Importa la librería

dayjs.extend(localeData);
dayjs.locale("es");

export default function UserDetailScreen() {
  const route = useRoute();
  const { userId } = route.params;

  // ====== ESTADOS ======
  const [userData, setUserData] = useState(null);
  const [monthlyCheckInCount, setMonthlyCheckInCount] = useState({});
  const [ratings, setRatings] = useState([]);
  const [score, setScore] = useState(5);
  const [averageRating, setAverageRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Para desplegar/ocultar sections
  const [userDetailExpanded, setUserDetailExpanded] = useState(false);
  const [ratingsHistoryExpanded, setRatingsHistoryExpanded] = useState(false);

  // Para check-ins por año
  const [expandedYear, setExpandedYear] = useState(null);

  // ====== EFECTOS ======
  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUserData(),
      fetchMonthlyCheckInCount(),
      fetchRatings(),
    ]);
    setLoading(false);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [userId]);

  // ====== OBTENER DATOS DE USUARIO ======
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

  // ====== OBTENER CHECK-INS ======
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

  // ====== OBTENER PUNTUACIONES ======
  const fetchRatings = useCallback(async () => {
    try {
      const ratingsRef = collection(db, "users", userId, "ratings");
      const q = query(ratingsRef, orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const ratingsList = [];
          snapshot.forEach((docSnap) => {
            ratingsList.push({ id: docSnap.id, ...docSnap.data() });
          });
          setRatings(ratingsList);

          // Calcular promedio
          if (ratingsList.length > 0) {
            const total = ratingsList.reduce((acc, curr) => acc + curr.score, 0);
            const average = (total / ratingsList.length).toFixed(1);
            setAverageRating(average);

            // Ajustar 'score' a la última puntuación
            setScore(ratingsList[0].score);
          } else {
            setAverageRating(null);
          }
        },
        (error) => {
          console.error("Error al obtener las puntuaciones:", error);
          Alert.alert("Error", "No se pudo obtener las puntuaciones del usuario.");
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error al obtener puntuaciones:", error);
    }
  }, [userId]);

  // ====== ENVIAR PUNTUACIÓN ======
  const handleSubmitRating = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Error", "Debes estar autenticado para enviar una puntuación.");
        return;
      }
      const ratingsRef = collection(db, "users", userId, "ratings");
      await addDoc(ratingsRef, {
        score,
        createdAt: serverTimestamp(),
        ratedBy: currentUser.uid,
      });
      Alert.alert("Éxito", "Puntuación enviada correctamente.");
    } catch (error) {
      console.error("Error al enviar la puntuación: ", error);
      Alert.alert("Error", "No se pudo enviar la puntuación.");
    }
  };

  // ====== ELIMINAR PUNTUACIÓN ======
  const handleDeleteRating = async (ratingId) => {
    try {
      const ratingDocRef = doc(db, "users", userId, "ratings", ratingId);
      await deleteDoc(ratingDocRef);
      // Alert.alert("Eliminar", "Puntuación eliminada correctamente.");
    } catch (error) {
      console.error("Error al eliminar la puntuación:", error);
      Alert.alert("Error", "No se pudo eliminar la puntuación.");
    }
  };

  // ========== Agrupar Check-Ins por año ==========
  const groupedByYear = Object.keys(monthlyCheckInCount).reduce((acc, month) => {
    const year = dayjs(month).year();
    if (!acc[year]) acc[year] = [];
    acc[year].push({ month, count: monthlyCheckInCount[month] });
    return acc;
  }, {});
  const toggleYear = (year) => {
    setExpandedYear(expandedYear === year ? null : year);
  };

  // ========== RENDERIZAR VISTAS DEL SWIPE LIST VIEW ==========

  // 1) Vista frontal
  const renderFrontItem = ({ item }) => (
    <View style={styles.rowFront}>
      <Text style={styles.ratingScore}>⭐ {item.score}/10</Text>
      <Text style={styles.ratingDate}>
        {item.createdAt
          ? dayjs(item.createdAt.toDate()).format("DD/MM/YYYY HH:mm")
          : "Sin fecha"}
      </Text>
    </View>
  );

  // 2) Vista oculta: mostrará el botón "Eliminar" al deslizar a la derecha
  //    Y la dejamos vacía al otro lado (o podríamos poner algo extra si quisieras).
  const renderHiddenItem = ({ item }, rowMap) => {
    return (
      <View style={styles.rowBack}>
        {/* Al lado derecho, el botón "Eliminar" */}
        <TouchableOpacity
          style={styles.backRightBtn}
          onPress={() => {
            // Opcionalmente cierra la fila
            if (rowMap[item.id]) rowMap[item.id].closeRow();
            handleDeleteRating(item.id);
          }}
        >
          <Text style={styles.backTextWhite}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 3) Detectar swipe en dirección opuesta (hacia la **izquierda**) para borrar sin botón
  //    onSwipeValueChange se dispara cada vez que se arrastra; revisamos "direction" y "value"
  //    si "direction" === 'left' y "value" > umbral, borramos.
  const handleSwipeValueChange = (swipeData) => {
    const { key, value, direction } = swipeData;
    // EJEMPLO: si arrastran 70 píxeles o más hacia la izquierda => borrar
    // Nota: Al deslizar a la izquierda, `value` suele ser positivo.
    if (direction === "left" && value > 100) {
      // rowKey === item.id
      handleDeleteRating(key);
    }
  };

  // ========== LOADING ==========
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // ========== SIN USUARIO ==========
  if (!userData) {
    return (
      <View style={styles.center}>
        <Text>No se encontraron datos del usuario.</Text>
      </View>
    );
  }

  // ========== ENCABEZADO DE LA LISTA ==========
  const ListHeader = () => {
    return (
      <View>
        {/* ======== DROPDOWN: DETALLE DEL USUARIO ======== */}
        <TouchableOpacity
          style={styles.dropdownHeader}
          onPress={() => setUserDetailExpanded(!userDetailExpanded)}
        >
          <Text style={styles.dropdownHeaderText}>Detalle del Usuario</Text>
          <Icon
            name={userDetailExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#333"
          />
        </TouchableOpacity>

        {userDetailExpanded && (
          <View style={styles.dropdownContent}>
            <Text style={styles.text}>
              Username: {userData.username || "No registrado"}
            </Text>
            <Text style={styles.text}>
              Nombre: {userData.nombre || "No registrado"}
            </Text>
            <Text style={styles.text}>
              Apellido: {userData.apellido || "No registrado"}
            </Text>
            {/* ... más campos ... */}
          </View>
        )}

        {/* ======== PROMEDIO + RATING + BOTÓN (FIJOS) ======== */}
        <View style={styles.fixedRatingContainer}>
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
              maxStars={10}
              color="#f1c40f"
              starSize={25}
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitRating}
            >
              <Text style={styles.submitButtonText}>Enviar Puntuación</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ======== DROPDOWN: LISTA DE PUNTUACIONES ======== */}
        <TouchableOpacity
          style={styles.dropdownHeader}
          onPress={() => setRatingsHistoryExpanded(!ratingsHistoryExpanded)}
        >
          <Text style={styles.dropdownHeaderText}>Historial de Puntuaciones</Text>
          <Icon
            name={ratingsHistoryExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#333"
          />
        </TouchableOpacity>

        {ratingsHistoryExpanded && ratings.length === 0 && (
          <Text style={[styles.text, { textAlign: "center", marginVertical: 8 }]}>
            No hay puntuaciones aún.
          </Text>
        )}
      </View>
    );
  };

  // ========== RENDER PRINCIPAL ==========
  return (
    <View style={{ flex: 1 }}>
      <SwipeListView
        data={ratingsHistoryExpanded ? ratings : []}
        keyExtractor={(item) => item.id}
        renderItem={renderFrontItem}       // Vista frontal
        renderHiddenItem={renderHiddenItem} // Vista oculta (botón "Eliminar")
        disableLeftSwipe={false}  // Permitimos swipe a la izquierda
        disableRightSwipe={false} // Permitimos swipe a la derecha
        leftOpenValue={400}        // Al arrastrar 70 px a la izquierda, se abriría la parte oculta (no la usamos, pero es necesario un valor)
        rightOpenValue={-100}      // Al arrastrar 70 px a la derecha, aparece el botón "Eliminar"
        onSwipeValueChange={handleSwipeValueChange} // Detectamos arrastre para borrar directo al hacer swipe a la izq
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={<ListHeader />}
        ListFooterComponent={
          Object.keys(groupedByYear).length > 0 ? (
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
                    {expandedYear === year && (
                      <View style={styles.monthContainer}>
                        {groupedByYear[year]
                          .sort((a, b) => dayjs(a.month).diff(dayjs(b.month)))
                          .map(({ month, count }) => {
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
                ))}
            </View>
          ) : (
            <Text style={styles.text}>No hay datos de historial disponibles</Text>
          )
        }
      />
    </View>
  );
}

// ========== ESTILOS ==========
const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownHeader: {
    backgroundColor: "#eaeaea",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    alignItems: "center",
  },
  dropdownHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  dropdownContent: {
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 4,
    color: "#333",
  },
  fixedRatingContainer: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    marginBottom: 10,
  },
  averageContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  averageText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  ratingContainer: {
    alignItems: "center",
  },
  ratingLabel: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: "bold",
  },
  submitButton: {
    marginTop: 10,
    backgroundColor: "#3498db",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Lo que se ve normalmente (frontal)
  rowFront: {
    backgroundColor: "#fff",
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  // Lo que se ve al deslizar (vista oculta)
  rowBack: {
    flex: 1,
    backgroundColor: "red", // color de fondo general
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    // paddingRight: 15, // si quieres añadir espacio
  },
  // Botón de eliminar a la derecha
  backRightBtn: {
    backgroundColor: "red", // <--- Cambia aquí el color
    width: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  backTextWhite: {
    color: "#fff",
    fontWeight: "bold",
  },

  ratingScore: {
    fontSize: 16,
    color: "#333",
  },
  ratingDate: {
    fontSize: 14,
    color: "#999",
  },

  // Historial de Check-Ins
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
