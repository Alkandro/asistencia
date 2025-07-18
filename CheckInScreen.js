// import React, { useEffect, useState, useCallback } from "react";
// import {
//   View,
//   Text,
//   Alert,
//   StyleSheet,
//   RefreshControl,
//   SafeAreaView,
//   TouchableWithoutFeedback,
//   Modal,
//   Platform,
//   Dimensions,
//   FlatList,
// } from "react-native";
// import { recordCheckIn } from "./Attendance";
// import {
//   useNavigation,
//   useFocusEffect,
//   useRoute,
// } from "@react-navigation/native";
// import { auth, db } from "./firebase";
// import ButtonGradient from "./ButtonGradient";
// import { StyledInput } from "./StyledInput";
// import {
//   doc,
//   getDoc,
//   updateDoc,
//   increment,
//   collection,
//   query,
//   where,
//   getDocs,
//   orderBy,
//   limit,
//   onSnapshot,
// } from "firebase/firestore";
// import dayjs from "dayjs";
// import { Card, Paragraph } from "react-native-paper";
// import StarRating from "react-native-star-rating-widget";
// import { useTranslation } from "react-i18next";
// import { BlurView } from "expo-blur";

// /**
//  * 1) Orden de cinturones
//  */
// const BELT_ORDER = ["white", "blue", "purple", "brown", "black"];

// /**
//  * 2) Retorna el siguiente cinturón en la secuencia.
//  * Si ya es "black" (o no está en la lista), retorna "black".
//  */
// function getNextBelt(currentBelt) {
//   const index = BELT_ORDER.indexOf(currentBelt.toLowerCase());
//   if (index >= 0 && index < BELT_ORDER.length - 1) {
//     return BELT_ORDER[index + 1];
//   }
//   return "black";
// }

// const CheckInScreen = () => {
//   const { t } = useTranslation();
//   const navigation = useNavigation();
//   const route = useRoute();

//   // Intensidades diferentes para Android / iOS (si quieres un blur distinto)
//   const tintValue = Platform.OS === "android" ? "light" : "light";
//   const intensityValue = Platform.OS === "android" ? 0 : 0;

//   // ESTADOS
//   const [monthlyCheckIns, setMonthlyCheckIns] = useState(0);
//   const [refreshing, setRefreshing] = useState(false);
//   const [latestMessage, setLatestMessage] = useState(null);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [lastRating, setLastRating] = useState(null);
//   const [lastRatingDate, setLastRatingDate] = useState(null);
//   const [username, setUsername] = useState("");
//   const [userBelt, setUserBelt] = useState("white");
//   const [allTimeCheckIns, setAllTimeCheckIns] = useState(0);
//   const [lastCheckInTime, setLastCheckInTime] = useState(null);

//   // Mensaje personalizado desde otra pantalla
//   const { customMessage } = route.params || {};

//   // ==== Suscripción a "messages" ====
//   useEffect(() => {
//     const messagesRef = collection(db, "messages");
//     const q = query(messagesRef, orderBy("createdAt", "desc"), limit(1));

//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       if (!snapshot.empty) {
//         const docSnap = snapshot.docs[0];
//         setLatestMessage(docSnap.data());
//       } else {
//         setLatestMessage(null);
//       }
//     });
//     return () => unsubscribe();
//   }, []);

  

//   // ==== Obtener check-ins de este mes ====
//   const fetchMonthlyCheckIns = async () => {
//     try {
//       const user = auth.currentUser;
//       if (user) {
//         const q = query(
//           collection(db, "attendanceHistory"),
//           where("userId", "==", user.uid)
//         );
//         const querySnapshot = await getDocs(q);
//         const currentMonthKey = dayjs().format("YYYY-MM");
//         let count = 0;

//         querySnapshot.forEach((docSnap) => {
//           const data = docSnap.data();
//           const timestamp = data.timestamp?.seconds
//             ? new Date(data.timestamp.seconds * 1000)
//             : null;
//           if (
//             timestamp &&
//             dayjs(timestamp).format("YYYY-MM") === currentMonthKey
//           ) {
//             count++;
//           }
//         });
//         setMonthlyCheckIns(count);
//       }
//     } catch (error) {
//       console.error("Error al obtener los check-ins mensuales:", error);
//     }
//   };

//   // ==== Última puntuación ====
//   const fetchLastRating = useCallback(async () => {
//     try {
//       const user = auth.currentUser;
//       if (user) {
//         const ratingsRef = collection(db, "users", user.uid, "ratings");
//         const q = query(ratingsRef, orderBy("createdAt", "desc"), limit(1));
//         const unsubscribe = onSnapshot(q, (querySnapshot) => {
//           if (!querySnapshot.empty) {
//             const ratingDoc = querySnapshot.docs[0].data();
//             setLastRating(ratingDoc.score);
//             setLastRatingDate(ratingDoc.createdAt || null);
//           } else {
//             setLastRating(null);
//             setLastRatingDate(null);
//           }
//         });
//         return () => unsubscribe();
//       }
//     } catch (error) {
//       console.error("Error al obtener la última puntuación:", error);
//     }
//   }, []);

//   // ==== Obtener datos de usuario (cinturón, total entrenos) ====
//   const fetchUserData = useCallback(async () => {
//     try {
//       const user = auth.currentUser;
//       if (!user) return;

//       const userDocRef = doc(db, "users", user.uid);
//       const userDocSnap = await getDoc(userDocRef);

//       if (userDocSnap.exists()) {
//         const data = userDocSnap.data();
//         setUsername(data.username || "Usuario");
//         setUserBelt(data.cinturon || "white");
//         setAllTimeCheckIns(data.allTimeCheckIns || 0);
//       }
//     } catch (error) {
//       console.error("Error al obtener datos de usuario:", error);
//     }
//   }, []);

//   // ==== useEffect + useFocusEffect ====
//   useEffect(() => {
//     fetchMonthlyCheckIns();
//     fetchLastRating();
//     fetchUserData();
//   }, [fetchLastRating, fetchUserData]);

//   useFocusEffect(
//     useCallback(() => {
//       fetchMonthlyCheckIns();
//       fetchLastRating();
//       fetchUserData();
//     }, [fetchMonthlyCheckIns, fetchLastRating, fetchUserData])
//   );

//   useEffect(() => {
//     const fetchLastCheckIn = async () => {
//       if (auth.currentUser) {
//         const userDocRef = doc(db, "users", auth.currentUser.uid);
//         const userDoc = await getDoc(userDocRef);
//         if (userDoc.exists()) {
//           const data = userDoc.data();
//           if (data.lastCheckIn) {
//             setLastCheckInTime(new Date(data.lastCheckIn.seconds * 1000));
//           }
//         }
//       }
//     };

//     fetchLastCheckIn();
//   }, []);

//   // ==== Botón TRAINING con lógica de ascenso a siguiente cinturón al completar 4/4 ====
//   const handleCheckIn = async () => {
//     // Verifica si ya se realizó un check‑in recientemente
//     if (lastCheckInTime) {
//       const diff = Date.now() - lastCheckInTime.getTime();
//       const sixHours = 0 * 0 * 0 * 1000; // 0 horas  en milisegundos
//       // const sixHours = 6 * 60 * 60* 1000; // 6 horas  en milisegundos
//       if (diff < sixHours) {
//         Alert.alert(
//           t("Espera un momento"),
//           t("Debes esperar al menos 6 horas")
//         );
//         return;
//       }
//     }
//     if (auth.currentUser) {
//       const monthKey = dayjs().format("YYYY-MM");
//       const userDocRef = doc(db, "users", auth.currentUser.uid);

//       try {
//         // Leemos el doc del usuario
//         const userDoc = await getDoc(userDocRef);
//         if (userDoc.exists()) {
//           const userData = userDoc.data();
//           const userName = userData.username || "Usuario";
//           const userBeltData = userData.cinturon || "white";
//           const capitalizedBelt = userBeltData.charAt(0).toUpperCase() + userBeltData.slice(1);

//           // Registrar el check-in en attendanceHistory
//           await recordCheckIn(userData);

//           // Actualizar conteo mensual + total
//           await updateDoc(userDocRef, {
//             [`checkIns_${monthKey}`]: increment(1),
//             newTrainings: increment(1), // Incrementa el contador del badge
//             allTimeCheckIns: increment(1),
//             lastCheckIn: new Date(), // Guardamos el último check‑in
//           });

//           // Actualizar la hora del último check‑in
//           setLastCheckInTime(new Date());

//           // Actualizamos estado local
//           const newCheckInCount = monthlyCheckIns + 1;
//           setMonthlyCheckIns(newCheckInCount);

//           const newAllTime = allTimeCheckIns + 1;
//           setAllTimeCheckIns(newAllTime);

//           // Alerta de confirmación
//           Alert.alert(
//             "",
//             t(
//               "🎉 Bienvenido, {{userName}}!\n\nCinturón color {{userBeltData}}.\n\n🏋️‍♂️ Este mes entrenaste: {{newCheckInCount}} veces.",
//               {
//                 userName,
//                 userBeltData:capitalizedBelt,
//                 newCheckInCount,
//               }
//             ),
//             [
//               {
//                 text: "OK",
//                 onPress: () => fetchMonthlyCheckIns(),
//               },
//             ]
//           );

//           // ===== DETECTAR SI TERMINÓ LOS 4 GRUPOS (4/4) Y CAMBIAR CINTURÓN =====
//           const { rawGroup, countInGroup, groupSize } = calculateDanInfo(
//             userBeltData,
//             newAllTime
//           );
//           // Si rawGroup = 4 y countInGroup = groupSize => completó el 4° Dan
//           if (rawGroup === 4 && countInGroup === groupSize) {
//             // Siguiente cinturón
//             const nextBelt = getNextBelt(userBeltData);
//             // Si no es el mismo (por si ya es black)
//             if (nextBelt !== userBeltData.toLowerCase()) {
//               // Cambiamos en Firebase el cinturón y reseteamos
//               await updateDoc(userDocRef, {
//                 cinturon: nextBelt,
//                 allTimeCheckIns: 0, // resetea a 0
//               });
//               // Actualizamos nuestro estado
//               setUserBelt(nextBelt);
//               setAllTimeCheckIns(0);

//               Alert.alert(
//                 "",
//                 t(
//                   "¡Cinturón Ascendido!\n\nHas completado los 4 Dans de {{userBeltData}}",
//                   {
//                     userBeltData,
//                     nextBelt,
//                   }
//                 )
//               );
//             }
//           }

//           navigation.navigate("Historial");
//         }
//       } catch (error) {
//         Alert.alert(
//           "Error",
//           `No se pudo registrar el check-in: ${error.message}`
//         );
//       }
//     }
//   };

//   // ==== Pull to Refresh ====
//   const onRefresh = async () => {
//     setRefreshing(true);
//     await fetchMonthlyCheckIns();
//     await fetchLastRating();
//     await fetchUserData();
//     setRefreshing(false);
//   };

//   // ==== Helpers para Dan / Progreso ====
//   const calculateDanInfo = (beltColor, totalCheckIns) => {
//     const color = beltColor.toLowerCase();
//     const total = totalCheckIns || 0;
//     const groupSize = color === "white" ? 40 : 60; // 40 para blanco, 60 para los demás
//     const maxDan = 4;

//     const rawGroup = Math.floor(total / groupSize);
//     let currentDan = rawGroup + 1;
//     if (currentDan > maxDan) currentDan = maxDan;

//     let countInGroup = total % groupSize;
//     if (countInGroup === 0 && total > 0) {
//       countInGroup = groupSize;
//     }

//     return { rawGroup, currentDan, groupSize, countInGroup };
//   };

//   function getDanLabel(danNumber) {
//     switch (danNumber) {
//       case 1:
//         return t("Primer Dan");
//       case 2:
//         return t("Segundo Dan");
//       case 3:
//         return t("Tercer Dan");
//       case 4:
//         return t("Cuarto Dan");
//       default:
//         return "";
//     }
//   }

//   function getCompletionMessage(rawGroup) {
//     switch (rawGroup) {
//       case 1:
//         return t("¡Felicidades! Completaste el Primer Dan.");
//       case 2:
//         return t("¡Felicidades! Completaste el Segundo Dan.");
//       case 3:
//         return t("¡Felicidades! Completaste el Tercer Dan.");
//       case 4:
//         return t("¡Felicidades! Estás listo para el cambio de cinturón.");
//       default:
//         return "";
//     }
//   }

//   // ========== ListHeader y ListFooter Ejemplo ==========
//   const ListHeader = () => (
//     <View style={styles.headerContainer}>
//       {latestMessage ? (
//         <>
//           <Text style={styles.headerTitle}>{t("Mensaje")}</Text>
//           {latestMessage.text && (
//             <View style={styles.messageContainer}>
//               <Text style={styles.messageTitle}>{t("Portugués")}:</Text>
//               <Text style={styles.messageText}>{latestMessage.text}</Text>
//             </View>
//           )}
//           {latestMessage.additionalField1 && (
//             <View style={styles.messageContainer}>
//               <Text style={styles.messageTitle}>{t("Japonés")}:</Text>
//               <Text style={styles.messageText}>
//                 {latestMessage.additionalField1}
//               </Text>
//             </View>
//           )}
//           {latestMessage.imageUrl && (
//             <TouchableWithoutFeedback onPress={() => setIsModalVisible(true)}>
//               <Card style={[styles.card, { alignItems: "center" }]}>
//                 <Card.Cover
//                   source={{ uri: latestMessage.imageUrl }}
//                   style={{ width: 350, height: 250, borderRadius: 8 }} // 👈 Ajustá el tamaño a gusto
//                   resizeMode="cover"
//                 />
//               </Card>
//             </TouchableWithoutFeedback>
//           )}
//         </>
//       ) : (
//         <Text style={styles.headerMessage}>{t("No hay mensajes aún")}</Text>
//       )}
//     </View>
//   );

//   const ListFooter = () => {
//     const halfStarLast = lastRating ? Math.round(lastRating * 2) / 2 : 0;
//     const { rawGroup, currentDan, groupSize, countInGroup } = calculateDanInfo(
//       userBelt,
//       allTimeCheckIns
//     );
//     const currentDanLabel = getDanLabel(currentDan);
//     const beltProgressText = `${countInGroup}/${groupSize} - ${currentDanLabel}`;

//     let completionMsg = "";
//     if (countInGroup === groupSize) {
//       completionMsg = getCompletionMessage(rawGroup);
//     }
//     const beltColorMap = {
//       blue: "blue",
//       purple: "#AA60C8",
//       brown: "#8B4513", // por ejemplo
//       black: "black",
//     };

//     return (
//       <View style={styles.footerContainer}>
//         {/* En vez de usar un solo <Text> inline, componemos una vista en horizontal */}
//         <View style={{ flexDirection: "row", alignItems: "center" }}>
//           <Text style={styles.footerTitle}>{t("Progreso del cinturón →")}</Text>

//           {/* Caja para el color/fondo del cinturón */}
//           <View
//             style={{
//               backgroundColor: userBelt === "white" ? "black" : "transparent", // Fondo negro solo si "white"
//               borderRadius: 4,
//               paddingHorizontal: 6,
//               marginLeft: 8,
//             }}
//           >
//             <Text
//               style={{
//                 color:
//                   userBelt === "white"
//                     ? "white"
//                     : beltColorMap[userBelt] || "#333", // El color del texto si NO es blanco
//                 fontSize: 19, // Ajusta al tamaño que quieras
//                 fontWeight: "bold",
//               }}
//             >
//               {userBelt.charAt(0).toUpperCase() + userBelt.slice(1)}
//             </Text>
//           </View>
//         </View>
//         <Text style={styles.footerRatingText}>{beltProgressText}</Text>
//         {completionMsg ? (
//           <Text style={styles.completionMessage}>{completionMsg}</Text>
//         ) : null}

//         {lastRatingDate && (
//           <Text
//             style={[styles.footerRatingText, { marginTop: 15, fontSize: 12 }]}
//           >
//             {t("Ultima puntuación:")}{" "}
//             {lastRatingDate
//               ? dayjs(lastRatingDate.toDate()).format("DD/MM/YYYY HH:mm")
//               : ""}
//           </Text>
//         )}
//       </View>
//     );
//   };

//   // ========== Render principal ==========
//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.container}>
//         {/* Contenido principal */}
//         <FlatList
//           data={[]}
//           renderItem={null}
//           keyExtractor={(_, index) => index.toString()}
//           ListHeaderComponent={<ListHeader />}
//           ListFooterComponent={<ListFooter />}
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//           }
//           contentContainerStyle={{ paddingBottom: 80 }}
//         />

//         {/* Botón de Check-In */}
//         <BlurView
//           tint={tintValue}
//           intensity={intensityValue}
//           style={styles.bottomBar}
//         >
//           <ButtonGradient
//             onPress={handleCheckIn}
//             title={t("TRAINING")}
//             style={styles.button}
//           />
//         </BlurView>
//       </View>

//       {/* Modal para la imagen en grande */}
//       <Modal
//         visible={isModalVisible}
//         transparent={true}
//         animationType="slide"
//         onRequestClose={() => setIsModalVisible(false)}
//       >
//         <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
//           <View style={styles.modalOverlay}>
//             <TouchableWithoutFeedback onPress={() => {}}>
//               <View style={styles.modalContent}>
//                 {latestMessage?.imageUrl && (
//                   <Card style={styles.modalCard}>
//                     <Card.Cover
//                       source={{ uri: latestMessage.imageUrl }}
//                       style={{ width: "100%", height: 350 }} // O el alto que prefieras
//                       resizeMode="cover"
//                     />
//                     <Card.Title
//                       title={t("Detalles del Mensaje")}
//                       subtitle={
//                         latestMessage.createdAt
//                           ? `Publicado el ${dayjs(
//                               latestMessage.createdAt.toDate()
//                             ).format("DD/MM/YYYY HH:mm")}`
//                           : "Sin fecha"
//                       }
//                     />
//                     <Card.Content>
//                       <Paragraph>
//                         {t("Portugues")}: {latestMessage.text}
//                       </Paragraph>
//                       {latestMessage.additionalField1 && (
//                         <Paragraph>
//                           {t("Japonés")}: {latestMessage.additionalField1}
//                         </Paragraph>
//                       )}
//                     </Card.Content>
//                   </Card>
//                 )}
//                 <ButtonGradient
//                   onPress={() => setIsModalVisible(false)}
//                   title={t("Cerrar")}
//                   style={styles.closeButton}
//                 />
//               </View>
//             </TouchableWithoutFeedback>
//           </View>
//         </TouchableWithoutFeedback>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// export default CheckInScreen;

// // ========== Estilos ==========
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   headerContainer: {
//     padding: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: "#ddd",
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 8,
//     textAlign: "center",
//   },
//   headerMessage: {
//     fontSize: 16,
//     marginBottom: 8,
//     color: "#333",
//   },
//   messageContainer: {
//     marginBottom: 5,
//   },
//   messageTitle: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#333",
//   },
//   messageText: {
//     fontSize: 15,
//     color: "#333",
//     marginLeft: 10,
//   },
//   card: {
//     marginVertical: 10,
//   },
//   footerContainer: {
//     padding: 15,
//     borderTopWidth: 1,
//     borderTopColor: "#ddd",
//   },
//   footerTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   footerRatingText: {
//     fontSize: 16,
//     marginBottom: 8,
//     color: "#333",
//   },
//   completionMessage: {
//     fontSize: 15,
//     color: "green",
//     fontWeight: "600",
//     marginTop: 5,
//   },
//   customMessageText: {
//     fontSize: 16,
//     color: "#333",
//   },
//   bottomBar: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     height: 70,
//     width: 390,
//     justifyContent: "center",
//     alignItems: "center",
//     borderTopWidth: 1,
//     borderRadius: 3,
//     borderTopColor: "rgba(255,255,255,0.3)",
//   },
//   button: {
//     alignSelf: "center",
//     fontSize: 13,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   modalContent: {
//     backgroundColor: "#fff",
//     width: "90%",
//     borderRadius: 8,
//     overflow: "hidden",
//     paddingBottom: 10,
//   },
//   modalCard: {
//     margin: 10,
//     borderRadius: 10,
//     overflow: "hidden",
//   },
//   closeButton: {
//     marginTop: 10,
//     alignSelf: "center",
//   },
// });


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
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "./firebase";

dayjs.extend(localeData);

// Mapeo de banderas por idioma
const languageFlags = {
  pt: "🇧🇷",
  ja: "🇯🇵",
  es: "🇪🇸",
  en: "🇺🇸",
};

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
  const [messages, setMessages] = useState([]);

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

  // Función para cargar mensajes MULTIIDIOMA CORREGIDA
  const loadMessages = async () => {
    try {
      const messagesRef = collection(db, "messages");
      const q = query(messagesRef, orderBy("timestamp", "desc"), limit(10));
      const querySnapshot = await getDocs(q);
      
      const messagesList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messagesList.push({
          id: doc.id,
          ...data,
        });
      });
      
      console.log("Mensajes cargados:", messagesList); // Debug
      
      // FILTRAR MENSAJES POR MÚLTIPLES IDIOMAS (japonés y portugués)
      const filteredMessages = messagesList.filter(message => {
        return message.language === 'ja' || message.language === 'pt';
      });
      
      console.log("Mensajes filtrados:", filteredMessages); // Debug
      setMessages(filteredMessages);
    } catch (error) {
      console.error("Error al cargar mensajes:", error);
    }
  };

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
      loadMessages(),
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

  // Función para registrar entrenamiento CORREGIDA
  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      
      const user = auth.currentUser;
      if (!user) {
        Alert.alert(t("Error"), t("Usuario no autenticado"));
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

      // Actualizar en Firebase
      await updateDoc(userDocRef, {
        allTimeCheckIns: newAllTimeCheckIns,
        monthlyCheckInCount: monthlyData,
        lastCheckIn: dayjs().toISOString(),
      });

      // Registrar en historial de asistencia
      await addDoc(collection(db, "attendance"), {
        userId: user.uid,
        username: userData.username || "Usuario",
        timestamp: serverTimestamp(),
        date: dayjs().format("YYYY-MM-DD"),
        time: dayjs().format("HH:mm"),
        status: "completed"
      });

      // Actualizar estado local INMEDIATAMENTE
      setAllTimeCheckIns(newAllTimeCheckIns);
      setMonthlyCheckIns(newMonthlyCount);

      // Actualizar también el contexto global si existe
      if (fetchMonthlyCheckInCount) {
        await fetchMonthlyCheckInCount();
      }

      Alert.alert(
        t("¡Entrenamiento registrado!"),
        t("Tu progreso ha sido actualizado"),
        [{ text: t("OK") }]
      );
    } catch (error) {
      console.error("Error al registrar entrenamiento:", error);
      Alert.alert(t("Error"), t("No se pudo registrar el entrenamiento"));
    } finally {
      setCheckingIn(false);
    }
  };

  // Calcular progreso del cinturón
  const calculateDanInfo = (beltColor, totalCheckIns) => {
    const color = beltColor?.toLowerCase() || "white";
    const total = totalCheckIns || 0;
    const groupSize = color === "white" ? 40 : 60;
    const maxDan = 4;

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

        {/* Mensajes multiidioma RESTAURADOS */}
        <View style={styles.messagesSection}>
          <Text style={styles.messagesTitle}>{t("Mensajes")}</Text>
          {messages.length > 0 ? (
            messages.map((message) => (
              <View key={message.id} style={styles.messageCard}>
                <View style={styles.messageHeader}>
                  <Text style={styles.messageFlag}>
                    {languageFlags[message.language] || "🌐"}
                  </Text>
                  <Text style={styles.messageText}>{message.text}</Text>
                </View>
                {message.imageUrl && (
                  <Image
                    source={{ uri: message.imageUrl }}
                    style={styles.messageImage}
                    resizeMode="cover"
                  />
                )}
              </View>
            ))
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
    marginBottom: 12,
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
    height: 200,
    borderRadius: 8,
    marginTop: 12,
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
    bottom: Platform.OS === "ios" ? 100 : 80,
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


