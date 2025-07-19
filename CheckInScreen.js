import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Ionicons } from '@expo/vector-icons';
import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import "dayjs/locale/pt";
import "dayjs/locale/ja";
import "dayjs/locale/en";
import "dayjs/locale/es";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  addDoc,
  serverTimestamp,
  onSnapshot,
  where
} from "firebase/firestore";
import { auth, db } from "./firebase";

dayjs.extend(localeData);

// Mapeo de imágenes de cinturones
const beltImages = {
  white: require("./assets/fotos/whitebelt.png"),
  blue: require("./assets/fotos/bluebelt.png"),
  purple: require("./assets/fotos/purplebelt.png"),
  brown: require("./assets/fotos/brownbelt.png"),
  black: require("./assets/fotos/blackbelt.png"),
};

const getBeltImage = (belt) =>
  beltImages[belt?.toLowerCase()] || beltImages["white"];

// Orden de cinturones CORRECTO
const BELT_ORDER = ["white", "blue", "purple", "brown", "black"];

// Función para obtener el siguiente cinturón
function getNextBelt(currentBelt) {
  const index = BELT_ORDER.indexOf(currentBelt.toLowerCase());
  if (index >= 0 && index < BELT_ORDER.length - 1) {
    return BELT_ORDER[index + 1];
  }
  return "black"; // Si ya es negro, se mantiene
}

const CheckInScreen = ({ navigation, monthlyCheckInCount, fetchMonthlyCheckInCount }) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language || "es";
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [userImageUri, setUserImageUri] = useState(null);
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [userBelt, setUserBelt] = useState("white");
  const [allTimeCheckIns, setAllTimeCheckIns] = useState(0);
  const [monthlyCheckIns, setMonthlyCheckIns] = useState(0);
  const [latestMessage, setLatestMessage] = useState(null);

  // Función para verificar si han pasado 6 horas desde el último entrenamiento
  const checkLastTrainingTime = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return true; // Si no hay usuario, permitir

      // Buscar el último entrenamiento del usuario
      const q = query(
        collection(db, "attendance"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return true; // No hay entrenamientos previos, permitir
      }

      const lastTraining = querySnapshot.docs[0].data();
      const lastTimestamp = lastTraining.timestamp?.toDate();
      
      if (!lastTimestamp) {
        return true; // Si no hay timestamp válido, permitir
      }

      const now = new Date();
      const hoursDifference = (now - lastTimestamp) / (1000 * 60 * 60); // Diferencia en horas

      console.log("Último entrenamiento:", lastTimestamp);
      console.log("Diferencia en horas:", hoursDifference);

      return hoursDifference >= 6; // Permitir solo si han pasado 6 horas o más
    } catch (error) {
      console.error("Error al verificar último entrenamiento:", error);
      return true; // En caso de error, permitir el entrenamiento
    }
  };

  // Función para cargar datos del usuario
  const loadUserData = async () => {
    try {
      // Cargar imagen desde AsyncStorage
      const imageUri = await AsyncStorage.getItem("userImageUri");
      setUserImageUri(imageUri);

      // Obtener datos del usuario desde Firebase
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username || "Usuario");
          setFirstName(data.nombre || data.username || "Usuario");
          setUserBelt(data.cinturon || "white");
          setAllTimeCheckIns(data.allTimeCheckIns || 0);
        }
      }
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error);
    }
  };

  // Suscripción a mensajes usando la estructura ORIGINAL
  useEffect(() => {
    console.log("🔍 Configurando suscripción a mensajes..."); // Debug
    
    const messagesRef = collection(db, "messages");
    // USAR LA ESTRUCTURA ORIGINAL: orderBy "createdAt" y limit 1
    const q = query(messagesRef, orderBy("createdAt", "desc"), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("📊 Snapshot recibido, docs:", snapshot.size); // Debug
      
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const messageData = docSnap.data();
        console.log("📄 Mensaje encontrado:", messageData); // Debug
        setLatestMessage(messageData);
      } else {
        console.log("⚠️ No se encontraron mensajes"); // Debug
        setLatestMessage(null);
      }
    }, (error) => {
      console.error("❌ Error en suscripción a mensajes:", error); // Debug
      setLatestMessage(null);
    });

    return () => {
      console.log("🔄 Limpiando suscripción a mensajes"); // Debug
      unsubscribe();
    };
  }, []);

  // Función para calcular entrenamientos del mes SINCRONIZADA
  const calculateMonthlyCheckIns = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const monthlyData = data.monthlyCheckInCount || {};
          const currentMonthKey = dayjs().format("YYYY-MM");
          const monthCount = monthlyData[currentMonthKey] || 0;
          
          console.log("Datos mensuales:", monthlyData); // Debug
          console.log("Mes actual:", currentMonthKey); // Debug
          console.log("Entrenamientos este mes:", monthCount); // Debug
          
          setMonthlyCheckIns(monthCount);
          
          // Actualizar también el prop si existe
          if (fetchMonthlyCheckInCount) {
            await fetchMonthlyCheckInCount();
          }
        }
      }
    } catch (error) {
      console.error("Error al calcular entrenamientos mensuales:", error);
    }
  };

  // Función de refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadUserData(),
      calculateMonthlyCheckIns(),
    ]);
    setRefreshing(false);
  }, []);

  // Cargar datos al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        await handleRefresh();
        setLoading(false);
      };
      loadData();
    }, [handleRefresh])
  );

  // Cambiar idioma de dayjs
  useEffect(() => {
    dayjs.locale(currentLanguage);
  }, [currentLanguage]);

  // Función para registrar entrenamiento CON VALIDACIÓN DE 6 HORAS
  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      
      const user = auth.currentUser;
      if (!user) {
        Alert.alert(t("Error"), t("Usuario no autenticado"));
        return;
      }

      // VALIDACIÓN DE 6 HORAS
      const canTrain = await checkLastTrainingTime();
      if (!canTrain) {
        Alert.alert(
          t("Entrenamiento no permitido"),
          t("Debes esperar al menos 6 horas desde tu último entrenamiento para registrar uno nuevo."),
          [{ text: t("Entendido") }]
        );
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        Alert.alert(t("Error"), t("Usuario no encontrado"));
        return;
      }

      const userData = userDoc.data();
      const currentMonthKey = dayjs().format("YYYY-MM");
      const monthlyData = userData.monthlyCheckInCount || {};
      
      // Actualizar contadores
      const newAllTimeCheckIns = (userData.allTimeCheckIns || 0) + 1;
      const newMonthlyCount = (monthlyData[currentMonthKey] || 0) + 1;
      
      monthlyData[currentMonthKey] = newMonthlyCount;

      // LÓGICA DE CINTURONES CORREGIDA
      const currentBelt = userData.cinturon || "white";
      const { shouldPromote, nextBelt, completedDan } = checkBeltPromotion(currentBelt, newAllTimeCheckIns);

      let updateData = {
        allTimeCheckIns: newAllTimeCheckIns,
        monthlyCheckInCount: monthlyData,
        lastCheckIn: dayjs().toISOString(),
      };

      // Si debe ser promovido
      if (shouldPromote && nextBelt !== currentBelt) {
        updateData.cinturon = nextBelt;
        updateData.allTimeCheckIns = 0; // RESETEAR CONTADOR AL CAMBIAR CINTURÓN
        
        // Actualizar estado local
        setUserBelt(nextBelt);
        setAllTimeCheckIns(0); // RESETEAR ESTADO LOCAL
        
        console.log(`🎉 Promoción: ${currentBelt} → ${nextBelt}`); // Debug
      } else {
        // Actualizar estado local normalmente
        setAllTimeCheckIns(newAllTimeCheckIns);
      }

      // Actualizar en Firebase
      await updateDoc(userDocRef, updateData);

      // Registrar en historial de asistencia
      await addDoc(collection(db, "attendance"), {
        userId: user.uid,
        username: userData.username || "Usuario",
        timestamp: serverTimestamp(),
        date: dayjs().format("YYYY-MM-DD"),
        time: dayjs().format("HH:mm"),
        status: "completed"
      });

      // TAMBIÉN registrar en attendanceHistory para mantener compatibilidad
      await addDoc(collection(db, "attendanceHistory"), {
        userId: user.uid,
        username: userData.username || "Usuario",
        timestamp: serverTimestamp(),
        date: dayjs().format("YYYY-MM-DD"),
        time: dayjs().format("HH:mm"),
        status: "completed"
      });

      // Actualizar estado local de entrenamientos mensuales
      setMonthlyCheckIns(newMonthlyCount);

      // Actualizar también el contexto global si existe
      if (fetchMonthlyCheckInCount) {
        await fetchMonthlyCheckInCount();
      }

      // Mostrar mensaje apropiado
      if (shouldPromote && nextBelt !== currentBelt) {
        const beltNames = {
          blue: "Azul",
          purple: "Violeta", 
          brown: "Marrón",
          black: "Negro"
        };
        
        Alert.alert(
          t("¡Felicitaciones!"),
          t("Has completado el entrenamiento y pasas al cinturón {{nextBelt}}", {
            nextBelt: beltNames[nextBelt] || nextBelt
          }),
          [{ text: t("¡Genial!") }]
        );
      } else if (completedDan) {
        Alert.alert(
          t("¡Felicitaciones!"),
          t("Has completado el {{danNumber}}° Dan", { danNumber: completedDan }),
          [{ text: t("¡Excelente!") }]
        );
      } else {
        Alert.alert(
          t("¡Entrenamiento registrado!"),
          t("Tu progreso ha sido actualizado"),
          [{ text: t("OK") }]
        );
      }
    } catch (error) {
      console.error("Error al registrar entrenamiento:", error);
      Alert.alert(t("Error"), t("No se pudo registrar el entrenamiento"));
    } finally {
      setCheckingIn(false);
    }
  };

  // Función para verificar promoción de cinturón CORREGIDA
  const checkBeltPromotion = (currentBelt, totalCheckIns) => {
    const belt = currentBelt.toLowerCase();
    
    // LÓGICA CORRECTA:
    // Blanco: 4 series de 40 = 160 total → Azul
    // Azul/Violeta/Marrón: 4 series de 60 = 240 total → Siguiente
    
    let requiredTotal;
    if (belt === "white") {
      requiredTotal = 4 * 40; // 160
    } else {
      requiredTotal = 4 * 60; // 240
    }
    
    const shouldPromote = totalCheckIns >= requiredTotal;
    const nextBelt = shouldPromote ? getNextBelt(belt) : belt;
    
    // Verificar si completó un Dan (pero no promoción completa)
    let completedDan = null;
    const groupSize = belt === "white" ? 40 : 60;
    const danNumber = Math.floor(totalCheckIns / groupSize);
    
    if (totalCheckIns % groupSize === 0 && totalCheckIns > 0 && danNumber <= 4 && !shouldPromote) {
      completedDan = danNumber;
    }
    
    return { shouldPromote, nextBelt, completedDan };
  };

  // Calcular progreso del cinturón CORREGIDO
  const calculateDanInfo = (beltColor, totalCheckIns) => {
    const color = beltColor?.toLowerCase() || "white";
    const total = totalCheckIns || 0;
    
    // LÓGICA CORRECTA: Blanco = 40, otros = 60
    const groupSize = color === "white" ? 40 : 60;
    const maxDan = 4; // INCLUIR 4° DAN

    const rawGroup = Math.floor(total / groupSize);
    let currentDan = rawGroup + 1;
    if (currentDan > maxDan) currentDan = maxDan;

    let countInGroup = total % groupSize;
    if (countInGroup === 0 && total > 0) {
      countInGroup = groupSize;
    }

    const progress = (countInGroup / groupSize) * 100;

    return { currentDan, groupSize, countInGroup, progress };
  };

  // Función para obtener etiqueta de Dan CORREGIDA
  function getDanLabel(danNumber) {
    switch (danNumber) {
      case 1:
        return t("Primer Dan");
      case 2:
        return t("Segundo Dan");
      case 3:
        return t("Tercer Dan");
      case 4:
        return t("Cuarto Dan"); // AGREGAR 4° DAN
      default:
        return "";
    }
  }

  const { currentDan, groupSize, countInGroup, progress } = calculateDanInfo(userBelt, allTimeCheckIns);
  const currentDanLabel = getDanLabel(currentDan);

  // Usar datos del prop si están disponibles, sino usar estado local
  const displayMonthlyCheckIns = monthlyCheckInCount ? 
    (monthlyCheckInCount[dayjs().format("YYYY-MM")] || 0) : 
    monthlyCheckIns;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>{t("Cargando...")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor="#000000"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Saludo personalizado */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>
            {t("Hola, {{name}}", { name: firstName })}
          </Text>
          <Text style={styles.greetingSubtext}>
            {t("Bienvenido a tu entrenamiento")}
          </Text>
        </View>

        {/* Progreso del cinturón */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>{t("Tu Progreso")}</Text>
              <Text style={styles.progressText}>
                {countInGroup}/{groupSize} - {currentDanLabel}
              </Text>
            </View>
            <Image
              source={getBeltImage(userBelt)}
              style={styles.beltImage}
            />
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
          </View>
        </View>

        {/* Estadísticas del mes SINCRONIZADAS */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{displayMonthlyCheckIns}</Text>
            <Text style={styles.statLabel}>{t("Este mes")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{allTimeCheckIns}</Text>
            <Text style={styles.statLabel}>{t("Total")}</Text>
          </View>
        </View>

        {/* Mensajes usando estructura ORIGINAL */}
        <View style={styles.messagesSection}>
          <Text style={styles.messagesTitle}>{t("Mensajes")}</Text>
          
          {latestMessage ? (
            <View style={styles.messageCard}>
              {/* Mensaje en Portugués */}
              {latestMessage.text && (
                <View style={styles.messageContainer}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageFlag}>🇧🇷</Text>
                    <Text style={styles.messageText}>{latestMessage.text}</Text>
                  </View>
                </View>
              )}
              
              {/* Mensaje en Japonés */}
              {latestMessage.additionalField1 && (
                <View style={styles.messageContainer}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageFlag}>🇯🇵</Text>
                    <Text style={styles.messageText}>{latestMessage.additionalField1}</Text>
                  </View>
                </View>
              )}
              
              {/* Imagen del mensaje */}
              {latestMessage.imageUrl && (
                <Image
                  source={{ uri: latestMessage.imageUrl }}
                  style={styles.messageImage}
                  resizeMode="cover"
                  onError={(error) => console.log("Error cargando imagen:", error)}
                />
              )}
              
              {/* Fecha del mensaje */}
              {latestMessage.createdAt && (
                <Text style={styles.messageDate}>
                  {dayjs(latestMessage.createdAt.toDate()).format("DD/MM/YYYY HH:mm")}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.noMessagesContainer}>
              <Ionicons name="chatbubble-outline" size={48} color="#CCCCCC" />
              <Text style={styles.noMessagesText}>{t("No hay mensajes")}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Botón flotante para entrenar */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleCheckIn}
        disabled={checkingIn}
        activeOpacity={0.8}
      >
        {checkingIn ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="fitness" size={24} color="#FFFFFF" />
            <Text style={styles.floatingButtonText}>{t("ENTRENAR")}</Text>
          </>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 100, // Espacio para el botón flotante
  },
  greetingSection: {
    marginBottom: 30,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  greetingSubtext: {
    fontSize: 16,
    color: "#666666",
  },
  progressSection: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  progressText: {
    fontSize: 16,
    color: "#666666",
  },
  beltImage: {
    width: 60,
    height: 24,
    resizeMode: "contain",
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#000000",
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    minWidth: 35,
  },
  statsSection: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 20,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666666",
  },
  messagesSection: {
    marginBottom: 20,
  },
  messagesTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  messageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  messageFlag: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  messageText: {
    flex: 1,
    fontSize: 16,
    color: "#333333",
    lineHeight: 22,
  },
  messageImage: {
    width: "100%",
    height: 290,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  messageDate: {
    fontSize: 12,
    color: "#999999",
    textAlign: "right",
    fontStyle: "italic",
  },
  noMessagesContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noMessagesText: {
    fontSize: 16,
    color: "#999999",
    marginTop: 12,
  },
  floatingButton: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 40 : 20,
    right: 20,
    backgroundColor: "#000000",
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  floatingButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default CheckInScreen;
