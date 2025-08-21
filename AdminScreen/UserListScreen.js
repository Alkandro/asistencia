// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   Alert,
//   TouchableOpacity,
//   SafeAreaView,
//   RefreshControl,
// } from "react-native";
// import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
// import { useNavigation } from "@react-navigation/native";
// import { db, auth } from "../firebase";
// import { useTranslation } from "react-i18next";
// import { Ionicons } from "@expo/vector-icons";
// import { 
//   AdminCard, 
//   AdminButton, 
//   AdminBadge, 
//   AdminHeader,
//   AdminListItem,
//   AdminLoadingOverlay 
// } from "./AdminComponents";

// const UserListScreen = () => {
//   const { t } = useTranslation();
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [expandedUsers, setExpandedUsers] = useState({});
//   const navigation = useNavigation();

//   useEffect(() => {
//     const usersRef = collection(db, "users");

//     const unsubscribe = onSnapshot(
//       usersRef,
//       (snapshot) => {
//         const userList = [];
//         snapshot.forEach((docSnap) => {
//           const userData = docSnap.data();
//           if (userData.role !== "admin") {
//             userList.push({ id: docSnap.id, ...userData });
//           }
//         });
        
//         // Ordenar por entrenamientos nuevos (descendente) y luego por nombre
//         userList.sort((a, b) => {
//           const aTrainings = a.newTrainings || 0;
//           const bTrainings = b.newTrainings || 0;
          
//           if (aTrainings !== bTrainings) {
//             return bTrainings - aTrainings; // Descendente por entrenamientos
//           }
          
//           const aName = a.nombre || a.username || "";
//           const bName = b.nombre || b.username || "";
//           return aName.localeCompare(bName); // Ascendente por nombre
//         });
        
//         setUsers(userList);
//         setLoading(false);
//       },
//       (error) => {
//         console.error("Error al obtener usuarios:", error);
//         Alert.alert("Error", "No se pudo obtener la lista de usuarios");
//         setLoading(false);
//       }
//     );

//     return () => unsubscribe();
//   }, []);

//   const handleUserPress = async (user) => {
//     // Resetear badge de entrenamientos nuevos
//     if (user.newTrainings > 0) {
//       try {
//         await updateDoc(doc(db, "users", user.id), { newTrainings: 0 });
//       } catch (error) {
//         console.error("Error al resetear badge:", error);
//       }
//     }
    
//     navigation.navigate("UserDetailScreen", { userId: user.id });
//   };

//   const toggleUserExpansion = (userId) => {
//     setExpandedUsers(prev => ({
//       ...prev,
//       [userId]: !prev[userId]
//     }));
//   };

//   const onRefresh = React.useCallback(() => {
//     setRefreshing(true);
//     // La actualización se maneja automáticamente por onSnapshot
//     setTimeout(() => setRefreshing(false), 1000);
//   }, []);

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

//   const renderUserItem = ({ item, index }) => {
//     const isExpanded = expandedUsers[item.id];
//     const beltColor = getBeltColor(item.cinturon);
//     const beltTextColor = getBeltTextColor(item.cinturon);
//     const hasNewTrainings = (item.newTrainings || 0) > 0;

//     return (
//       <AdminCard style={[styles.userCard, hasNewTrainings && styles.userCardHighlight]}>
//         {/* Header del usuario */}
//         <TouchableOpacity 
//           onPress={() => handleUserPress(item)}
//           style={styles.userHeader}
//         >
//           <View style={styles.userInfo}>
//             {/* Avatar con inicial */}
//             <View style={[styles.userAvatar, { backgroundColor: beltColor }]}>
//               <Text style={[styles.userAvatarText, { color: beltTextColor }]}>
//                 {(item.nombre || item.username || "U").charAt(0).toUpperCase()}
//               </Text>
//             </View>
            
//             {/* Información principal */}
//             <View style={styles.userMainInfo}>
//               <Text style={styles.userName}>
//                 {item.nombre || item.username || "Usuario sin nombre"}
//               </Text>
//               <Text style={styles.userBelt}>
//                 {item.cinturon ? `Cinturón ${item.cinturon}` : "Sin cinturón"}
//               </Text>
//               <Text style={styles.userTrainings}>
//                 {item.allTimeCheckIns || 0} entrenamientos totales
//               </Text>
//             </View>
//           </View>

//           {/* Badge y flecha */}
//           <View style={styles.userActions}>
//             {hasNewTrainings && (
//               <AdminBadge count={item.newTrainings} style={styles.userBadge} />
//             )}
//             <TouchableOpacity 
//               onPress={(e) => {
//                 e.stopPropagation();
//                 toggleUserExpansion(item.id);
//               }}
//               style={styles.expandButton}
//             >
//               <Ionicons 
//                 name={isExpanded ? "chevron-up" : "chevron-down"} 
//                 size={20} 
//                 color="#6B7280" 
//               />
//             </TouchableOpacity>
//           </View>
//         </TouchableOpacity>

//         {/* Detalles expandidos */}
//         {isExpanded && (
//           <View style={styles.userDetails}>
//             <View style={styles.userDetailRow}>
//               <Text style={styles.userDetailLabel}>Usuario:</Text>
//               <Text style={styles.userDetailValue}>{item.username || "No registrado"}</Text>
//             </View>
//             <View style={styles.userDetailRow}>
//               <Text style={styles.userDetailLabel}>Apellido:</Text>
//               <Text style={styles.userDetailValue}>{item.apellido || "No registrado"}</Text>
//             </View>
//             <View style={styles.userDetailRow}>
//               <Text style={styles.userDetailLabel}>Email:</Text>
//               <Text style={styles.userDetailValue}>{item.email || "No registrado"}</Text>
//             </View>
//             <View style={styles.userDetailRow}>
//               <Text style={styles.userDetailLabel}>Teléfono:</Text>
//               <Text style={styles.userDetailValue}>{item.phone || "No registrado"}</Text>
//             </View>
            
//             <TouchableOpacity 
//               onPress={() => handleUserPress(item)}
//               style={styles.viewDetailsButton}
//             >
//               <Text style={styles.viewDetailsButtonText}>Ver detalles completos</Text>
//               <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
//             </TouchableOpacity>
//           </View>
//         )}
//       </AdminCard>
//     );
//   };

//   const renderEmptyState = () => (
//     <View style={styles.emptyState}>
//       <Ionicons name="people-outline" size={64} color="#D1D5DB" />
//       <Text style={styles.emptyStateTitle}>No hay usuarios registrados</Text>
//       <Text style={styles.emptyStateSubtitle}>
//         Los usuarios aparecerán aquí cuando se registren en la aplicación
//       </Text>
//     </View>
//   );

//   const renderHeader = () => (
//     <AdminHeader
//       title="Usuarios"
//       subtitle={`${users.length} usuario${users.length !== 1 ? 's' : ''} registrado${users.length !== 1 ? 's' : ''}`}
//       rightComponent={
//         <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
//           <Ionicons name="refresh" size={24} color="#6B7280" />
//         </TouchableOpacity>
//       }
//     />
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       {renderHeader()}
      
//       <FlatList
//         data={users}
//         keyExtractor={(item) => item.id}
//         renderItem={renderUserItem}
//         contentContainerStyle={styles.listContainer}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//         ListEmptyComponent={!loading ? renderEmptyState : null}
//       />

   
//       <AdminLoadingOverlay visible={loading} text="Cargando usuarios..." />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F9FAFB",
//   },
//   listContainer: {
//     padding: 16,
//     paddingBottom: 100, // Espacio para el botón de cerrar sesión
//   },
//   userCard: {
//     marginBottom: 12,
//   },
//   userCardHighlight: {
//     borderLeftWidth: 4,
//     borderLeftColor: "#F59E0B",
//   },
//   userHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   userInfo: {
//     flexDirection: "row",
//     alignItems: "center",
//     flex: 1,
//   },
//   userAvatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 12,
//   },
//   userAvatarText: {
//     fontSize: 18,
//     fontWeight: "700",
//   },
//   userMainInfo: {
//     flex: 1,
//   },
//   userName: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#111827",
//     marginBottom: 2,
//   },
//   userBelt: {
//     fontSize: 14,
//     color: "#6B7280",
//     marginBottom: 2,
//   },
//   userTrainings: {
//     fontSize: 12,
//     color: "#9CA3AF",
//   },
//   userActions: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   userBadge: {
//     marginRight: 8,
//   },
//   expandButton: {
//     padding: 8,
//   },
//   userDetails: {
//     marginTop: 16,
//     paddingTop: 16,
//     borderTopWidth: 1,
//     borderTopColor: "#E5E7EB",
//   },
//   userDetailRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   userDetailLabel: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#6B7280",
//     flex: 1,
//   },
//   userDetailValue: {
//     fontSize: 14,
//     color: "#111827",
//     flex: 2,
//     textAlign: "right",
//   },
//   viewDetailsButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 12,
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     backgroundColor: "#F3F4F6",
//     borderRadius: 8,
//   },
//   viewDetailsButtonText: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#3B82F6",
//     marginRight: 4,
//   },
//   emptyState: {
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 64,
//   },
//   emptyStateTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#6B7280",
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptyStateSubtitle: {
//     fontSize: 14,
//     color: "#9CA3AF",
//     textAlign: "center",
//     paddingHorizontal: 32,
//   },
//   refreshButton: {
//     padding: 8,
//   },
//   bottomActions: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: "#fff",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderTopWidth: 1,
//     borderTopColor: "#E5E7EB",
//   },
//   signOutButton: {
//     width: "100%",
//   },
// });

// export default UserListScreen;

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { collection, onSnapshot, updateDoc, doc, query, where, orderBy, limit } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { db, auth } from "../firebase";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { 
  AdminCard, 
  AdminButton, 
  AdminBadge, 
  AdminHeader,
  AdminListItem,
  AdminLoadingOverlay 
} from "./AdminComponents";

const UserListScreen = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState({});
  // 🆕 ESTADO PARA USUARIOS EN LÍNEA
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const navigation = useNavigation();

  useEffect(() => {
    const usersRef = collection(db, "users");

    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const userList = [];
        snapshot.forEach((docSnap) => {
          const userData = docSnap.data();
          if (userData.role !== "admin") {
            userList.push({ id: docSnap.id, ...userData });
          }
        });
        
        // Ordenar por entrenamientos nuevos (descendente) y luego por nombre
        userList.sort((a, b) => {
          const aTrainings = a.newTrainings || 0;
          const bTrainings = b.newTrainings || 0;
          
          if (aTrainings !== bTrainings) {
            return bTrainings - aTrainings; // Descendente por entrenamientos
          }
          
          const aName = a.nombre || a.username || "";
          const bName = b.nombre || b.username || "";
          return aName.localeCompare(bName); // Ascendente por nombre
        });
        
        setUsers(userList);
        setLoading(false);
      },
      (error) => {
        console.error("Error al obtener usuarios:", error);
        Alert.alert("Error", "No se pudo obtener la lista de usuarios");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 🆕 MONITOREAR USUARIOS EN LÍNEA
  useEffect(() => {
    console.log('👥 Configurando monitoreo de usuarios en línea...');
    
    // Calcular timestamp de hace 5 minutos (consideramos "en línea" si hubo actividad en últimos 5 min)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const usersRef = collection(db, "users");
    const onlineUsersQuery = query(
      usersRef,
      where('lastActivity', '>=', fiveMinutesAgo),
      orderBy('lastActivity', 'desc')
    );

    const unsubscribeOnline = onSnapshot(onlineUsersQuery, (snapshot) => {
      const onlineUserIds = new Set();
      
      snapshot.docs.forEach((doc) => {
        const userData = doc.data();
        const lastActivity = userData.lastActivity;
        
        if (lastActivity) {
          // Verificar si la actividad fue en los últimos 5 minutos
          const lastActivityDate = lastActivity.toDate ? lastActivity.toDate() : new Date(lastActivity);
          const timeDiff = Date.now() - lastActivityDate.getTime();
          
          if (timeDiff <= 5 * 60 * 1000) { // 5 minutos en milisegundos
            onlineUserIds.add(doc.id);
          }
        }
      });
      
      console.log('👥 Usuarios en línea detectados:', onlineUserIds.size);
      setOnlineUsers(onlineUserIds);
    }, (error) => {
      console.error('❌ Error monitoreando usuarios en línea:', error);
    });

    return () => unsubscribeOnline();
  }, []);

  // 🆕 FUNCIÓN PARA DETERMINAR ESTADO DEL USUARIO
  const getUserOnlineStatus = (userId, lastActivity) => {
    // Verificar si está en la lista de usuarios en línea
    if (onlineUsers.has(userId)) {
      return { status: 'online', label: 'En línea', color: '#10B981' };
    }
    
    // Si no está en línea, verificar cuándo fue su última actividad
    if (lastActivity) {
      const lastActivityDate = lastActivity.toDate ? lastActivity.toDate() : new Date(lastActivity);
      const timeDiff = Date.now() - lastActivityDate.getTime();
      
      // Menos de 1 hora = Hace poco
      if (timeDiff <= 60 * 60 * 1000) {
        return { status: 'recent', label: 'Hace poco', color: '#F59E0B' };
      }
      
      // Menos de 24 horas = Hoy
      if (timeDiff <= 24 * 60 * 60 * 1000) {
        return { status: 'today', label: 'Hoy', color: '#6B7280' };
      }
      
      // Más de 24 horas = Desconectado
      return { status: 'offline', label: 'Desconectado', color: '#EF4444' };
    }
    
    // Sin información de actividad
    return { status: 'unknown', label: 'Sin actividad', color: '#9CA3AF' };
  };

  // 🆕 FUNCIÓN PARA FORMATEAR ÚLTIMA ACTIVIDAD
  const formatLastActivity = (lastActivity) => {
    if (!lastActivity) return 'Nunca';
    
    try {
      const lastActivityDate = lastActivity.toDate ? lastActivity.toDate() : new Date(lastActivity);
      const now = new Date();
      const timeDiff = now.getTime() - lastActivityDate.getTime();
      
      // Menos de 1 minuto
      if (timeDiff < 60 * 1000) {
        return 'Ahora mismo';
      }
      
      // Menos de 1 hora
      if (timeDiff < 60 * 60 * 1000) {
        const minutes = Math.floor(timeDiff / (60 * 1000));
        return `Hace ${minutes} min`;
      }
      
      // Menos de 24 horas
      if (timeDiff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(timeDiff / (60 * 60 * 1000));
        return `Hace ${hours}h`;
      }
      
      // Más de 24 horas
      const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
      if (days === 1) {
        return 'Ayer';
      } else if (days < 7) {
        return `Hace ${days} días`;
      } else {
        return lastActivityDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        });
      }
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha inválida';
    }
  };

  const handleUserPress = async (user) => {
    // Resetear badge de entrenamientos nuevos
    if (user.newTrainings > 0) {
      try {
        await updateDoc(doc(db, "users", user.id), { newTrainings: 0 });
      } catch (error) {
        console.error("Error al resetear badge:", error);
      }
    }
    
    navigation.navigate("UserDetailScreen", { userId: user.id });
  };

  const toggleUserExpansion = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // La actualización se maneja automáticamente por onSnapshot
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

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

  const renderUserItem = ({ item, index }) => {
    const isExpanded = expandedUsers[item.id];
    const beltColor = getBeltColor(item.cinturon);
    const beltTextColor = getBeltTextColor(item.cinturon);
    const hasNewTrainings = (item.newTrainings || 0) > 0;
    
    // 🆕 OBTENER ESTADO EN LÍNEA
    const onlineStatus = getUserOnlineStatus(item.id, item.lastActivity);

    return (
      <AdminCard style={[styles.userCard, hasNewTrainings && styles.userCardHighlight]}>
        {/* Header del usuario */}
        <TouchableOpacity 
          onPress={() => handleUserPress(item)}
          style={styles.userHeader}
        >
          <View style={styles.userInfo}>
            {/* Avatar con inicial y indicador de estado */}
            <View style={styles.userAvatarContainer}>
              <View style={[styles.userAvatar, { backgroundColor: beltColor }]}>
                <Text style={[styles.userAvatarText, { color: beltTextColor }]}>
                  {(item.nombre || item.username || "U").charAt(0).toUpperCase()}
                </Text>
              </View>
              
              {/* 🆕 INDICADOR DE ESTADO EN LÍNEA */}
              <View style={[styles.onlineIndicator, { backgroundColor: onlineStatus.color }]}>
                <View style={styles.onlineIndicatorInner} />
              </View>
            </View>
            
            {/* Información principal */}
            <View style={styles.userMainInfo}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName}>
                  {item.nombre || item.username || "Usuario sin nombre"}
                </Text>
                {/* 🆕 BADGE DE ESTADO */}
                <View style={[styles.statusBadge, { backgroundColor: onlineStatus.color }]}>
                  <Text style={styles.statusBadgeText}>{onlineStatus.label}</Text>
                </View>
              </View>
              
              <Text style={styles.userBelt}>
                {item.cinturon ? `Cinturón ${item.cinturon}` : "Sin cinturón"}
              </Text>
              <Text style={styles.userTrainings}>
                {item.allTimeCheckIns || 0} entrenamientos totales
              </Text>
              
              {/* 🆕 ÚLTIMA ACTIVIDAD */}
              <Text style={styles.userLastActivity}>
                Última actividad: {formatLastActivity(item.lastActivity)}
              </Text>
            </View>
          </View>

          {/* Badge y flecha */}
          <View style={styles.userActions}>
            {hasNewTrainings && (
              <AdminBadge count={item.newTrainings} style={styles.userBadge} />
            )}
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                toggleUserExpansion(item.id);
              }}
              style={styles.expandButton}
            >
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#6B7280" 
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Detalles expandidos */}
        {isExpanded && (
          <View style={styles.userDetails}>
            <View style={styles.userDetailRow}>
              <Text style={styles.userDetailLabel}>Usuario:</Text>
              <Text style={styles.userDetailValue}>{item.username || "No registrado"}</Text>
            </View>
            <View style={styles.userDetailRow}>
              <Text style={styles.userDetailLabel}>Apellido:</Text>
              <Text style={styles.userDetailValue}>{item.apellido || "No registrado"}</Text>
            </View>
            <View style={styles.userDetailRow}>
              <Text style={styles.userDetailLabel}>Email:</Text>
              <Text style={styles.userDetailValue}>{item.email || "No registrado"}</Text>
            </View>
            <View style={styles.userDetailRow}>
              <Text style={styles.userDetailLabel}>Teléfono:</Text>
              <Text style={styles.userDetailValue}>{item.phone || "No registrado"}</Text>
            </View>
            
            {/* 🆕 INFORMACIÓN DE ESTADO DETALLADA */}
            <View style={styles.userDetailRow}>
              <Text style={styles.userDetailLabel}>Estado:</Text>
              <View style={styles.statusDetailContainer}>
                <View style={[styles.statusDot, { backgroundColor: onlineStatus.color }]} />
                <Text style={[styles.userDetailValue, { color: onlineStatus.color }]}>
                  {onlineStatus.label}
                </Text>
              </View>
            </View>
            
            <View style={styles.userDetailRow}>
              <Text style={styles.userDetailLabel}>Última actividad:</Text>
              <Text style={styles.userDetailValue}>
                {formatLastActivity(item.lastActivity)}
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={() => handleUserPress(item)}
              style={styles.viewDetailsButton}
            >
              <Text style={styles.viewDetailsButtonText}>Ver detalles completos</Text>
              <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        )}
      </AdminCard>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No hay usuarios registrados</Text>
      <Text style={styles.emptyStateSubtitle}>
        Los usuarios aparecerán aquí cuando se registren en la aplicación
      </Text>
    </View>
  );

  const renderHeader = () => {
    const onlineCount = onlineUsers.size;
    const totalUsers = users.length;
    
    return (
      <AdminHeader
        title="Usuarios"
        subtitle={`${totalUsers} usuario${totalUsers !== 1 ? 's' : ''} • ${onlineCount} en línea`}
        rightComponent={
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#6B7280" />
          </TouchableOpacity>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
      />

      <AdminLoadingOverlay visible={loading} text="Cargando usuarios..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Espacio para el botón de cerrar sesión
  },
  userCard: {
    marginBottom: 12,
  },
  userCardHighlight: {
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  
  // 🆕 ESTILOS PARA AVATAR CON INDICADOR
  userAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  
  // 🆕 INDICADOR DE ESTADO EN LÍNEA
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicatorInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  
  userMainInfo: {
    flex: 1,
  },
  
  // 🆕 FILA CON NOMBRE Y BADGE DE ESTADO
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  
  // 🆕 BADGE DE ESTADO
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  
  userBelt: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  userTrainings: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  
  // 🆕 ÚLTIMA ACTIVIDAD
  userLastActivity: {
    fontSize: 11,
    color: "#9CA3AF",
    fontStyle: 'italic',
    marginTop: 2,
  },
  
  userActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  userBadge: {
    marginRight: 8,
  },
  expandButton: {
    padding: 8,
  },
  userDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  userDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  userDetailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    flex: 1,
  },
  userDetailValue: {
    fontSize: 14,
    color: "#111827",
    flex: 2,
    textAlign: "right",
  },
  
  // 🆕 CONTENEDOR DE ESTADO DETALLADO
  statusDetailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  viewDetailsButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3B82F6",
    marginRight: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  refreshButton: {
    padding: 8,
  },
});

export default UserListScreen;


