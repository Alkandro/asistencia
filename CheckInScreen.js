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

const CheckInScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();

   // Intensidades diferentes para Android / iOS
   
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

  // ==== 1) Suscripción a "messages" ====
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

  // ==== 2) Obtener check-ins de este mes ====
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

  // ==== 3) Última puntuación ====
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

  // ==== 4) Obtener datos de usuario (cinturón, total entrenos) ====
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

  // ==== 5) Botón TRAINING ====
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

          // Guarda en attendanceHistory
          await recordCheckIn(userData);

          // Incrementar conteo mensual y total
          await updateDoc(userDocRef, {
            [`checkIns_${monthKey}`]: increment(1),
            allTimeCheckIns: increment(1),
          });

          // Actualiza estado local
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

  // ==== 6) Pull to Refresh ====
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMonthlyCheckIns();
    await fetchLastRating();
    await fetchUserData();
    setRefreshing(false);
  };

  // ==== 7) Helpers para Dan / Progreso ====

  /**
   * Devuelve la información de Dan y conteo.
   * Separa la idea de "dan actual" de "dan recién completado".
   */
  const calculateDanInfo = (beltColor, totalCheckIns) => {
    const color = beltColor.toLowerCase();
    const total = totalCheckIns || 0;

    // Determinar si son grupos de 40 (white) o 60 (resto)
    const groupSize = color === "white" ? 40 : 60;
    const maxDan = 4;

    // rawGroup = cuántos grupos completos (0, 1, 2, 3, 4…)
    const rawGroup = Math.floor(total / groupSize); // p.ej 40 entrenos => rawGroup=1
    // currentDan = rawGroup + 1, pero no pasar de 4
    let currentDan = rawGroup + 1;
    if (currentDan > maxDan) currentDan = maxDan;

    // Conteo dentro de este Dan
    let countInGroup = total % groupSize;
    // Ajustamos para que si total es múltiplo exacto (40, 80…), setee a groupSize
    // y en ese caso rawGroup indica el Dan que se completó.
    if (countInGroup === 0 && total > 0) {
      countInGroup = groupSize;
    }

    return { rawGroup, currentDan, groupSize, countInGroup };
  };

  /**
   * Determina la etiqueta del Dan (1 => "Primer Dan", 2 => "Segundo Dan", etc.)
   */
  const getDanLabel = (danNumber) => {
    switch (danNumber) {
      case 1:
        return "Primer Dan";
      case 2:
        return "Segundo Dan";
      case 3:
        return "Tercer Dan";
      case 4:
        return "Cuarto Dan";
      default:
        return "";
    }
  };

  /**
   * Retorna mensaje de felicitación si el usuario completó un Dan
   * (rawGroup indica cuántos Dan completos lleva).
   */
  const getCompletionMessage = (rawGroup) => {
    // rawGroup = 1 => completado Dan 1
    // rawGroup = 2 => completado Dan 2, etc.
    switch (rawGroup) {
      case 1:
        return "¡Felicidades! Completaste el Primer Dan.";
      case 2:
        return "¡Felicidades! Completaste el Segundo Dan.";
      case 3:
        return "¡Felicidades! Completaste el Tercer Dan.";
      case 4:
        return "¡Felicidades! Estás listo para el cambio de cinturón.";
      default:
        return "";
    }
  };

  // === 8) Encabezado (último mensaje) ===
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

  // === 9) Pie de la lista (progreso + star rating) ===
  const ListFooter = () => {
    const halfStarLast = lastRating ? Math.round(lastRating * 2) / 2 : 0;

    // Calculamos la info
    const { rawGroup, currentDan, groupSize, countInGroup } = calculateDanInfo(
      userBelt,
      allTimeCheckIns
    );
    // "Primer Dan", "Segundo Dan" etc.
    const currentDanLabel = getDanLabel(currentDan);

    // Armamos "17/40 - Segundo Dan"
    const beltProgressText = `${countInGroup}/${groupSize} - ${currentDanLabel}`;

    // Si countInGroup === groupSize => Completó "rawGroup" Dan
    let completionMsg = "";
    if (countInGroup === groupSize) {
      completionMsg = getCompletionMessage(rawGroup);
    }

    return (
      <View style={styles.footerContainer}>
        <Text style={styles.footerTitle}>
          {t("Progreso del cinturón")} ({userBelt})
        </Text>
        {/* EJ: "17/40 - Segundo Dan" */}
        <Text style={styles.footerRatingText}>{beltProgressText}</Text>

        {/* Mensaje si completó un Dan */}
        {completionMsg ? (
          <Text style={styles.completionMessage}>{completionMsg}</Text>
        ) : null}

        {/* Sección de Star Rating */}
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
          <Text
            style={[styles.footerRatingText, { marginTop: 15, fontSize: 12 }]}
          >
            {t("Ultima puntuación:")}{" "}
            {lastRatingDate
              ? dayjs(lastRatingDate.toDate()).format("DD/MM/YYYY HH:mm")
              : ""}
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

  // === RENDER PRINCIPAL ===
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
          contentContainerStyle={{ paddingBottom: 80 }} 
        />

        {/* Botón de Check-In */}
        <BlurView tint={tintValue} intensity={intensityValue} style={styles.bottomBar}>
          <ButtonGradient
            onPress={handleCheckIn}
            title={t("TRAINING")}
            style={styles.button}
          />
        </BlurView>
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

/** ====== ESTILOS ====== */
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
  buttonContainer: {
    padding: 10,
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
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    // Ajusta la altura de la barra
    height: 70,
    // Alineamos el contenido (nuestro botón) al centro
    justifyContent: "center",
    alignItems: "center",
    // Opcional: un borde arriba, color semitransparente
    borderTopWidth:1,
    borderRadius:3,
    borderTopColor: "rgba(255,255,255,0.3)",
  },
});
