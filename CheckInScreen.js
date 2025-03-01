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
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from "@react-navigation/native";
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

// IMPORTANTE: tu librería de estrellas
import StarRating from "react-native-star-rating-widget";

import { useTranslation } from "react-i18next";

const CheckInScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();

  // Estados
  const [monthlyCheckIns, setMonthlyCheckIns] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [latestMessage, setLatestMessage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [lastRating, setLastRating] = useState(null);
  const [lastRatingDate, setLastRatingDate] = useState(null);
  const [username, setUsername] = useState("");
  const [userBelt, setUserBelt] = useState("white");
  const [allTimeCheckIns, setAllTimeCheckIns] = useState(0);

  // Mensaje personalizado desde otra pantalla
  const { customMessage } = route.params || {};

  // Suscripción a la última "message"
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

  // Obtener última puntuación de estrellas
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

  // Obtener datos de usuario (username, cinturón, total entrenos)
  const fetchUserData = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setUsername(data.username || "Usuario");
        setUserBelt(data.cinturon || "white");
        setAllTimeCheckIns(data.allTimeCheckIns || 0);
      }
    } catch (error) {
      console.error("Error al obtener datos de usuario:", error);
    }
  }, []);

  // Llamados iniciales
  useEffect(() => {
    fetchMonthlyCheckIns();
    fetchLastRating();
    fetchUserData();
  }, [fetchLastRating, fetchUserData]);

  // Al volver a la pantalla
  useFocusEffect(
    useCallback(() => {
      fetchMonthlyCheckIns();
      fetchLastRating();
      fetchUserData();
    }, [fetchMonthlyCheckIns, fetchLastRating, fetchUserData])
  );

  // Función CheckIn
  const handleCheckIn = async () => {
    if (auth.currentUser) {
      const monthKey = dayjs().format("YYYY-MM");
      const userDocRef = doc(db, "users", auth.currentUser.uid);

      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userName = userData.username || "Usuario";
          const userBeltData = userData.cinturon || "white";

          // Registrar en attendanceHistory
          await recordCheckIn(userData);

          // Incrementar mes y total
          await updateDoc(userDocRef, {
            [`checkIns_${monthKey}`]: increment(1),
            allTimeCheckIns: increment(1),
          });

          // Actualizar estado local
          const newCheckInCount = monthlyCheckIns + 1;
          setMonthlyCheckIns(newCheckInCount);
          setAllTimeCheckIns(allTimeCheckIns + 1);

          Alert.alert(
            "",
            t(
              "🎉 Bienvenido, {{userName}}!\n\nMejora tus técnicas en tu cinturón {{userBeltData}}.\n\n🏋️‍♂️ Este mes: {{newCheckInCount}} entrenamientos.",
              {
                userName,
                userBeltData,
                newCheckInCount,
              }
            ),
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

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMonthlyCheckIns();
    await fetchLastRating();
    await fetchUserData();
    setRefreshing(false);
  };

  // Helpers
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return dayjs(date).format("DD/MM/YYYY HH:mm");
  };

  // Redondear rating a 0.5
  const getHalfStarRating = (rating) => {
    if (!rating) return 0;
    const parsed = parseFloat(rating);
    if (isNaN(parsed)) return 0;
    return Math.round(parsed * 2) / 2;
  };

  // Lógica para 4 grupos de 40 (white) o 60 (resto)
  const getBeltProgress = (beltColor, totalCheckIns) => {
    const color = beltColor.toLowerCase();
    const total = totalCheckIns || 0;

    let groupSize = 40;
    if (color !== "white") {
      groupSize = 60;
    }
    const maxGroups = 4;

    let currentGroup = Math.floor(total / groupSize) + 1;
    if (currentGroup > maxGroups) currentGroup = maxGroups;

    let countInGroup = total % groupSize;
    // Para mostrar 40/40 o 60/60 si está exacto
    if (countInGroup === 0 && total > 0 && currentGroup <= maxGroups) {
      countInGroup = groupSize;
    }

    return `${countInGroup}/${groupSize} - ${t("Grupo")} ${currentGroup} ${t(
      "de"
    )} ${maxGroups}`;
  };

  // Encabezado (mensaje)
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      {latestMessage ? (
        <>
          <Text style={styles.headerTitle}>{t("Mensaje")}</Text>
          {/* Textos */}
          {latestMessage.text && (
            <View style={styles.messageContainer}>
              <Text style={styles.messageTitle}>{t("Portugués")}:</Text>
              <Text style={styles.messageText}>{latestMessage.text}</Text>
            </View>
          )}
          {latestMessage.additionalField1 && (
            <View style={styles.messageContainer}>
              <Text style={styles.messageTitle}>{t("Japonés")}:</Text>
              <Text style={styles.messageText}>
                {latestMessage.additionalField1}
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
        <Text style={styles.headerMessage}>{t("No hay mensajes aún")}</Text>
      )}
    </View>
  );

  // Pie de la lista
  const ListFooter = () => {
    const halfStarLast = getHalfStarRating(lastRating);
    const beltProgress = getBeltProgress(userBelt, allTimeCheckIns);

    return (
      <View style={styles.footerContainer}>
        {/* Progreso de cinturón */}
        <Text style={styles.footerTitle}>
          {t("Progreso de cinturón")} ({userBelt})
        </Text>
        <Text style={styles.footerRatingText}>{beltProgress}</Text>

        {/* Sección de última puntuación (StarRating) SIEMPRE visible */}
        <Text style={[styles.footerTitle, { marginTop: 20 }]}>
          {t("Última Puntuación de")} {username}
        </Text>
        {lastRating ? (
          <>
            <Text style={styles.footerRatingText}>
              {t("Tu última puntuación:")} {lastRating}/10
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
            {t("Aún no tienes puntuaciones registradas")}
          </Text>
        )}

        {lastRatingDate && (
          <Text style={[styles.footerRatingText, { marginTop: 15, fontSize: 12 }]}>
            {t("Ultima puntuación:")} {formatDate(lastRatingDate)}
          </Text>
        )}

        {/* Mensaje personalizado (opcional) */}
        {customMessage && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.messageTitle}>Mensaje</Text>
            <Text style={styles.customMessageText}>{customMessage}</Text>
          </View>
        )}
      </View>
    );
  };

  // Render principal
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

        {/* Botón Check-In */}
        <View style={styles.buttonContainer}>
          <ButtonGradient
            onPress={handleCheckIn}
            title={t("TRAINING")}
            style={styles.button}
          />
        </View>
      </View>

      {/* Modal de imagen en grande */}
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
                      title={t("Detalles del Mensaje")}
                      subtitle={
                        latestMessage.createdAt
                          ? `Publicado el ${formatDate(
                              latestMessage.createdAt
                            )}`
                          : "Sin fecha"
                      }
                    />
                    <Card.Content>
                      <Paragraph style={{ textAlign: "center" }}>
                        {t("Portugues")}: {latestMessage.text}
                      </Paragraph>
                      {latestMessage.additionalField1 && (
                        <Paragraph>
                          {t("Japonés")}: {latestMessage.additionalField1}
                        </Paragraph>
                      )}
                    </Card.Content>
                  </Card>
                )}
                <ButtonGradient
                  onPress={() => setIsModalVisible(false)}
                  title={t("Cerrar")}
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
  messageContainer: {
    marginBottom: 5,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  messageText: {
    fontSize: 15,
    color: "#333",
    marginLeft: 10,
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
  },
  footerRatingText: {
    fontSize: 16,
    marginBottom: 8,
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
