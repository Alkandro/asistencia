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
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native"; 
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
import StarRating from "react-native-star-rating-widget"; 

const CheckInScreen = () => {
  const [monthlyCheckIns, setMonthlyCheckIns] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Último mensaje (de la colección "messages")
  const [latestMessage, setLatestMessage] = useState(null);

  // Modal de imagen
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Última puntuación del usuario
  const [lastRating, setLastRating] = useState(null);

  // === NUEVO: almacenar el nombre de usuario
  const [username, setUsername] = useState("");

  // Al nivel de otros states
const [lastRatingDate, setLastRatingDate] = useState(null);

  const navigation = useNavigation();

  // Recuperamos mensaje de otras pantallas si existe
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

  // Suscripción a "messages" para obtener el último mensaje
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

  // Obtener los check-ins de este mes
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

  // Obtener la última puntuación
  const fetchLastRating = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const ratingsRef = collection(db, "users", user.uid, "ratings");
        const q = query(ratingsRef, orderBy("createdAt", "desc"), limit(1));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          if (!querySnapshot.empty) {
            const ratingDoc = querySnapshot.docs[0].data();
            setLastRating(ratingDoc.score);
            setLastRatingDate(ratingDoc.createdAt || null); 
            // Asegúrate de que el campo de fecha se llame "createdAt" en tu DB
          } else {
            setLastRating(null);
            setLastRatingDate(null);
          }
        });
        return () => unsubscribe();
      }
    } catch (error) {
      console.error("Error al obtener la última puntuación:", error);
    }
  }, []);

  // === NUEVO: Obtener el nombre de usuario
  const fetchUserName = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setUsername(data.username || "Usuario"); // Ajusta como quieras
      }
    } catch (error) {
      console.error("Error al obtener el nombre de usuario:", error);
    }
  }, []);

  // Al montar
  useEffect(() => {
    fetchMonthlyCheckIns();
    fetchLastRating();
    fetchUserName(); // <-- Llamamos también a fetchUserName()
  }, [fetchLastRating, fetchUserName]);

  // useFocusEffect para recargar cuando la pantalla gana foco
  useFocusEffect(
    useCallback(() => {
      fetchMonthlyCheckIns();
      fetchLastRating();
      fetchUserName();
    }, [fetchLastRating, fetchUserName])
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

          await recordCheckIn(userData);
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
    await fetchUserName();
    setRefreshing(false);
  };

  // Calcular la suma de tres campos adicionales
  const calculateSum = () => {
    if (
      latestMessage &&
      latestMessage.additionalField1 &&
      latestMessage.additionalField2 &&
      latestMessage.additionalField3
    ) {
      const field1 = parseFloat(latestMessage.additionalField1);
      const field2 = parseFloat(latestMessage.additionalField2);
      const field3 = parseFloat(latestMessage.additionalField3);
      if (!isNaN(field1) && !isNaN(field2) && !isNaN(field3)) {
        return field1 + field2 + field3;
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

  // ================= RENDERIZAR ENCABEZADO (último mensaje) =================
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      {latestMessage ? (
        <>
          <Text style={styles.headerTitle}>Mensaje</Text>
          

          {/* Tres campos de idioma */}
          {latestMessage.additionalField1 && latestMessage.additionalField2 && latestMessage.additionalField3 && (
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.headerMessage}>🇧🇷{latestMessage.text}</Text>
              <Text style={styles.text}>
                🇯🇵{latestMessage.additionalField1}
              </Text>
              <Text style={styles.text}>
                🇺🇸{latestMessage.additionalField2}
              </Text>
              <Text style={styles.text}>
                🇪🇸{latestMessage.additionalField3}
              </Text>
            </View>
          )}

          {/* Imagen */}
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

  // ================= PIE DE LISTA (última puntuación + mensaje adicional) =================
  const ListFooter = () => {
    const halfStarLast = getHalfStarRating(lastRating);

    return (
      <View style={styles.footerContainer}>
        {/* AQUÍ MOSTRAMOS EL USERNAME */}
        <Text style={styles.footerTitle}>Última Puntuación de {username}</Text>

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
        
{lastRatingDate && (
  <Text  style={[styles.footerRatingText, {marginTop: 15, fontSize:12}]}>
    Ultima puntuación: {formatDate(lastRatingDate)}
  </Text>
)}

        {/* Mensaje personalizado de otra pantalla */}
        {customMessage && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.messageTitle}>Mensaje</Text>
            <Text style={styles.customMessageText}>{customMessage}</Text>
          </View>
        )}
      </View>
    );
  };

  // ================= RENDER PRINCIPAL =================
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
            title="TRAINING"
            style={styles.button}
          />
        </View>
      </View>

      {/* Modal para mostrar la imagen en grande */}
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
                      <Paragraph>Portugues:{" "} {latestMessage.text}</Paragraph>
                      {latestMessage.additionalField1 &&
                        latestMessage.additionalField2 &&
                        latestMessage.additionalField3 && (
                          <>
                           
                            <Paragraph>
                              Japones:{" "}
                              {latestMessage.additionalField1}
                            </Paragraph>
                            <Paragraph>
                              Ingles:{" "}
                              {latestMessage.additionalField2}
                            </Paragraph>
                            <Paragraph>
                              Español:{" "}
                              {latestMessage.additionalField3}
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
  headerContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
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
  buttonContainer: {
    padding: 20,
  },
  button: {
    alignSelf: "center",
  },
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
