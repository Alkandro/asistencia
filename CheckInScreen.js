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
  Platform,
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
import StarRating from "react-native-star-rating-widget";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";

/**
 * 1) Orden de cinturones
 */
const BELT_ORDER = ["white", "blue", "purple", "brown", "black"];

/**
 * 2) Retorna el siguiente cinturón en la secuencia.
 * Si ya es "black" (o no está en la lista), retorna "black".
 */
function getNextBelt(currentBelt) {
  const index = BELT_ORDER.indexOf(currentBelt.toLowerCase());
  if (index >= 0 && index < BELT_ORDER.length - 1) {
    return BELT_ORDER[index + 1];
  }
  return "black";
}

const CheckInScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();

  // Intensidades diferentes para Android / iOS (si quieres un blur distinto)
  const tintValue = Platform.OS === "android" ? "light" : "light";
  const intensityValue = Platform.OS === "android" ? 100 : 10;

  // ESTADOS
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

  // ==== Suscripción a "messages" ====
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

  // ==== Obtener check-ins de este mes ====
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

  // ==== Última puntuación ====
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

  // ==== Obtener datos de usuario (cinturón, total entrenos) ====
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

  // ==== useEffect + useFocusEffect ====
  useEffect(() => {
    fetchMonthlyCheckIns();
    fetchLastRating();
    fetchUserData();
  }, [fetchLastRating, fetchUserData]);

  useFocusEffect(
    useCallback(() => {
      fetchMonthlyCheckIns();
      fetchLastRating();
      fetchUserData();
    }, [fetchMonthlyCheckIns, fetchLastRating, fetchUserData])
  );

  // ==== Botón TRAINING con lógica de ascenso a siguiente cinturón al completar 4/4 ====
  const handleCheckIn = async () => {
    if (auth.currentUser) {
      const monthKey = dayjs().format("YYYY-MM");
      const userDocRef = doc(db, "users", auth.currentUser.uid);

      try {
        // Leemos el doc del usuario
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userName = userData.username || "Usuario";
          const userBeltData = userData.cinturon || "white";

          // Registrar el check-in en attendanceHistory
          await recordCheckIn(userData);

          // Actualizar conteo mensual + total
          await updateDoc(userDocRef, {
            [`checkIns_${monthKey}`]: increment(1),
            allTimeCheckIns: increment(1),
          });

          // Actualizamos estado local
          const newCheckInCount = monthlyCheckIns + 1;
          setMonthlyCheckIns(newCheckInCount);

          const newAllTime = allTimeCheckIns + 1;
          setAllTimeCheckIns(newAllTime);

          // Alerta de confirmación
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

          // ===== DETECTAR SI TERMINÓ LOS 4 GRUPOS (4/4) Y CAMBIAR CINTURÓN =====
          const { rawGroup, countInGroup, groupSize } = calculateDanInfo(
            userBeltData,
            newAllTime
          );
          // Si rawGroup = 4 y countInGroup = groupSize => completó el 4° Dan
          if (rawGroup === 4 && countInGroup === groupSize) {
            // Siguiente cinturón
            const nextBelt = getNextBelt(userBeltData);
            // Si no es el mismo (por si ya es black)
            if (nextBelt !== userBeltData.toLowerCase()) {
              // Cambiamos en Firebase el cinturón y reseteamos
              await updateDoc(userDocRef, {
                cinturon: nextBelt,
                allTimeCheckIns: 0, // resetea a 0
              });
              // Actualizamos nuestro estado
              setUserBelt(nextBelt);
              setAllTimeCheckIns(0);

              Alert.alert(
                "¡Cinturón Ascendido!",
                `Has completado los 4 Dans de ${userBeltData}.\n¡Ahora eres cinturón ${nextBelt}!`
              );
            }
          }

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

  // ==== Pull to Refresh ====
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMonthlyCheckIns();
    await fetchLastRating();
    await fetchUserData();
    setRefreshing(false);
  };

  // ==== Helpers para Dan / Progreso ====  
  const calculateDanInfo = (beltColor, totalCheckIns) => {
    const color = beltColor.toLowerCase();
    const total = totalCheckIns || 0;
    const groupSize = color === "white" ? 40 : 60; // 40 para blanco, 60 para los demás
    const maxDan = 4;

    const rawGroup = Math.floor(total / groupSize);
    let currentDan = rawGroup + 1;
    if (currentDan > maxDan) currentDan = maxDan;

    let countInGroup = total % groupSize;
    if (countInGroup === 0 && total > 0) {
      countInGroup = groupSize;
    }

    return { rawGroup, currentDan, groupSize, countInGroup };
  };

  function getDanLabel(danNumber) {
    switch (danNumber) {
      case 1:
        return t("Primer Dan");
      case 2:
        return t("Segundo Dan");
      case 3:
        return t("Tercer Dan");
      case 4:
        return t("Cuarto Dan");
      default:
        return "";
    }
  }

  function getCompletionMessage(rawGroup) {
    switch (rawGroup) {
      case 1:
        return t("¡Felicidades! Completaste el Primer Dan.");
      case 2:
        return t("¡Felicidades! Completaste el Segundo Dan.");
      case 3:
        return t("¡Felicidades! Completaste el Tercer Dan.");
      case 4:
        return t("¡Felicidades! Estás listo para el cambio de cinturón.");
      default:
        return "";
    }
  }

  // ========== ListHeader y ListFooter Ejemplo ==========
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      {latestMessage ? (
        <>
          <Text style={styles.headerTitle}>{t("Mensaje")}</Text>
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

  const ListFooter = () => {
    const halfStarLast = lastRating ? Math.round(lastRating * 2) / 2 : 0;
    const { rawGroup, currentDan, groupSize, countInGroup } = calculateDanInfo(
      userBelt,
      allTimeCheckIns
    );
    const currentDanLabel = getDanLabel(currentDan);
    const beltProgressText = `${countInGroup}/${groupSize} - ${currentDanLabel}`;

    let completionMsg = "";
    if (countInGroup === groupSize) {
      completionMsg = getCompletionMessage(rawGroup);
    }

    return (
      <View style={styles.footerContainer}>
        <Text style={styles.footerTitle}>
          {t("Progreso del cinturón")} ({userBelt})
        </Text>
        <Text style={styles.footerRatingText}>{beltProgressText}</Text>
        {completionMsg ? (
          <Text style={styles.completionMessage}>{completionMsg}</Text>
        ) : null}

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
            {t("Ultima puntuación:")}{" "}
            {lastRatingDate
              ? dayjs(lastRatingDate.toDate()).format("DD/MM/YYYY HH:mm")
              : ""}
          </Text>
        )}

        {customMessage && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.messageTitle}>Mensaje</Text>
            <Text style={styles.customMessageText}>{customMessage}</Text>
          </View>
        )}
      </View>
    );
  };

  // ========== Render principal ==========
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        {/* Contenido principal */}
        <FlatList
          data={[]}
          renderItem={null}
          keyExtractor={(_, index) => index.toString()}
          ListHeaderComponent={<ListHeader />}
          ListFooterComponent={<ListFooter />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        />

        {/* Botón de Check-In */}
        <BlurView
          tint={tintValue}
          intensity={intensityValue}
          style={styles.bottomBar}
        >
          <ButtonGradient
            onPress={handleCheckIn}
            title={t("TRAINING")}
            style={styles.button}
          />
        </BlurView>
      </View>

      {/* Modal para la imagen en grande */}
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
                          ? `Publicado el ${dayjs(
                              latestMessage.createdAt.toDate()
                            ).format("DD/MM/YYYY HH:mm")}`
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

// ========== Estilos ==========
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
  completionMessage: {
    fontSize: 15,
    color: "green",
    fontWeight: "600",
    marginTop: 5,
  },
  customMessageText: {
    fontSize: 16,
    color: "#333",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 1,
    borderRadius: 3,
    borderTopColor: "rgba(255,255,255,0.3)",
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
