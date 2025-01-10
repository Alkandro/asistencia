// CheckInScreen.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Alert,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  TouchableWithoutFeedback,
  Modal,
  Dimensions,
  FlatList,
} from "react-native";
import { recordCheckIn } from "./Attendance";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { auth, db } from "./firebase";
import ButtonGradient from "./ButtonGradient";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import dayjs from "dayjs";
import { Card, Paragraph } from "react-native-paper"; // Importa Paragraph
import StarRating from "react-native-star-rating-widget"; // Importa StarRating

const CheckInScreen = () => {
  const [monthlyCheckIns, setMonthlyCheckIns] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [latestMessage, setLatestMessage] = useState(null); // Último mensaje
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal de la imagen
  const [ratings, setRatings] = useState([]); // Historial de puntuaciones
  const [averageRating, setAverageRating] = useState(null); // Promedio de puntuaciones
  const [expandedYear, setExpandedYear] = useState(null); // Años expandidos (si usas historial mensual)
  const navigation = useNavigation();

  // Obtener dimensiones para ajustar tamaño de las Cards
  const windowWidth = Dimensions.get("window").width;
  const cardWidth = windowWidth * 0.95; // 95% del ancho de la pantalla
  const modalCardWidth = windowWidth * 0.9; // 90% del ancho de la pantalla

  // ====== Función para redondear a múltiplos de 0.5 ======
  const getHalfStarRating = (ratingStr) => {
    if (!ratingStr) return 0;               // Si no hay rating, retorna 0
    const parsed = parseFloat(ratingStr);   // Convierte string a float
    if (isNaN(parsed)) return 0;            // Si no es número, retorna 0
    // Redondea a 0.5 más cercano
    return Math.round(parsed * 2) / 2;
  };

  // 1) Suscripción a la colección "messages" para obtener el último mensaje
  useEffect(() => {
    const messagesRef = collection(db, "messages");
    // Ordena por createdAt descendente y toma 1
    const q = query(messagesRef, orderBy("createdAt", "desc"), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setLatestMessage(docSnap.data());
      } else {
        // No hay mensajes todavía
        setLatestMessage(null);
      }
    });

    return () => unsubscribe(); // Cancela suscripción al desmontar
  }, []);

  // 2) Obtener cuántos check-ins hay este mes
  const fetchMonthlyCheckIns = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const q = query(
          collection(db, "attendanceHistory"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const currentMonthKey = dayjs().format("YYYY-MM");
        let count = 0;

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const timestamp = data.timestamp?.seconds
            ? new Date(data.timestamp.seconds * 1000)
            : null;
          if (
            timestamp &&
            dayjs(timestamp).format("YYYY-MM") === currentMonthKey
          ) {
            count++;
          }
        });

        setMonthlyCheckIns(count);
      }
    } catch (error) {
      console.error("Error al obtener los check-ins mensuales:", error);
    }
  };

  // 3) Obtener las puntuaciones y calcular el promedio
  const fetchRatings = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const ratingsRef = collection(db, "users", user.uid, "ratings");
        const q = query(ratingsRef, orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const ratingsList = [];
          querySnapshot.forEach((docSnap) => {
            ratingsList.push(docSnap.data());
          });
          setRatings(ratingsList);

          // Calcular promedio
          if (ratingsList.length > 0) {
            const total = ratingsList.reduce(
              (acc, curr) => acc + curr.score,
              0
            );
            const average = (total / ratingsList.length).toFixed(1);
            setAverageRating(average);
          } else {
            setAverageRating(null);
          }
        });
        // Cancelar suscripción al desmontar
        return () => unsubscribe();
      }
    } catch (error) {
      console.error("Error al obtener las puntuaciones:", error);
    }
  }, []);

  // Se ejecuta al montar la pantalla
  useEffect(() => {
    fetchMonthlyCheckIns();
    fetchRatings();
  }, [fetchRatings]);

  // useFocusEffect se ejecuta cada vez que la pantalla gana el foco
  useFocusEffect(
    useCallback(() => {
      fetchMonthlyCheckIns();
      fetchRatings();
    }, [fetchRatings])
  );

  // 4) Botón de Check-In
  const handleCheckIn = async () => {
    if (auth.currentUser) {
      const monthKey = dayjs().format("YYYY-MM");
      const userDocRef = doc(db, "users", auth.currentUser.uid);

      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userName = userData.username || "Usuario";
          const userBelt = userData.cinturon || "desconocida";

          await recordCheckIn();
          await updateDoc(userDocRef, {
            [`checkIns_${monthKey}`]: increment(1),
          });

          const newCheckInCount = monthlyCheckIns + 1;
          setMonthlyCheckIns(newCheckInCount);

          Alert.alert(
            "",
            `Bienvenido al entrenamiento de hoy, ${userName}!\n
            Practica mucho para mejorar tus técnicas en tu cinturón color ${userBelt}.\n
            Check-ins este mes: ${newCheckInCount}`,
            [
              {
                text: "OK",
                onPress: () => fetchMonthlyCheckIns(),
              },
            ]
          );

          navigation.navigate("Historial");
        }
      } catch (error) {
        Alert.alert(
          "Error",
          `No se pudo registrar el check-in: ${error.message}`
        );
      }
    }
  };

  // 5) Refresh para actualizar los datos
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMonthlyCheckIns();
    await fetchRatings();
    setRefreshing(false);
  };

  // 6) Calcular la suma de los dos campos adicionales
  const calculateSum = () => {
    if (
      latestMessage &&
      latestMessage.additionalField1 &&
      latestMessage.additionalField2
    ) {
      const field1 = parseFloat(latestMessage.additionalField1);
      const field2 = parseFloat(latestMessage.additionalField2);
      if (!isNaN(field1) && !isNaN(field2)) {
        return field1 + field2;
      }
    }
    return null;
  };

  // 7) Formatear la fecha
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return dayjs(date).format("DD/MM/YYYY HH:mm");
  };

  // Para expandir años (si tuvieras historial mensual)
  const toggleYear = (year) => {
    setExpandedYear(expandedYear === year ? null : year);
  };

  /**
   * Componente para el encabezado de la lista:
   *   - Info básica (podrías mostrar datos reales del usuario si los tienes)
   *   - Promedio de puntuaciones
   */
  const ListHeader = () => {
    // Redondear a múltiplos de 0.5
    const halfStarRating = getHalfStarRating(averageRating);

    return (
      <View>
        <Text style={styles.title}>Detalle del Usuario</Text>
        <Text style={styles.text}>
          Username: {latestMessage?.username || "No registrado"}
        </Text>
        {/* Añade más campos si es necesario */}

        {/* Mostrar el promedio de puntuaciones */}
        {averageRating && (
          <View style={styles.averageRatingContainer}>
            <Text style={styles.averageRatingText}>
              Promedio de Puntuaciones: {averageRating}/10
            </Text>
            {/* StarRating con valor redondeado */}
            <StarRating
              rating={halfStarRating}
              onChange={() => {}} // Deshabilitado para no modificar
              starCount={10}
              color="#f1c40f"
              starSize={25}
              enableHalfStar={true}
              disable={true}
            />
          </View>
        )}
      </View>
    );
  };

  /**
   * Componente para el pie de la lista:
   *   - Último mensaje, campos adicionales, imagen (Card)
   *   - Mostrar nuevamente las estrellas si quieres
   */
  const ListFooter = () => {
    // Redondear a múltiplos de 0.5 para la segunda visualización
    const halfStarRatingFooter = getHalfStarRating(averageRating);

    return latestMessage ? (
      <View style={styles.messageContainer}>
        <Text style={styles.latestMessage}>
          Último mensaje: {latestMessage.text}
        </Text>

        {/* Mostrar campos adicionales si existen */}
        {latestMessage.additionalField1 && latestMessage.additionalField2 && (
          <View style={styles.additionalFieldsContainer}>
            <Text style={styles.additionalField}>
              Campo Adicional 1: {latestMessage.additionalField1}
            </Text>
            <Text style={styles.additionalField}>
              Campo Adicional 2: {latestMessage.additionalField2}
            </Text>
            <Text style={styles.sumText}>
              Suma de campos adicionales: {calculateSum()}
            </Text>
          </View>
        )}

        {/* Card con imagen si existe */}
        {latestMessage.imageUrl && (
          <TouchableWithoutFeedback onPress={() => setIsModalVisible(true)}>
            <Card style={styles.card}>
              <Card.Cover source={{ uri: latestMessage.imageUrl }} />
            </Card>
          </TouchableWithoutFeedback>
        )}

        {/* Mostrar de nuevo la puntuación debajo del Card (opcional) */}
        {averageRating && (
          <View style={styles.averageRatingContainer}>
            <Text style={styles.averageRatingText}>
              Promedio de Puntuaciones: {averageRating}/10
            </Text>
            <StarRating
              rating={halfStarRatingFooter}
              onChange={() => {}}
              starCount={10}
              color="#f1c40f"
              starSize={25}
              enableHalfStar={true}
              disable={true}
            />
          </View>
        )}
      </View>
    ) : (
      <Text style={styles.latestMessage}>No hay mensajes aún</Text>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <FlatList
          data={ratings}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.ratingItem}>
              <Text style={styles.ratingScore}>⭐ {item.score}/10</Text>
              <Text style={styles.ratingDate}>
                {item.createdAt
                  ? dayjs(item.createdAt.toDate()).format("DD/MM/YYYY HH:mm")
                  : "Sin fecha"}
              </Text>
            </View>
          )}
          ListHeaderComponent={<ListHeader />}
          ListFooterComponent={<ListFooter />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />

        <View style={styles.buttonContainer}>
          <ButtonGradient
            onPress={handleCheckIn}
            title="REGISTRO"
            style={styles.button}
          />
        </View>
      </View>

      {/* Modal para mostrar la imagen con título y contenido */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            {/* Evitar que toques dentro del contenido cierren el modal */}
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                {/* Mostrar la imagen y detalles si existen */}
                {latestMessage?.imageUrl && (
                  <Card style={styles.modalCard}>
                    <Card.Cover source={{ uri: latestMessage.imageUrl }} />
                    <Card.Title
                      title="Detalles del Mensaje"
                      subtitle={`Publicado el ${formatDate(
                        latestMessage.createdAt
                      )}`}
                    />
                    <Card.Content>
                      <Paragraph>{latestMessage.text}</Paragraph>
                      {latestMessage.additionalField1 &&
                        latestMessage.additionalField2 && (
                          <>
                            <Paragraph>
                              Campo Adicional 1:{" "}
                              {latestMessage.additionalField1}
                            </Paragraph>
                            <Paragraph>
                              Campo Adicional 2:{" "}
                              {latestMessage.additionalField2}
                            </Paragraph>
                            <Paragraph>
                              Suma de campos adicionales: {calculateSum()}
                            </Paragraph>
                          </>
                        )}
                    </Card.Content>
                  </Card>
                )}
                <ButtonGradient
                  onPress={() => setIsModalVisible(false)}
                  title="Cerrar"
                  style={styles.closeButton}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default CheckInScreen;

// ========== ESTILOS ==========

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  // Título
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 12,
    marginLeft: 10,
  },
  text: {
    fontSize: 16,
    marginLeft: 10,
    marginBottom: 8,
  },
  // Promedio de puntuaciones
  averageRatingContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  averageRatingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  // Historial de puntuaciones
  ratingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
    paddingHorizontal: 15,
  },
  ratingScore: {
    fontSize: 16,
    color: "#333",
  },
  ratingDate: {
    fontSize: 14,
    color: "#999",
  },
  // Mensajes
  messageContainer: {
    padding: 15,
  },
  latestMessage: {
    fontSize: 16,
    marginBottom: 10,
    color: "#333",
  },
  additionalFieldsContainer: {
    marginBottom: 10,
  },
  additionalField: {
    fontSize: 16,
    marginBottom: 5,
  },
  sumText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  // Card
  card: {
    marginBottom: 10,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 8,
    overflow: "hidden",
    paddingBottom: 10,
  },
  modalCard: {
    margin: 10,
    borderRadius: 10,
    overflow: "hidden",
  },
  closeButton: {
    marginTop: 10,
    alignSelf: "center",
  },
  // Botón
  buttonContainer: {
    padding: 20,
  },
  button: {
    alignSelf: "center",
  },
});
