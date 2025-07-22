// import React, { useState, useEffect, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   Keyboard,
//   TouchableWithoutFeedback,
//   ActivityIndicator,
//   Platform,
//   TouchableOpacity,
//   RefreshControl,
//   Alert,
//   TextInput,
  
// } from "react-native";
// import {
//   doc,
//   getDoc,
//   updateDoc,
//   collection,
//   query,
//   where,
//   getDocs,
//   addDoc,
//   orderBy,
//   onSnapshot,
//   serverTimestamp,
//   deleteDoc,
// } from "firebase/firestore";
// import { db, auth } from "../firebase";
// import { useRoute } from "@react-navigation/native";
// import Icon from "react-native-vector-icons/Ionicons";
// import { useTranslation } from "react-i18next";

// import dayjs from "dayjs";
// import localeData from "dayjs/plugin/localeData";
// import "dayjs/locale/es";
// import "dayjs/locale/ja";
// import "dayjs/locale/en";
// import "dayjs/locale/pt";


// import { SwipeListView } from "react-native-swipe-list-view";


// // dayjs config
// dayjs.extend(localeData);
// dayjs.locale("es");
// dayjs.locale("ja");
// dayjs.locale("en");
// dayjs.locale("pt");
// // Puedes comentar o dejar dayjs.locale(...) si no necesitas forzar un idioma global

// // ----------------------------------
// // FUNCIONES AUXILIARES
// // ----------------------------------
// function calculateDanInfo(beltColor, totalCheckIns) {
//   const color = beltColor?.toLowerCase() || "white";
//   const groupSize = color === "white" ? 40 : 60;
//   const maxDan = 4;

//   const rawGroup = Math.floor(totalCheckIns / groupSize);
//   let currentDan = rawGroup + 1;
//   if (currentDan > maxDan) currentDan = maxDan;

//   let countInGroup = totalCheckIns % groupSize;
//   if (countInGroup === 0 && totalCheckIns > 0) {
//     countInGroup = groupSize;
//   }

//   return { rawGroup, currentDan, groupSize, countInGroup };
// }

// async function checkDansCompletion(userData, getDanLabel) {
//   if (!userData?.cinturon) return;
//   const currentBelt = userData.cinturon.toLowerCase();

//   // Si existe un lastCinturon y es distinto al cinturón actual, reinicia los dans completados
//   if (userData.lastCinturon && userData.lastCinturon !== currentBelt) {
//     await updateDoc(doc(db, "users", userData.uid), {
//       danCompletes: [],
//       lastCinturon: currentBelt,
//     });
//     userData.danCompletes = [];
//   } else if (!userData.lastCinturon) {
//     // Si no existe, lo establecemos con el cinturón actual
//     await updateDoc(doc(db, "users", userData.uid), {
//       lastCinturon: currentBelt,
//     });
//   }

//   const total = userData.allTimeCheckIns || 0;
//   let danCompletes = userData.danCompletes || [];
//   const { rawGroup, groupSize } = calculateDanInfo(userData.cinturon, total);

//   if (rawGroup >= 1 && rawGroup <= 4) {
//     const found = danCompletes.find((obj) => obj.dan === rawGroup);
//     if (!found) {
//       danCompletes.push({
//         dan: rawGroup,
//         groupSize,
//         count: groupSize,
//         completedOn: new Date(),
//       });
//       await updateDoc(doc(db, "users", userData.uid), { danCompletes });
//       Alert.alert(
//         "¡Dan Completado!",
//         `${getDanLabel(rawGroup)} completado (${groupSize}/${groupSize}) ✓.`
//       );
//     }
//   }
// }

// // ----------------------------------
// // COMPONENTE PRINCIPAL
// // ----------------------------------
// export default function UserDetailScreen() {
//   const route = useRoute();
//   const { userId } = route.params;
//   const { t } = useTranslation();

//   // Estados
//   const [userData, setUserData] = useState(null);
//   const [monthlyCheckInCount, setMonthlyCheckInCount] = useState({});
//   const [ratings, setRatings] = useState([]);
//   const [score, setScore] = useState(0);
//   const [averageRating, setAverageRating] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [ratingsHistoryExpanded, setRatingsHistoryExpanded] = useState(false);
//   const [expandedYear, setExpandedYear] = useState(null);
//   const [manualCheckIns, setManualCheckIns] = useState("");

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

//   // Efectos
//   useEffect(() => {
//     loadData();
//   }, [userId]);

//   const loadData = async () => {
//     setLoading(true);
//     await Promise.all([
//       fetchUserData(),
//       fetchMonthlyCheckInCount(),
//       fetchRatings(),
//     ]);
//     setLoading(false);
//   };

//   const handleRefresh = useCallback(async () => {
//     setRefreshing(true);
//     await loadData();
//     setRefreshing(false);
//   }, [userId]);

//   // ----------------------------------
//   // OBTENER DATOS DEL USUARIO
//   // ----------------------------------
//   const fetchUserData = async () => {
//     try {
//       const userRef = doc(db, "users", userId);
//       const snap = await getDoc(userRef);
//       if (snap.exists()) {
//         const data = snap.data();
//         setUserData({ uid: userId, ...data });

//         // Chequear Dan completado
//         await checkDansCompletion({ uid: userId, ...data }, getDanLabel);

//         // Al cargar, si existe allTimeCheckIns, ponerlo en manualCheckIns
//         if (data.allTimeCheckIns != null) {
//           setManualCheckIns(String(data.allTimeCheckIns));
//         }
//       } else {
//         Alert.alert("Error", "El usuario no existe.");
//       }
//     } catch (error) {
//       console.error("Error al obtener datos usuario:", error);
//       Alert.alert("Error", "No se pudo obtener los datos del usuario.");
//     }
//   };

//   // ----------------------------------
//   // GUARDAR EDICIÓN MANUAL DE ENTRENAMIENTOS
//   // ----------------------------------
//   const handleSaveManual = async () => {
//     if (!userData) return;
//     const newVal = parseInt(manualCheckIns, 10);
//     if (isNaN(newVal)) {
//       Alert.alert("Error", "Por favor ingresa un número válido");
//       return;
//     }
//     try {
//       const userDocRef = doc(db, "users", userData.uid);
//       await updateDoc(userDocRef, {
//         allTimeCheckIns: newVal,
//       });
//       Alert.alert("Éxito", `Entrenamientos ajustados a ${newVal}`);
//       await loadData();
//     } catch (e) {
//       console.error(e);
//       Alert.alert("Error", "No se pudo actualizar");
//     }
//   };

//   // ----------------------------------
//   // OBTENER HISTORIAL CHECK-INS
//   // ----------------------------------
//   const fetchMonthlyCheckInCount = useCallback(async () => {
//     try {
//       const ref = collection(db, "attendanceHistory");
//       const qy = query(ref, where("userId", "==", userId));
//       const qs = await getDocs(qy);

//       const obj = {};
//       qs.forEach((docSnap) => {
//         const d = docSnap.data();
//         const ts = d.timestamp?.seconds
//           ? new Date(d.timestamp.seconds * 1000)
//           : null;
//         if (ts) {
//           const mk = dayjs(ts).format("YYYY-MM-01");
//           obj[mk] = (obj[mk] || 0) + 1;
//         }
//       });
//       setMonthlyCheckInCount(obj);
//     } catch (e) {
//       console.error("Error historial:", e);
//       Alert.alert("Error", "No se pudo obtener el historial.");
//     }
//   }, [userId]);

//   // ----------------------------------
//   // OBTENER LISTA DE PUNTUACIONES
//   // ----------------------------------
//   const fetchRatings = useCallback(async () => {
//     try {
//       const ref = collection(db, "users", userId, "ratings");
//       const qy = query(ref, orderBy("createdAt", "desc"));
//       const unsub = onSnapshot(qy, (snap) => {
//         const arr = [];
//         snap.forEach((dd) => arr.push({ id: dd.id, ...dd.data() }));
//         setRatings(arr);

//         if (arr.length > 0) {
//           const total = arr.reduce((acc, c) => acc + c.score, 0);
//           const avg = (total / arr.length).toFixed(1);
//           setAverageRating(avg);
//           setScore(arr[0].score); // la última puntuación
//         } else {
//           setAverageRating(null);
//         }
//       });
//       return () => unsub();
//     } catch (error) {
//       console.error("Error puntuaciones:", error);
//     }
//   }, [userId]);

//   // ----------------------------------
//   // ENVIAR PUNTUACIÓN
//   // ----------------------------------
//   const handleSubmitRating = async () => {
//     try {
//       const currentUser = auth.currentUser;
//       if (!currentUser) {
//         Alert.alert("Error", "Debes iniciar sesión para puntuar.");
//         return;
//       }
//       const ratingsRef = collection(db, "users", userId, "ratings");
//       await addDoc(ratingsRef, {
//         score,
//         createdAt: serverTimestamp(),
//         ratedBy: currentUser.uid,
//       });
//       Alert.alert("Exito", "Puntuación enviada.");
//     } catch (error) {
//       console.error("Error enviando puntuación:", error);
//       Alert.alert("Error", "No se pudo enviar la puntuación.");
//     }
//   };

//   // ----------------------------------
//   // ELIMINAR PUNTUACIÓN (swipe)
//   // ----------------------------------
//   const handleDeleteRating = async (ratingId) => {
//     try {
//       await deleteDoc(doc(db, "users", userId, "ratings", ratingId));
//     } catch (err) {
//       console.error("Error al eliminar puntuación:", err);
//       Alert.alert("Error", "No se pudo eliminar la puntuación.");
//     }
//   };

//   // ----------------------------------
//   // SWIPE LIST
//   // ----------------------------------
//   const renderFrontItem = ({ item }) => {
//     return (
//       <View style={styles.rowFront}>
//         <Text style={styles.ratingScore}>⭐ {item.score}/10</Text>
//         <Text style={styles.ratingDate}>
//           {item.createdAt
//             ? dayjs(item.createdAt.toDate()).format("DD/MM/YYYY HH:mm")
//             : "Sin fecha"}
//         </Text>
//       </View>
//     );
//   };

//   const renderHiddenItem = ({ item }, rowMap) => {
//     return (
//       <View style={styles.rowBack}>
//         <TouchableOpacity
//           style={styles.backRightBtn}
//           onPress={() => {
//             if (rowMap[item.id]) rowMap[item.id].closeRow();
//             handleDeleteRating(item.id);
//           }}
//         >
//           <Text style={styles.backTextWhite}>Delete</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   };

//   const handleSwipeValueChange = (swipeData) => {
//     const { key, value, direction } = swipeData;
//     if (direction === "left" && value > 100) {
//       handleDeleteRating(key);
//     }
//   };

//   // ----------------------------------
//   // LOADING / VALIDACIÓN
//   // ----------------------------------
//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#0000ff" />
//       </View>
//     );
//   }
//   if (!userData) {
//     return (
//       <View style={styles.center}>
//         <Text>No se encontraron datos del usuario.</Text>
//       </View>
//     );
//   }

//   // ----------------------------------
//   // CALCULAR DAN ACTUAL
//   // ----------------------------------
//   const allTime = userData.allTimeCheckIns || 0;
//   const { rawGroup, currentDan, groupSize, countInGroup } = calculateDanInfo(
//     userData.cinturon,
//     allTime
//   );
//   const danLabel = getDanLabel(currentDan);

//   // ----------------------------------
//   // DAN COMPLETADOS DE ESTE CINTURÓN
//   // ----------------------------------
//   const danCompletes = (userData.danCompletes || []).filter(
//     (dc) => dc.groupSize === groupSize
//   );
//   danCompletes.sort((a, b) => a.dan - b.dan);
//   const danCompletionUI = danCompletes.map((dc) => (
//     <Text key={dc.dan} style={styles.danItem}>
//       {getDanLabel(dc.dan)} completado ({dc.count}/{dc.groupSize}) ✓
//     </Text>
//   ));

//   // Agrupar Check-Ins por año (para el ListFooter)
//   const groupedByYear = Object.keys(monthlyCheckInCount).reduce((acc, mk) => {
//     const yr = dayjs(mk).year();
//     if (!acc[yr]) acc[yr] = [];
//     acc[yr].push({ month: mk, count: monthlyCheckInCount[mk] });
//     return acc;
//   }, {});

//   const toggleYear = (year) => {
//     setExpandedYear(expandedYear === year ? null : year);
//   };

//   // 1. Función para capitalizar
//   function capitalize(str) {
//     if (!str) return "";
//     return str.charAt(0).toUpperCase() + str.slice(1);
//   }

//   // 2. Objeto para mapear el nombre del cinturón a un color
//   const beltColors = {
//     blue: "blue",
//     purple: "#AA60C8",
//     brown: "#8B4513", // por ejemplo
//     black: "black",
//   };

//   // ----------------------------------
//   // RENDER PRINCIPAL
//   // ----------------------------------
//   return (
    
//     <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
//       <View style={{ flex: 1 }}>

//         <View style={{ paddingHorizontal: 10, backgroundColor: "#f8f8f8" }}>
  
//           <View style={styles.dropdownContent}>
//             <Text style={styles.text}>
//             <Text style={{ fontWeight: 'bold' }}>{t("Usuario")}</Text>: {userData.username || "--"}
//             </Text>
//             <Text style={styles.text}>
//             <Text style={{ fontWeight: 'bold' }}>{t("Nombre")}</Text>: {userData.nombre || "--"}
//             </Text>
//             <Text style={styles.text}>
//             <Text style={{ fontWeight: 'bold' }}>{t("Apellido")}</Text>: {userData.apellido || "--"}
//             </Text>
//             <Text style={styles.text}>
//             <Text style={{ fontWeight: 'bold' }}>{t("Correo electonico")}</Text>: {userData.email || "--"}
//             </Text>
//             <Text style={styles.text}>
//             <Text style={{ fontWeight: 'bold' }}> {t("Teléfono")}</Text>: {userData.phone || "--"}
//             </Text>
//             <Text style={styles.text}>
//             <Text style={{ fontWeight: 'bold' }}>{t("Ciudad")}</Text>: {userData.ciudad || "--"}
//             </Text>
//             <Text style={styles.text}>
//             <Text style={{ fontWeight: 'bold' }}>{t("Provincia")}</Text>: {userData.provincia || "--"}
//             </Text>
//             <Text style={styles.text}>
//             <Text style={{ fontWeight: 'bold' }}>{t("Peso")}</Text>: {userData.peso || "--"}
//             </Text>
//             <Text style={styles.text}>
//             <Text style={{ fontWeight: 'bold' }}>{t("Altura")}</Text>: {userData.altura || "--"}
//             </Text>
//             <Text style={styles.text}>
//             <Text style={{ fontWeight: 'bold' }}>{t("Edad")}</Text>: {userData.edad || "--"}
//             </Text>
//             <Text style={styles.text}>
//             <Text style={{ fontWeight: 'bold' }}>{t("Género")}</Text>: {userData.genero || "--"}
//             </Text>
//             <Text style={styles.text}>
//             <Text style={{ fontWeight: 'bold' }}>{t("Cinturón")}</Text>:{" "}
//               <Text
//                 style={{ color: beltColors[userData.cinturon.toLowerCase()] }}
//               >
//                 {capitalize(userData.cinturon)}
//               </Text>
//             </Text>

//             {/* Muestra la cant. actual de entrenos */}
//             <Text style={[styles.text, { marginTop: 8 }]}>
//             <Text style={{ fontWeight: 'bold' }}>{t("Entrenamientos")}</Text>: {allTime}
//             </Text>

//             {/* TextInput para Ajustar entrenamientos manualmente */}
//             <View
//               style={{
//                 flexDirection: "row",
//                 alignItems: "center",
//                 marginTop: 8,
//               }}
//             >
//               <TextInput
//                 style={styles.manualInput}
//                 keyboardType="numeric"
//                 value={manualCheckIns}
//                 onChangeText={setManualCheckIns}
//                 placeholder="Cantidad"
//                 placeholderTextColor="#aaa"
//               />
//               <TouchableOpacity
//                 style={styles.adjustButton}
//                 onPress={handleSaveManual}
//               >
//                 <Text style={styles.adjustButtonText}>{t("Ajustar")}</Text>
//               </TouchableOpacity>
//             </View>

//             {/* Dan actual */}
//             <Text style={[styles.text, { marginTop: 8, fontWeight: "bold" }]}>
//               {t("Dan actual")}: {danLabel}
//             </Text>
//             <Text style={[styles.text, { marginBottom: 10 }]}>
//               {countInGroup}/{groupSize} {t("entrenamientos")}
//             </Text>

//             {/* Dans completados en ESTE cinturón */}
//             {danCompletes.length > 0 && (
//               <>
//                 <Text
//                   style={[styles.text, { fontWeight: "bold", marginTop: 8 }]}
//                 >
//                   {t("Dans Completados del Cinturon")}{" "}
//                   <Text
//                     style={{
//                       color: beltColors[userData.cinturon.toLowerCase()],
//                     }}
//                   >
//                     {capitalize(userData.cinturon)}
//                   </Text>
//                 </Text>
//                 <View style={styles.dansContainer}>{danCompletionUI}</View>
//               </>
//             )}
//           </View>
//         </View>

//         <SwipeListView
//           // Para que no se cierre el teclado al tocar dentro de la lista:
//           keyboardShouldPersistTaps="handled"
//           data={ratingsHistoryExpanded ? ratings : []}
//           keyExtractor={(item) => item.id}
//           renderItem={renderFrontItem}
//           renderHiddenItem={renderHiddenItem}
//           disableLeftSwipe={false}
//           disableRightSwipe={false}
//           leftOpenValue={400}
//           rightOpenValue={-100}
//           onSwipeValueChange={handleSwipeValueChange}
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
//           }
//           // SIN ListHeaderComponent, pues movimos todo el contenido afuera
//           ListFooterComponent={
//             Object.keys(groupedByYear).length > 0 ? (
//               <View>
//                 {Object.keys(groupedByYear)
//                   .sort((a, b) => parseInt(a) - parseInt(b))
//                   .map((year) => (
//                     <View key={year} style={styles.yearContainer}>
//                       <TouchableOpacity
//                         onPress={() => toggleYear(year)}
//                         style={styles.yearRow}
//                       >
//                         <Text style={styles.yearText}>
//                           {t("Año")} {year}
//                         </Text>
//                         <Icon
//                           name={
//                             expandedYear === year
//                               ? "chevron-up"
//                               : "chevron-down"
//                           }
//                           size={20}
//                           color="#333"
//                         />
//                       </TouchableOpacity>

//                       {expandedYear === year && (
//                         <View style={styles.monthContainer}>
//                           {groupedByYear[year]
//                             .sort((a, b) => dayjs(a.month).diff(dayjs(b.month)))
//                             .map(({ month, count }) => {
//                               const formattedMonth =
//                                 dayjs(month).format("MMMM");
//                               const firstCap =
//                                 formattedMonth.charAt(0).toUpperCase() +
//                                 formattedMonth.slice(1);
//                               return (
//                                 <View key={month} style={styles.monthRow}>
//                                   <Text style={styles.monthText}>
//                                     {firstCap}
//                                   </Text>
//                                   <Text style={styles.countText}>{count}</Text>
//                                 </View>
//                               );
//                             })}
//                         </View>
//                       )}
//                     </View>
//                   ))}
//               </View>
//             ) : (
//               <Text style={styles.text}>
//                 {t("No hay datos de historial disponibles")}
//               </Text>
//             )
//           }
//         />
//       </View>
//     </TouchableWithoutFeedback>
   
//   );
// }

// // ----------------------------------
// // ESTILOS
// // ----------------------------------
// const styles = StyleSheet.create({
//   center: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   dropdownHeader: {
//     backgroundColor: "#eaeaea",
//     flexDirection: "row",
//     justifyContent: "space-between",
//     padding: 12,
//     alignItems: "center",
//   },
//   dropdownHeaderText: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#333",
//   },
//   dropdownContent: {
//     backgroundColor: "#f8f8f8",
//     paddingHorizontal: 15,
//     paddingVertical: 10,
//     marginBottom: 10,
//   },
//   text: {
//     fontSize: 16,
//     marginBottom: Platform.select({ android: 0.5, ios: 4 }),
//     color: "#333",
//   },
//   fixedRatingContainer: {
//     backgroundColor: "#f9f9f9",
//     padding: 15,
//     marginBottom: 10,
//   },
//   averageContainer: {
//     alignItems: "center",
//     marginBottom: 5,
//   },
//   averageText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#333",
//   }, 
//   ratingContainer: {
//     alignItems: "center",
//   },
//   ratingLabel: {
//     fontSize: 16,
//     marginBottom: 5,
//     fontWeight: "bold",
//   },
//   submitButton: {
//     marginTop: 10,
//     backgroundColor: "#3498db",
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 20,
//   },
//   submitButtonText: {
//     color: "#fff",
//     fontSize: 14,
//     fontWeight: "bold",
//   },
//   rowFront: {
//     backgroundColor: "#fff",
//     borderBottomColor: "#eee",
//     borderBottomWidth: 1,
//     paddingHorizontal: 12,
//     paddingVertical: 14,
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   rowBack: {
//     flex: 1,
//     backgroundColor: "red",
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "flex-end",
//   },
//   backRightBtn: {
//     backgroundColor: "red",
//     width: 80,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   backTextWhite: {
//     color: "#fff",
//     fontWeight: "bold",
//   },
//   ratingScore: {
//     fontSize: 16,
//     color: "#333",
//   },
//   ratingDate: {
//     fontSize: 14,
//     color: "#999",
//   },
//   yearContainer: {
//     marginBottom: 8,
//     backgroundColor: "#f0f0f0",
//     borderRadius: 5,
//     padding: 10,
//   },
//   yearRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   yearText: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#333",
//   },
//   monthContainer: {
//     paddingLeft: 20,
//     paddingTop: 10,
//   },
//   monthRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingVertical: 5,
//   },
//   monthText: {
//     fontSize: 16,
//     color: "#333",
//   },
//   countText: {
//     fontSize: 16,
//     color: "#888",
//   },
//   dansContainer: {
//     marginVertical: 10,
//     marginBottom: Platform.select({ android: -20, ios: 4 }),
//   },
//   danItem: {
//     fontSize: 15,
//     marginBottom: 2,
//     color: "#333",
//   },
//   manualInput: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     marginRight: 10,
//     color: "#000",
//   },
//   adjustButton: {
//     backgroundColor: "#2ecc71",
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//     borderRadius: 8,
//   },
//   adjustButtonText: {
//     color: "#fff",
//     fontWeight: "bold",
//   },
  
// });


import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from "react-native";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useRoute, useNavigation } from "@react-navigation/native";
import { db } from "../firebase";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { 
  AdminCard, 
  AdminButton, 
  AdminHeader,
  AdminInput,
  AdminDivider,
  AdminLoadingOverlay 
} from "./AdminComponents";

const UserDetailScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [monthlyData, setMonthlyData] = useState({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [newTrainingCount, setNewTrainingCount] = useState("");

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Obtener datos del usuario
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({ id: userDoc.id, ...userData });
        setNewTrainingCount(String(userData.allTimeCheckIns || 0));
        
        // Obtener datos mensuales de entrenamientos
        await fetchMonthlyData(userData);
      } else {
        Alert.alert("Error", "Usuario no encontrado");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
      Alert.alert("Error", "No se pudieron cargar los datos del usuario");
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyData = async (userData) => {
    try {
      // Obtener historial de entrenamientos
      const attendanceQuery = query(
        collection(db, "attendanceHistory"),
        where("userId", "==", userId)
      );
      
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const monthlyCount = {};
      
      attendanceSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.timestamp) {
          const date = data.timestamp.toDate();
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1;
        }
      });

      // Combinar con datos mensuales del usuario si existen
      const userMonthlyData = userData.monthlyCheckInCount || {};
      const combinedData = { ...monthlyCount, ...userMonthlyData };
      
      setMonthlyData(combinedData);
    } catch (error) {
      console.error("Error al obtener datos mensuales:", error);
    }
  };

  const handleUpdateTrainings = async () => {
    if (!newTrainingCount.trim()) {
      Alert.alert("Error", "Por favor ingresa un número válido");
      return;
    }

    const count = parseInt(newTrainingCount);
    if (isNaN(count) || count < 0) {
      Alert.alert("Error", "Por favor ingresa un número válido mayor o igual a 0");
      return;
    }

    Alert.alert(
      "Confirmar actualización",
      `¿Estás seguro de que quieres actualizar los entrenamientos de ${user.nombre || user.username} a ${count}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Actualizar",
          onPress: async () => {
            try {
              setUpdating(true);
              await updateDoc(doc(db, "users", userId), {
                allTimeCheckIns: count,
              });
              
              // Actualizar estado local
              setUser(prev => ({ ...prev, allTimeCheckIns: count }));
              
              Alert.alert("Éxito", "Entrenamientos actualizados correctamente");
            } catch (error) {
              console.error("Error al actualizar entrenamientos:", error);
              Alert.alert("Error", "No se pudieron actualizar los entrenamientos");
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const getBeltColor = (belt) => {
    const colors = {
      white: "#F3F4F6",
      blue: "#3B82F6",
      purple: "#8B5CF6",
      brown: "#A16207",
      black: "#111827",
    };
    return colors[belt?.toLowerCase()] || colors.white;
  };

  const getBeltTextColor = (belt) => {
    const darkBelts = ["purple", "brown", "black"];
    return darkBelts.includes(belt?.toLowerCase()) ? "#fff" : "#111827";
  };

  const calculateDanInfo = (totalTrainings, belt) => {
    if (!belt || belt.toLowerCase() === "white") {
      // Cinturón blanco: 4 series de 40 (160 total)
      const currentSeries = Math.floor(totalTrainings / 40) + 1;
      const trainingsInCurrentSeries = totalTrainings % 40;
      const maxSeries = 4;
      
      if (currentSeries > maxSeries) {
        return { dan: "Completado", progress: "Listo para cinturón azul" };
      }
      
      return {
        dan: `${currentSeries}° Dan`,
        progress: `${trainingsInCurrentSeries}/40 entrenamientos`
      };
    } else {
      // Otros cinturones: 4 series de 60 (240 total)
      const currentSeries = Math.floor(totalTrainings / 60) + 1;
      const trainingsInCurrentSeries = totalTrainings % 60;
      const maxSeries = 4;
      
      if (currentSeries > maxSeries) {
        return { dan: "Completado", progress: "Listo para siguiente cinturón" };
      }
      
      return {
        dan: `${currentSeries}° Dan`,
        progress: `${trainingsInCurrentSeries}/60 entrenamientos`
      };
    }
  };

  const getMonthsForYear = (year) => {
    const months = [];
    for (let month = 1; month <= 12; month++) {
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const count = monthlyData[monthKey] || 0;
      const monthName = new Date(year, month - 1).toLocaleDateString('es', { month: 'long' });
      
      months.push({
        key: monthKey,
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        count
      });
    }
    return months;
  };

  const getAvailableYears = () => {
    const years = new Set();
    Object.keys(monthlyData).forEach(monthKey => {
      const year = parseInt(monthKey.split('-')[0]);
      if (!isNaN(year)) {
        years.add(year);
      }
    });
    
    // Agregar año actual si no está
    years.add(new Date().getFullYear());
    
    return Array.from(years).sort((a, b) => b - a); // Descendente
  };

  if (loading) {
    return <AdminLoadingOverlay visible={true} text="Cargando datos del usuario..." />;
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Usuario no encontrado</Text>
          <AdminButton title="Volver" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const beltColor = getBeltColor(user.cinturon);
  const beltTextColor = getBeltTextColor(user.cinturon);
  const danInfo = calculateDanInfo(user.allTimeCheckIns || 0, user.cinturon);
  const availableYears = getAvailableYears();
  const monthsData = getMonthsForYear(selectedYear);

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader
        title="Detalle del Usuario"
        rightComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Información personal */}
        <AdminCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={[styles.profileAvatar, { backgroundColor: beltColor }]}>
              <Text style={[styles.profileAvatarText, { color: beltTextColor }]}>
                {(user.nombre || user.username || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user.nombre || user.username || "Usuario sin nombre"}
              </Text>
              <Text style={styles.profileUsername}>@{user.username}</Text>
              <View style={[styles.beltBadge, { backgroundColor: beltColor }]}>
                <Text style={[styles.beltBadgeText, { color: beltTextColor }]}>
                  {user.cinturon ? `Cinturón ${user.cinturon}` : "Sin cinturón"}
                </Text>
              </View>
            </View>
          </View>

          <AdminDivider />

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Apellido</Text>
              <Text style={styles.infoValue}>{user.apellido || "No registrado"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email || "No registrado"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{user.phone || "No registrado"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ciudad</Text>
              <Text style={styles.infoValue}>{user.city || "No registrado"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Estado</Text>
              <Text style={styles.infoValue}>{user.state || "No registrado"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Edad</Text>
              <Text style={styles.infoValue}>{user.age || "No registrado"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Género</Text>
              <Text style={styles.infoValue}>{user.gender || "No registrado"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Peso</Text>
              <Text style={styles.infoValue}>{user.weight ? `${user.weight} kg` : "No registrado"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Altura</Text>
              <Text style={styles.infoValue}>{user.height ? `${user.height} cm` : "No registrado"}</Text>
            </View>
          </View>
        </AdminCard>

        {/* Progreso de entrenamientos */}
        <AdminCard>
          <Text style={styles.sectionTitle}>Progreso de Entrenamientos</Text>
          
          <View style={styles.progressInfo}>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Entrenamientos Totales</Text>
              <Text style={styles.progressValue}>{user.allTimeCheckIns || 0}</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Dan Actual</Text>
              <Text style={styles.progressValue}>{danInfo.dan}</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Progreso</Text>
              <Text style={styles.progressValue}>{danInfo.progress}</Text>
            </View>
          </View>

          <AdminDivider />

          <Text style={styles.subsectionTitle}>Actualizar Entrenamientos</Text>
          <View style={styles.updateSection}>
            <TextInput
              style={styles.trainingInput}
              value={newTrainingCount}
              onChangeText={setNewTrainingCount}
              placeholder="Número de entrenamientos"
              keyboardType="numeric"
            />
            <AdminButton
              title="Actualizar"
              onPress={handleUpdateTrainings}
              loading={updating}
              variant="success"
              style={styles.updateButton}
            />
          </View>
        </AdminCard>

        {/* Historial mensual */}
        <AdminCard>
          <Text style={styles.sectionTitle}>Historial Mensual</Text>
          
          {/* Selector de año */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearSelector}>
            {availableYears.map(year => (
              <TouchableOpacity
                key={year}
                onPress={() => setSelectedYear(year)}
                style={[
                  styles.yearButton,
                  selectedYear === year && styles.yearButtonActive
                ]}
              >
                <Text style={[
                  styles.yearButtonText,
                  selectedYear === year && styles.yearButtonTextActive
                ]}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Grid de meses */}
          <View style={styles.monthsGrid}>
            {monthsData.map(month => (
              <View key={month.key} style={styles.monthItem}>
                <Text style={styles.monthName}>{month.name}</Text>
                <Text style={styles.monthCount}>{month.count}</Text>
              </View>
            ))}
          </View>
        </AdminCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: "#6B7280",
    marginBottom: 24,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 8,
  },
  beltBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  beltBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  infoItem: {
    width: "48%",
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#111827",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  progressItem: {
    alignItems: "center",
    flex: 1,
  },
  progressLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
    textAlign: "center",
  },
  progressValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  updateSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trainingInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  updateButton: {
    minWidth: 100,
  },
  yearSelector: {
    marginBottom: 16,
  },
  yearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  yearButtonActive: {
    backgroundColor: "#111827",
  },
  yearButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  yearButtonTextActive: {
    color: "#fff",
  },
  monthsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  monthItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  monthName: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  monthCount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
});

export default UserDetailScreen;
