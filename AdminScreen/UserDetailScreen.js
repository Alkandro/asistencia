// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   Alert,
//   TouchableOpacity,
//   SafeAreaView,
//   TextInput,
// } from "react-native";
// import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
// import { useRoute, useNavigation } from "@react-navigation/native";
// import { db } from "../firebase";
// import { useTranslation } from "react-i18next";
// import { Ionicons } from "@expo/vector-icons";
// import { 
//   AdminCard, 
//   AdminButton, 
//   AdminHeader,
//   AdminInput,
//   AdminDivider,
//   AdminLoadingOverlay 
// } from "./AdminComponents";

// const UserDetailScreen = () => {
//   const { t } = useTranslation();
//   const route = useRoute();
//   const navigation = useNavigation();
//   const { userId } = route.params;

//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [updating, setUpdating] = useState(false);
//   const [monthlyData, setMonthlyData] = useState({});
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
//   const [newTrainingCount, setNewTrainingCount] = useState("");

//   useEffect(() => {
//     fetchUserData();
//   }, [userId]);

//   const fetchUserData = async () => {
//     try {
//       setLoading(true);
      
//       // Obtener datos del usuario
//       const userDoc = await getDoc(doc(db, "users", userId));
//       if (userDoc.exists()) {
//         const userData = userDoc.data();
//         setUser({ id: userDoc.id, ...userData });
//         setNewTrainingCount(String(userData.allTimeCheckIns || 0));
        
//         // Obtener datos mensuales de entrenamientos
//         await fetchMonthlyData(userData);
//       } else {
//         Alert.alert("Error", "Usuario no encontrado");
//         navigation.goBack();
//       }
//     } catch (error) {
//       console.error("Error al obtener datos del usuario:", error);
//       Alert.alert("Error", "No se pudieron cargar los datos del usuario");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchMonthlyData = async (userData) => {
//     try {
//       // Obtener historial de entrenamientos
//       const attendanceQuery = query(
//         collection(db, "attendanceHistory"),
//         where("userId", "==", userId)
//       );
      
//       const attendanceSnapshot = await getDocs(attendanceQuery);
//       const monthlyCount = {};
      
//       attendanceSnapshot.forEach((doc) => {
//         const data = doc.data();
//         if (data.timestamp) {
//           const date = data.timestamp.toDate();
//           const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
//           monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1;
//         }
//       });

//       // Combinar con datos mensuales del usuario si existen
//       const userMonthlyData = userData.monthlyCheckInCount || {};
//       const combinedData = { ...monthlyCount, ...userMonthlyData };
      
//       setMonthlyData(combinedData);
//     } catch (error) {
//       console.error("Error al obtener datos mensuales:", error);
//     }
//   };

//   const handleUpdateTrainings = async () => {
//     if (!newTrainingCount.trim()) {
//       Alert.alert("Error", "Por favor ingresa un número válido");
//       return;
//     }

//     const count = parseInt(newTrainingCount);
//     if (isNaN(count) || count < 0) {
//       Alert.alert("Error", "Por favor ingresa un número válido mayor o igual a 0");
//       return;
//     }

//     Alert.alert(
//       "Confirmar actualización",
//       `¿Estás seguro de que quieres actualizar los entrenamientos de ${user.nombre || user.username} a ${count}?`,
//       [
//         { text: "Cancelar", style: "cancel" },
//         {
//           text: "Actualizar",
//           onPress: async () => {
//             try {
//               setUpdating(true);
//               await updateDoc(doc(db, "users", userId), {
//                 allTimeCheckIns: count,
//               });
              
//               // Actualizar estado local
//               setUser(prev => ({ ...prev, allTimeCheckIns: count }));
              
//               Alert.alert("Éxito", "Entrenamientos actualizados correctamente");
//             } catch (error) {
//               console.error("Error al actualizar entrenamientos:", error);
//               Alert.alert("Error", "No se pudieron actualizar los entrenamientos");
//             } finally {
//               setUpdating(false);
//             }
//           },
//         },
//       ]
//     );
//   };

//   const getBeltColor = (belt) => {
//     const colors = {
//       white: "#F3F4F6",
//       blue: "#3B82F6",
//       purple: "#8B5CF6",
//       brown: "#A16207",
//       black: "#111827",
//     };
//     return colors[belt?.toLowerCase()] || colors.white;
//   };

//   const getBeltTextColor = (belt) => {
//     const darkBelts = ["purple", "brown", "black"];
//     return darkBelts.includes(belt?.toLowerCase()) ? "#fff" : "#111827";
//   };

//   const calculateDanInfo = (totalTrainings, belt) => {
//     if (!belt || belt.toLowerCase() === "white") {
//       // Cinturón blanco: 4 series de 40 (160 total)
//       const currentSeries = Math.floor(totalTrainings / 40) + 1;
//       const trainingsInCurrentSeries = totalTrainings % 40;
//       const maxSeries = 4;
      
//       if (currentSeries > maxSeries) {
//         return { dan: "Completado", progress: "Listo para cinturón azul" };
//       }
      
//       return {
//         dan: `${currentSeries}° Dan`,
//         progress: `${trainingsInCurrentSeries}/40 entrenamientos`
//       };
//     } else {
//       // Otros cinturones: 4 series de 60 (240 total)
//       const currentSeries = Math.floor(totalTrainings / 60) + 1;
//       const trainingsInCurrentSeries = totalTrainings % 60;
//       const maxSeries = 4;
      
//       if (currentSeries > maxSeries) {
//         return { dan: "Completado", progress: "Listo para siguiente cinturón" };
//       }
      
//       return {
//         dan: `${currentSeries}° Dan`,
//         progress: `${trainingsInCurrentSeries}/60 entrenamientos`
//       };
//     }
//   };
  

//   const getMonthsForYear = (year) => {
//     const months = [];
//     for (let month = 1; month <= 12; month++) {
//       const monthKey = `${year}-${String(month).padStart(2, '0')}`;
//       const count = monthlyData[monthKey] || 0;
//       const monthName = new Date(year, month - 1).toLocaleDateString('es', { month: 'long' });
      
//       months.push({
//         key: monthKey,
//         name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
//         count
//       });
//     }
//     return months;
//   };

//   const getAvailableYears = () => {
//     const years = new Set();
//     Object.keys(monthlyData).forEach(monthKey => {
//       const year = parseInt(monthKey.split('-')[0]);
//       if (!isNaN(year)) {
//         years.add(year);
//       }
//     });
    
//     // Agregar año actual si no está
//     years.add(new Date().getFullYear());
    
//     return Array.from(years).sort((a, b) => b - a); // Descendente
//   };

//   if (loading) {
//     return <AdminLoadingOverlay visible={true} text="Cargando datos del usuario..." />;
//   }

//   if (!user) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorText}>Usuario no encontrado</Text>
//           <AdminButton title="Volver" onPress={() => navigation.goBack()} />
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const beltColor = getBeltColor(user.cinturon);
//   const beltTextColor = getBeltTextColor(user.cinturon);
//   const danInfo = calculateDanInfo(user.allTimeCheckIns || 0, user.cinturon);
//   const availableYears = getAvailableYears();
//   const monthsData = getMonthsForYear(selectedYear);

// // ✅ AGREGAR AL INICIO DE TU COMPONENTE
// const formatBirthDate = (userData) => {
//   if (userData?.fechaNacimiento) {
//     const birthDate = new Date(userData.fechaNacimiento);
//     return birthDate.toLocaleDateString("es-ES", {
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//     });
//   }
//   return "";
// };

//   return (
//     <SafeAreaView style={styles.container}>
//       <AdminHeader
//         title="Detalle del Usuario"
//         rightComponent={
//           <TouchableOpacity onPress={() => navigation.goBack()}>
//             <Ionicons name="close" size={24} color="#6B7280" />
//           </TouchableOpacity>
//         }
//       />

//       <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
//         {/* Información personal */}
//         <AdminCard style={styles.profileCard}>
//           <View style={styles.profileHeader}>
//             <View style={[styles.profileAvatar, { backgroundColor: beltColor }]}>
//               <Text style={[styles.profileAvatarText, { color: beltTextColor }]}>
//                 {(user.nombre || user.username || "U").charAt(0).toUpperCase()}
//               </Text>
//             </View>
//             <View style={styles.profileInfo}>
//               <Text style={styles.profileName}>
//                 {user.nombre || user.username || "Usuario sin nombre"}
//               </Text>
//               <Text style={styles.profileUsername}>@{user.username}</Text>
//               <View style={[styles.beltBadge, { backgroundColor: beltColor }]}>
//                 <Text style={[styles.beltBadgeText, { color: beltTextColor }]}>
//                   {user.cinturon ? `Cinturón ${user.cinturon}` : "Sin cinturón"}
//                 </Text>
//               </View>
//             </View>
//           </View>

//           <AdminDivider />

//           <View style={styles.infoGrid}>
//           <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Nombre</Text>
//               <Text style={styles.infoValue}>{user.nombre || "No registrado"}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Apellido</Text>
//               <Text style={styles.infoValue}>{user.apellido || "No registrado"}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Email</Text>
//               <Text style={styles.infoValue}>{user.email || "No registrado"}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Teléfono</Text>
//               <Text style={styles.infoValue}>{user.phone || "No registrado"}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Ciudad</Text>
//               <Text style={styles.infoValue}>{user.ciudad || "No registrado"}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Estado</Text>
//               <Text style={styles.infoValue}>{user.provincia || "No registrado"}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Edad</Text>
//               <Text style={styles.infoValue}>{user.edad || "No registrado"}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Género</Text>
//               <Text style={styles.infoValue}>{user.genero || "No registrado"}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Peso</Text>
//               <Text style={styles.infoValue}>{user.peso ? `${user.peso} kg` : "No registrado"}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Altura</Text>
//               <Text style={styles.infoValue}>{user.altura ? `${user.altura} cm` : "No registrado"}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>NickName</Text>
//               <Text style={styles.infoValue}>{user.username || "No registrado"}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Fecha de Nacimiento</Text>
//               <Text style={styles.infoValue}>{formatBirthDate(user) || "No registrado"}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Contanto de Emergencia</Text>
//               <Text style={styles.infoValue}>{user.emergenciaContacto || "No registrado"}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Teléfono de Emergencia</Text>
//               <Text style={styles.infoValue}>{user.emergenciaTelefono || "No registrado"}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Notas</Text>
//               <Text style={styles.infoValue}>{user.notas || "No registrado"}</Text>
//             </View>
//           </View>
//         </AdminCard>

//         {/* Progreso de entrenamientos */}
//         <AdminCard>
//           <Text style={styles.sectionTitle}>Progreso de Entrenamientos</Text>
          
//           <View style={styles.progressInfo}>
//             <View style={styles.progressItem}>
//               <Text style={styles.progressLabel}>Entrenamientos Totales</Text>
//               <Text style={styles.progressValue}>{user.allTimeCheckIns || 0}</Text>
//             </View>
//             <View style={styles.progressItem}>
//               <Text style={styles.progressLabel}>Dan Actual</Text>
//               <Text style={styles.progressValue}>{danInfo.dan}</Text>
//             </View>
//             <View style={styles.progressItem}>
//               <Text style={styles.progressLabel}>Progreso</Text>
//               <Text style={styles.progressValue}>{danInfo.progress}</Text>
//             </View>
//           </View>

//           <AdminDivider />

//           <Text style={styles.subsectionTitle}>Actualizar Entrenamientos</Text>
//           <View style={styles.updateSection}>
//             <TextInput
//               style={styles.trainingInput}
//               value={newTrainingCount}
//               onChangeText={setNewTrainingCount}
//               placeholder="Número de entrenamientos"
//               keyboardType="numeric"
//             />
//             <AdminButton
//               title="Actualizar"
//               onPress={handleUpdateTrainings}
//               loading={updating}
//               variant="success"
//               style={styles.updateButton}
//             />
//           </View>
//         </AdminCard>

//         {/* Historial mensual */}
//         <AdminCard>
//           <Text style={styles.sectionTitle}>Historial Mensual</Text>
          
//           {/* Selector de año */}
//           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearSelector}>
//             {availableYears.map(year => (
//               <TouchableOpacity
//                 key={year}
//                 onPress={() => setSelectedYear(year)}
//                 style={[
//                   styles.yearButton,
//                   selectedYear === year && styles.yearButtonActive
//                 ]}
//               >
//                 <Text style={[
//                   styles.yearButtonText,
//                   selectedYear === year && styles.yearButtonTextActive
//                 ]}>
//                   {year}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>

//           {/* Grid de meses */}
//           <View style={styles.monthsGrid}>
//             {monthsData.map(month => (
//               <View key={month.key} style={styles.monthItem}>
//                 <Text style={styles.monthName}>{month.name}</Text>
//                 <Text style={styles.monthCount}>{month.count}</Text>
//               </View>
//             ))}
//           </View>
//         </AdminCard>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F9FAFB",
//   },
//   scrollContainer: {
//     flex: 1,
//     padding: 16,
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 32,
//   },
//   errorText: {
//     fontSize: 18,
//     color: "#6B7280",
//     marginBottom: 24,
//   },
//   profileCard: {
//     marginBottom: 16,
//   },
//   profileHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   profileAvatar: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 16,
//   },
//   profileAvatarText: {
//     fontSize: 32,
//     fontWeight: "700",
//   },
//   profileInfo: {
//     flex: 1,
//   },
//   profileName: {
//     fontSize: 24,
//     fontWeight: "700",
//     color: "#111827",
//     marginBottom: 4,
//   },
//   profileUsername: {
//     fontSize: 16,
//     color: "#6B7280",
//     marginBottom: 8,
//   },
//   beltBadge: {
//     alignSelf: "flex-start",
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//   },
//   beltBadgeText: {
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   infoGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "space-between",
//   },
//   infoItem: {
//     width: "48%",
//     marginBottom: 16,
//   },
//   infoLabel: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#6B7280",
//     marginBottom: 4,
//   },
//   infoValue: {
//     fontSize: 16,
//     color: "#111827",
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#111827",
//     marginBottom: 16,
//   },
//   subsectionTitle: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#111827",
//     marginBottom: 12,
//   },
//   progressInfo: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 16,
//   },
//   progressItem: {
//     alignItems: "center",
//     flex: 1,
//   },
//   progressLabel: {
//     fontSize: 14,
//     color: "#6B7280",
//     marginBottom: 4,
//     textAlign: "center",
//   },
//   progressValue: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#111827",
//     textAlign: "center",
//   },
//   updateSection: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//   },
//   trainingInput: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: "#D1D5DB",
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     fontSize: 16,
//     backgroundColor: "#fff",
//   },
//   updateButton: {
//     minWidth: 100,
//   },
//   yearSelector: {
//     marginBottom: 16,
//   },
//   yearButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     marginRight: 8,
//     borderRadius: 20,
//     backgroundColor: "#F3F4F6",
//   },
//   yearButtonActive: {
//     backgroundColor: "#111827",
//   },
//   yearButtonText: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#6B7280",
//   },
//   yearButtonTextActive: {
//     color: "#fff",
//   },
//   monthsGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "space-between",
//   },
//   monthItem: {
//     width: "30%",
//     alignItems: "center",
//     marginBottom: 16,
//     padding: 12,
//     backgroundColor: "#F9FAFB",
//     borderRadius: 8,
//   },
//   monthName: {
//     fontSize: 10,
//     color: "#6B7280",
//     marginBottom: 4,
//   },
//   monthCount: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#111827",
//   },
// });

// export default UserDetailScreen;


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

  // 🔧 FUNCIÓN MEJORADA PARA FORMATEAR FECHA DE NACIMIENTO
  const formatBirthDate = (userData) => {
    if (!userData?.fechaNacimiento) {
      return "";
    }

    try {
      let date;
      
      // Si es un timestamp de Firebase
      if (userData.fechaNacimiento.toDate) {
        date = userData.fechaNacimiento.toDate();
      }
      // Si es un string en formato DD/MM/YYYY
      else if (typeof userData.fechaNacimiento === 'string') {
        const parts = userData.fechaNacimiento.split('/');
        if (parts.length === 3) {
          // Convertir DD/MM/YYYY a MM/DD/YYYY para Date constructor
          date = new Date(`${parts[1]}/${parts[0]}/${parts[2]}`);
        } else {
          date = new Date(userData.fechaNacimiento);
        }
      }
      // Si es un número (timestamp)
      else if (typeof userData.fechaNacimiento === 'number') {
        date = new Date(userData.fechaNacimiento);
      }
      // Si ya es un objeto Date
      else if (userData.fechaNacimiento instanceof Date) {
        date = userData.fechaNacimiento;
      }
      else {
        console.log('⚠️ Formato de fecha no reconocido:', userData.fechaNacimiento);
        return "";
      }

      // Verificar que la fecha es válida
      if (isNaN(date.getTime())) {
        console.log('⚠️ Fecha inválida:', userData.fechaNacimiento);
        return "";
      }

      // Formatear la fecha
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

    } catch (error) {
      console.error('❌ Error al formatear fecha:', error, userData.fechaNacimiento);
      return "";
    }
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
            {/* ✅ INFORMACIÓN BÁSICA CON ICONOS */}
            <View style={styles.infoItem}>
              <View style={styles.infoItemHeader}>
                <Ionicons name="person" size={16} color="#6B7280" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Nombre</Text>
              </View>
              <Text style={styles.infoValue}>{user.nombre || "No registrado"}</Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoItemHeader}>
                <Ionicons name="person" size={16} color="#6B7280" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Apellido</Text>
              </View>
              <Text style={styles.infoValue}>{user.apellido || "No registrado"}</Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoItemHeader}>
                <Ionicons name="mail" size={16} color="#6B7280" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Email</Text>
              </View>
              <Text style={styles.infoValue}>{user.email || "No registrado"}</Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoItemHeader}>
                <Ionicons name="call" size={16} color="#6B7280" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Teléfono</Text>
              </View>
              <Text style={styles.infoValue}>{user.telefono || user.phone || "No registrado"}</Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoItemHeader}>
                <Ionicons name="calendar" size={16} color="#6B7280" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Fecha de Nacimiento</Text>
              </View>
              <Text style={styles.infoValue}>{formatBirthDate(user) || "No registrado"}</Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoItemHeader}>
                <Ionicons name="male-female" size={16} color="#6B7280" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Género</Text>
              </View>
              <Text style={styles.infoValue}>{user.genero || "No registrado"}</Text>
            </View>

            {/* ✅ INFORMACIÓN FÍSICA CON ICONOS */}
            <View style={styles.infoItem}>
              <View style={styles.infoItemHeader}>
                <Ionicons name="fitness" size={16} color="#6B7280" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Peso</Text>
              </View>
              <Text style={styles.infoValue}>{user.peso ? `${user.peso} kg` : "No registrado"}</Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoItemHeader}>
                <Ionicons name="resize" size={16} color="#6B7280" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Altura</Text>
              </View>
              <Text style={styles.infoValue}>{user.altura ? `${user.altura} cm` : "No registrado"}</Text>
            </View>

            {/* ✅ INFORMACIÓN DE UBICACIÓN CON ICONOS */}
            <View style={styles.infoItem}>
              <View style={styles.infoItemHeader}>
                <Ionicons name="location" size={16} color="#6B7280" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Dirección</Text>
              </View>
              <Text style={styles.infoValue}>{user.direccion || "No registrado"}</Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoItemHeader}>
                <Ionicons name="business" size={16} color="#6B7280" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Ciudad</Text>
              </View>
              <Text style={styles.infoValue}>{user.ciudad || "No registrado"}</Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoItemHeader}>
                <Ionicons name="map" size={16} color="#6B7280" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Código Postal</Text>
              </View>
              <Text style={styles.infoValue}>{user.codigoPostal || "No registrado"}</Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoItemHeader}>
                <Ionicons name="flag" size={16} color="#6B7280" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>País</Text>
              </View>
              <Text style={styles.infoValue}>{user.pais || "No registrado"}</Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoItemHeader}>
                <Ionicons name="time" size={16} color="#6B7280" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Edad</Text>
              </View>
              <Text style={styles.infoValue}>{user.edad || "No registrado"}</Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoItemHeader}>
                <Ionicons name="at" size={16} color="#6B7280" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>NickName</Text>
              </View>
              <Text style={styles.infoValue}>{user.username || "No registrado"}</Text>
            </View>

            {/* ✅ CONTACTO DE EMERGENCIA CON ICONOS ROJOS */}
            <View style={styles.infoItem}>
              <View style={styles.infoItemHeader}>
                <Ionicons name="medical" size={16} color="#EF4444" style={styles.infoIcon} />
                <Text style={[styles.infoLabel, styles.emergencyLabel]}>Contacto de Emergencia</Text>
              </View>
              <Text style={[styles.infoValue, styles.emergencyValue]}>
                {user.emergenciaContacto || "No registrado"}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoItemHeader}>
                <Ionicons name="call" size={16} color="#EF4444" style={styles.infoIcon} />
                <Text style={[styles.infoLabel, styles.emergencyLabel]}>Teléfono de Emergencia</Text>
              </View>
              <Text style={[styles.infoValue, styles.emergencyValue]}>
                {user.emergenciaTelefono || "No registrado"}
              </Text>
            </View>

            {/* ✅ INFORMACIÓN ADICIONAL CON ICONOS */}
            <View style={styles.infoItem}>
              <View style={styles.infoItemHeader}>
                <Ionicons name="document-text" size={16} color="#6B7280" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Notas</Text>
              </View>
              <Text style={styles.infoValue}>{user.notas || "No registrado"}</Text>
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
    paddingVertical: 4,
    borderRadius: 16,
  },
  beltBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  // ✅ NUEVOS ESTILOS PARA ICONOS
  infoItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  infoIcon: {
    marginRight: 8,
    width: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "400",
    marginLeft: 24, // Alineado con el texto del label
  },
  // ✅ ESTILOS ESPECIALES PARA EMERGENCIA EN ROJO
  emergencyLabel: {
    color: "#EF4444",
    fontWeight: "600",
  },
  emergencyValue: {
    color: "#DC2626",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  progressItem: {
    flex: 1,
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    textAlign: "center",
  },
  progressValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  updateSection: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-end",
  },
  trainingInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  updateButton: {
    paddingHorizontal: 20,
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
    backgroundColor: "#3B82F6",
  },
  yearButtonText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  yearButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  monthsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  monthItem: {
    width: "23%",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  monthName: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    textAlign: "center",
  },
  monthCount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
});

export default UserDetailScreen;
