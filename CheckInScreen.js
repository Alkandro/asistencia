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
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native"; // <-- Import useRoute
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
import { Card, Paragraph } from "react-native-paper";
import StarRating from "react-native-star-rating-widget"; // Asegúrate de que esté instalado

const CheckInScreen = () => {
  const [monthlyCheckIns, setMonthlyCheckIns] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Último mensaje (de la colección "messages")
  const [latestMessage, setLatestMessage] = useState(null);

  // Modal de imagen
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Última puntuación del usuario
  const [lastRating, setLastRating] = useState(null);

  const navigation = useNavigation();

  // <-- Recuperamos el mensaje individual desde los parámetros (si existe)
  const route = useRoute();
  const { customMessage } = route.params || {};

  // Obtener dimensiones
  const windowWidth = Dimensions.get("window").width;
  const cardWidth = windowWidth * 0.95;
  const modalCardWidth = windowWidth * 0.9;

  // Función para redondear a múltiplos de 0.5
  const getHalfStarRating = (rating) => {
    if (!rating) return 0;
    const parsed = parseFloat(rating);
    if (isNaN(parsed)) return 0;
    return Math.round(parsed * 2) / 2;
  };

  // 1) Suscripción a "messages" para obtener el último mensaje
  useEffect(() => {
    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, orderBy("createdAt", "desc"), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setLatestMessage(docSnap.data());
      } else {
        setLatestMessage(null);
      }
    });

    return () => unsubscribe();
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

  // 3) Obtener solo la última puntuación del usuario
  const fetchLastRating = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const ratingsRef = collection(db, "users", user.uid, "ratings");
        const q = query(ratingsRef, orderBy("createdAt", "desc"), limit(1));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          if (!querySnapshot.empty) {
            const latestRatingDoc = querySnapshot.docs[0].data();
            setLastRating(latestRatingDoc.score);
          } else {
            setLastRating(null);
          }
        });
        return () => unsubscribe();
      }
    } catch (error) {
      console.error("Error al obtener la última puntuación:", error);
    }
  }, []);

  // Al montar
  useEffect(() => {
    fetchMonthlyCheckIns();
    fetchLastRating();
  }, [fetchLastRating]);

  // useFocusEffect para recargar cuando la pantalla gana foco
  useFocusEffect(
    useCallback(() => {
      fetchMonthlyCheckIns();
      fetchLastRating();
    }, [fetchLastRating])
  );

  // Botón de Check-In
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

  // Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMonthlyCheckIns();
    await fetchLastRating();
    setRefreshing(false);
  };

  // Calcular la suma de dos campos adicionales del último mensaje (si existen)
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

  // Formatear fecha
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return dayjs(date).format("DD/MM/YYYY HH:mm");
  };

  // ========== COMPONENTES DE ENCABEZADO Y PIE DE LISTA ==========

  // 1) Encabezado con el último mensaje
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      {latestMessage ? (
        <>
          <Text style={styles.headerTitle}>Último Mensaje</Text>
          <Text style={styles.headerMessage}>{latestMessage.text}</Text>

          {latestMessage.additionalField1 && latestMessage.additionalField2 && (
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.text}>
                Campo Adicional 1: {latestMessage.additionalField1}
              </Text>
              <Text style={styles.text}>
                Campo Adicional 2: {latestMessage.additionalField2}
              </Text>
              <Text style={styles.text}>
                Suma de campos adicionales: {calculateSum()}
              </Text>
            </View>
          )}

          {latestMessage.imageUrl && (
            <TouchableWithoutFeedback onPress={() => setIsModalVisible(true)}>
              <Card style={styles.card}>
                <Card.Cover source={{ uri: latestMessage.imageUrl }} />
              </Card>
            </TouchableWithoutFeedback>
          )}
        </>
      ) : (
        <Text style={styles.headerMessage}>No hay mensajes aún</Text>
      )}
    </View>
  );

  // 2) Pie de lista con la última puntuación
  const ListFooter = () => {
    const halfStarLast = getHalfStarRating(lastRating);

    return (
      <View style={styles.footerContainer}>
        <Text style={styles.footerTitle}>Última Puntuación</Text>
        {lastRating ? (
          <>
            <Text style={styles.footerRatingText}>
              Tu última puntuación: {lastRating}/10
            </Text>
            <StarRating
              rating={halfStarLast}
              onChange={() => {}}
              maxStars={10}
              color="#f1c40f"
              starSize={22}
              enableHalfStar={true}
              disable={true}
            />
          </>
        ) : (
          <Text style={styles.footerRatingText}>
            Aún no tienes puntuaciones registradas
          </Text>
        )}

        {/* ========== AÑADIR EL NUEVO MENSAJE DE OTRA PANTALLA ========== */}
        {customMessage && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.messageTitle}>Mensaje</Text>
            <Text style={styles.customMessageText}>{customMessage}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <FlatList
          data={[]}
          renderItem={null}
          keyExtractor={(_, index) => index.toString()}
          ListHeaderComponent={<ListHeader />}
          ListFooterComponent={<ListFooter />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />

        {/* Botón de Check-In */}
        <View style={styles.buttonContainer}>
          <ButtonGradient
            onPress={handleCheckIn}
            title="REGISTRO"
            style={styles.button}
          />
        </View>
      </View>

      {/* Modal para mostrar la imagen y detalles */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                {latestMessage?.imageUrl && (
                  <Card style={styles.modalCard}>
                    <Card.Cover source={{ uri: latestMessage.imageUrl }} />
                    <Card.Title
                      title="Detalles del Mensaje"
                      subtitle={
                        latestMessage.createdAt
                          ? `Publicado el ${formatDate(latestMessage.createdAt)}`
                          : "Sin fecha"
                      }
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

// ====== ESTILOS ======
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  // Encabezado (último mensaje)
  headerContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  headerMessage: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  text: {
    fontSize: 16,
    marginBottom: 4,
    color: "#333",
  },
  card: {
    marginVertical: 10,
  },
  // Pie de lista (última puntuación)
  footerContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  footerRatingText: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  // Mensaje adicional de otra pantalla
  messageTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  customMessageText: {
    fontSize: 16,
    color: "#333",
  },
  // Botón
  buttonContainer: {
    padding: 20,
  },
  button: {
    alignSelf: "center",
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
});
