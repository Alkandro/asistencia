// // AdminDashboardScreen.js - Panel de control admin compatible con react-native-tab-view
// import React, { useState, useEffect, useContext } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   SafeAreaView,
//   RefreshControl,
//   Dimensions,
// } from 'react-native';
// import {
//   collection,
//   onSnapshot,
//   query,
//   where,
//   orderBy,
//   limit,
//   getDocs,
// } from 'firebase/firestore';
// import { db, auth } from '../firebase';
// import { useTranslation } from 'react-i18next';
// import { Ionicons } from '@expo/vector-icons';
// import {
//   AdminCard,
//   AdminButton,
//   AdminHeader,
//   AdminDivider,
//   AdminLoadingOverlay,
// } from './AdminComponents';

// const { width } = Dimensions.get('window');

// // ✅ CONTEXTO PARA COMUNICACIÓN CON TABVIEW
// const TabNavigationContext = React.createContext();

// const AdminDashboardScreen = ({ navigation, route }) => {
//   const { t } = useTranslation();
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   // Estados para estadísticas
//   const [totalUsers, setTotalUsers] = useState(0);
//   const [activeUsers, setActiveUsers] = useState(0);
//   const [totalTrainings, setTotalTrainings] = useState(0);
//   const [monthlyTrainings, setMonthlyTrainings] = useState(0);
//   const [totalMessages, setTotalMessages] = useState(0);
//   const [recentActivity, setRecentActivity] = useState([]);
//   const [beltDistribution, setBeltDistribution] = useState({});
//   const [topUsers, setTopUsers] = useState([]);

//   useEffect(() => {
//     fetchDashboardData();
//   }, []);

//   const fetchDashboardData = async () => {
//     try {
//       setLoading(true);

//       // Suscribirse a usuarios
//       const usersRef = collection(db, 'users');
//       const usersQuery = query(usersRef, where('role', '!=', 'admin'));

//       const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
//         const users = [];
//         let totalTrainingsCount = 0;
//         let monthlyTrainingsCount = 0;
//         const beltCount = {};

//         const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

//         snapshot.forEach((doc) => {
//           const userData = doc.data();
//           users.push({ id: doc.id, ...userData });

//           // Contar entrenamientos totales
//           totalTrainingsCount += userData.allTimeCheckIns || 0;

//           // Contar entrenamientos del mes actual
//           const monthlyData = userData.monthlyCheckInCount || {};
//           monthlyTrainingsCount += monthlyData[currentMonth] || 0;

//           // Distribución de cinturones
//           const belt = userData.cinturon || 'white';
//           beltCount[belt] = (beltCount[belt] || 0) + 1;
//         });

//         setTotalUsers(users.length);
//         setActiveUsers(users.filter(u => (u.allTimeCheckIns || 0) > 0).length);
//         setTotalTrainings(totalTrainingsCount);
//         setMonthlyTrainings(monthlyTrainingsCount);
//         setBeltDistribution(beltCount);

//         // Top usuarios por entrenamientos
//         const sortedUsers = users
//           .sort((a, b) => (b.allTimeCheckIns || 0) - (a.allTimeCheckIns || 0))
//           .slice(0, 5);
//         setTopUsers(sortedUsers);
//       });

//       // Suscribirse a mensajes
//       const messagesRef = collection(db, 'messages');
//       const unsubscribeMessages = onSnapshot(messagesRef, (snapshot) => {
//         setTotalMessages(snapshot.size);
//       });

//       // Obtener actividad reciente
//       await fetchRecentActivity();

//       setLoading(false);

//       // Cleanup function
//       return () => {
//         unsubscribeUsers();
//         unsubscribeMessages();
//       };
//     } catch (error) {
//       console.error('Error al cargar datos del dashboard:', error);
//       setLoading(false);
//     }
//   };

//   const fetchRecentActivity = async () => {
//     try {
//       // Obtener entrenamientos recientes
//       const attendanceQuery = query(
//         collection(db, 'attendanceHistory'),
//         orderBy('timestamp', 'desc'),
//         limit(10)
//       );

//       const attendanceSnapshot = await getDocs(attendanceQuery);
//       const activities = [];

//       for (const doc of attendanceSnapshot.docs) {
//         const data = doc.data();
//         activities.push({
//           id: doc.id,
//           type: 'training',
//           userId: data.userId,
//           username: data.username || 'Usuario',
//           timestamp: data.timestamp,
//         });
//       }

//       setRecentActivity(activities);
//     } catch (error) {
//       console.error('Error al obtener actividad reciente:', error);
//     }
//   };

//   const onRefresh = React.useCallback(() => {
//     setRefreshing(true);
//     fetchDashboardData().finally(() => setRefreshing(false));
//   }, []);

//   // ✅ FUNCIÓN DE NAVEGACIÓN CORREGIDA PARA TABVIEW
//   const navigateToTab = (tabKey) => {
//     try {
//       console.log('🧭 Navegando a pestaña:', tabKey);
      
//       // Buscar el contexto del TabView padre
//       const parentNavigation = navigation?.getParent?.();
      
//       if (parentNavigation) {
//         // Si tenemos acceso al navegador padre
//         console.log('✅ Usando navegador padre');
//         parentNavigation.navigate(tabKey);
//         return;
//       }

//       // Método alternativo: usar el contexto global si está disponible
//       if (global.tabNavigationRef) {
//         console.log('✅ Usando referencia global');
//         global.tabNavigationRef.setIndex(getTabIndex(tabKey));
//         return;
//       }

//       // Método alternativo: emitir evento personalizado
//       console.log('✅ Emitiendo evento de navegación');
//       if (global.tabNavigationEmitter) {
//         global.tabNavigationEmitter.emit('navigateToTab', tabKey);
//         return;
//       }

//       console.log('⚠️ No se pudo navegar - usando fallback');
//       // Fallback: mostrar mensaje al usuario
//       alert(`Navegar a ${tabKey}. Por favor, toca la pestaña correspondiente.`);
      
//     } catch (error) {
//       console.error('❌ Error de navegación:', error);
//       alert(`Error al navegar. Por favor, toca la pestaña ${tabKey} manualmente.`);
//     }
//   };

//   // ✅ FUNCIÓN AUXILIAR PARA OBTENER ÍNDICE DE PESTAÑA
//   const getTabIndex = (tabKey) => {
//     const tabMap = {
//       'dashboard': 0,
//       'users': 1,
//       'products': 2,
//       'gestionar': 3,
//       'orders': 4,
//       'messages': 5,
//       'settings': 6,
//       'backgrounds': 7,
//     };
//     return tabMap[tabKey] || 0;
//   };

//   const getBeltColor = (belt) => {
//     const colors = {
//       white: '#F3F4F6',
//       blue: '#3B82F6',
//       purple: '#8B5CF6',
//       brown: '#A16207',
//       black: '#111827',
//     };
//     return colors[belt?.toLowerCase()] || colors.white;
//   };

//   const getBeltTextColor = (belt) => {
//     const darkBelts = ['purple', 'brown', 'black'];
//     return darkBelts.includes(belt?.toLowerCase()) ? '#fff' : '#111827';
//   };

//   const formatDate = (timestamp) => {
//     if (!timestamp) return 'Fecha no disponible';

//     try {
//       const date = timestamp.toDate();
//       const now = new Date();
//       const diffInHours = (now - date) / (1000 * 60 * 60);

//       if (diffInHours < 1) {
//         return 'Hace unos minutos';
//       } else if (diffInHours < 24) {
//         return `Hace ${Math.floor(diffInHours)} horas`;
//       } else {
//         return date.toLocaleDateString('es-ES', {
//           day: '2-digit',
//           month: '2-digit',
//           hour: '2-digit',
//           minute: '2-digit',
//         });
//       }
//     } catch (error) {
//       return 'Fecha no disponible';
//     }
//   };

//   const renderStatCard = (title, value, icon, color = '#111827', subtitle = '') => (
//     <AdminCard style={[styles.statCard, { width: (width - 48) / 2 }]}>
//       <View style={styles.statHeader}>
//         <Ionicons name={icon} size={24} color={color} />
//       </View>
//       <Text style={styles.statValue}>{value}</Text>
//       <Text style={styles.statTitle}>{title}</Text>
//       {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
//     </AdminCard>
//   );

//   const renderBeltDistribution = () => (
//     <AdminCard style={styles.distributionCard}>
//       <Text style={styles.sectionTitle}>Distribución de Cinturones</Text>
//       <View style={styles.beltList}>
//         {Object.entries(beltDistribution).map(([belt, count]) => (
//           <View key={belt} style={styles.beltItem}>
//             <View style={styles.beltInfo}>
//               <View style={[styles.beltIndicator, { backgroundColor: getBeltColor(belt) }]} />
//               <Text style={styles.beltName}>
//                 {belt.charAt(0).toUpperCase() + belt.slice(1)}
//               </Text>
//             </View>
//             <Text style={styles.beltCount}>{count}</Text>
//           </View>
//         ))}
//       </View>
//     </AdminCard>
//   );

//   const renderTopUsers = () => (
//     <AdminCard style={styles.topUsersCard}>
//       <Text style={styles.sectionTitle}>Top Usuarios</Text>
//       <View style={styles.usersList}>
//         {topUsers.map((user, index) => (
//           <View key={user.id} style={styles.userItem}>
//             <View style={styles.userRank}>
//               <Text style={styles.rankNumber}>{index + 1}</Text>
//             </View>
//             <View style={[
//               styles.userAvatar,
//               { backgroundColor: getBeltColor(user.cinturon) }
//             ]}>
//               <Text style={[
//                 styles.userAvatarText,
//                 { color: getBeltTextColor(user.cinturon) }
//               ]}>
//                 {(user.nombre || user.username || 'U').charAt(0).toUpperCase()}
//               </Text>
//             </View>
//             <View style={styles.userInfo}>
//               <Text style={styles.userName}>
//                 {user.nombre || user.username || 'Usuario'}
//               </Text>
//               <Text style={styles.userTrainings}>
//                 {user.allTimeCheckIns || 0} entrenamientos
//               </Text>
//             </View>
//           </View>
//         ))}
//       </View>
//     </AdminCard>
//   );

//   const renderRecentActivity = () => (
//     <AdminCard style={styles.activityCard}>
//       <Text style={styles.sectionTitle}>Actividad Reciente</Text>
//       <View style={styles.activityList}>
//         {recentActivity.length > 0 ? (
//           recentActivity.map((activity) => (
//             <View key={activity.id} style={styles.activityItem}>
//               <View style={styles.activityIcon}>
//                 <Ionicons name="fitness-outline" size={20} color="#10B981" />
//               </View>
//               <View style={styles.activityInfo}>
//                 <Text style={styles.activityText}>
//                   <Text style={styles.activityUser}>{activity.username}</Text>
//                   {' registró un entrenamiento'}
//                 </Text>
//                 <Text style={styles.activityTime}>
//                   {formatDate(activity.timestamp)}
//                 </Text>
//               </View>
//             </View>
//           ))
//         ) : (
//           <Text style={styles.noActivityText}>No hay actividad reciente</Text>
//         )}
//       </View>
//     </AdminCard>
//   );

//   // ✅ ACCIONES RÁPIDAS CORREGIDAS PARA TABVIEW
//   const renderQuickActions = () => (
//     <AdminCard style={styles.actionsCard}>
//       <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
//       <View style={styles.actionButtons}>
//         <AdminButton
//           title="Ver Usuarios"
//           icon="people-outline"
//           variant="secondary"
//           style={styles.actionButton}
//           onPress={() => navigateToTab('users')}
//         />
//         <AdminButton
//           title="Enviar Mensaje"
//           icon="send-outline"
//           variant="primary"
//           style={styles.actionButton}
//           onPress={() => navigateToTab('messages')}
//         />
//       </View>
      
//       {/* ✅ FILA ADICIONAL DE ACCIONES */}
//       <View style={[styles.actionButtons, { marginTop: 12 }]}>
//         <AdminButton
//           title="Productos"
//           icon="cube-outline"
//           variant="outline"
//           style={styles.actionButton}
//           onPress={() => navigateToTab('products')}
//         />
//         <AdminButton
//           title="Pedidos"
//           icon="receipt-outline"
//           variant="outline"
//           style={styles.actionButton}
//           onPress={() => navigateToTab('orders')}
//         />
//       </View>

//       {/* ✅ TERCERA FILA DE ACCIONES */}
//       <View style={[styles.actionButtons, { marginTop: 12 }]}>
//         <AdminButton
//           title="Gestionar"
//           icon="add-circle-outline"
//           variant="outline"
//           style={styles.actionButton}
//           onPress={() => navigateToTab('gestionar')}
//         />
//         <AdminButton
//           title="Fondos"
//           icon="image-outline"
//           variant="outline"
//           style={styles.actionButton}
//           onPress={() => navigateToTab('backgrounds')}
//         />
//       </View>
//     </AdminCard>
//   );

//   if (loading) {
//     return <AdminLoadingOverlay visible={true} text="Cargando dashboard..." />;
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <AdminHeader
//         title="Panel de Control"
//         subtitle="Resumen de la academia"
//         rightComponent={
//           <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
//             <Ionicons name="refresh" size={24} color="#6B7280" />
//           </TouchableOpacity>
//         }
//       />

//       <ScrollView
//         style={styles.scrollContainer}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//       >
//         {/* Estadísticas principales */}
//         <View style={styles.statsRow}>
//           {renderStatCard('Usuarios', totalUsers, 'people-outline', '#3B82F6')}
//           {renderStatCard('Activos', activeUsers, 'checkmark-circle-outline', '#10B981')}
//         </View>

//         <View style={styles.statsRow}>
//           {renderStatCard('Entrenamientos', totalTrainings, 'fitness-outline', '#F59E0B', 'Total')}
//           {renderStatCard('Este Mes', monthlyTrainings, 'calendar-outline', '#8B5CF6')}
//         </View>

//         <View style={styles.statsRow}>
//           {renderStatCard('Mensajes', totalMessages, 'chatbubbles-outline', '#EF4444')}
//           {renderStatCard('Academia', '2025', 'school-outline', '#6B7280', 'Año actual')}
//         </View>

//         {/* Distribución de cinturones */}
//         {renderBeltDistribution()}

//         {/* Top usuarios */}
//         {renderTopUsers()}

//         {/* Actividad reciente */}
//         {renderRecentActivity()}

//         {/* Acciones rápidas */}
//         {renderQuickActions()}
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
//   scrollContainer: {
//     flex: 1,
//     padding: 16,
//   },
//   refreshButton: {
//     padding: 8,
//   },

//   // Estadísticas
//   statsRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
//   statCard: {
//     alignItems: 'center',
//     paddingVertical: 20,
//   },
//   statHeader: {
//     marginBottom: 12,
//   },
//   statValue: {
//     fontSize: 32,
//     fontWeight: '700',
//     color: '#111827',
//     marginBottom: 4,
//   },
//   statTitle: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#6B7280',
//     textAlign: 'center',
//   },
//   statSubtitle: {
//     fontSize: 12,
//     color: '#9CA3AF',
//     marginTop: 2,
//   },

//   // Secciones
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#111827',
//     marginBottom: 16,
//   },

//   // Distribución de cinturones
//   distributionCard: {
//     marginBottom: 16,
//   },
//   beltList: {
//     gap: 12,
//   },
//   beltItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 8,
//   },
//   beltInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   beltIndicator: {
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   beltName: {
//     fontSize: 16,
//     color: '#111827',
//   },
//   beltCount: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#6B7280',
//   },

//   // Top usuarios
//   topUsersCard: {
//     marginBottom: 16,
//   },
//   usersList: {
//     gap: 12,
//   },
//   userItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 8,
//   },
//   userRank: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     backgroundColor: '#F3F4F6',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//   },
//   rankNumber: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#6B7280',
//   },
//   userAvatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//   },
//   userAvatarText: {
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   userInfo: {
//     flex: 1,
//   },
//   userName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#111827',
//   },
//   userTrainings: {
//     fontSize: 14,
//     color: '#6B7280',
//   },

//   // Actividad reciente
//   activityCard: {
//     marginBottom: 16,
//   },
//   activityList: {
//     gap: 12,
//   },
//   activityItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 8,
//   },
//   activityIcon: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#ECFDF5',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//   },
//   activityInfo: {
//     flex: 1,
//   },
//   activityText: {
//     fontSize: 14,
//     color: '#111827',
//     marginBottom: 2,
//   },
//   activityUser: {
//     fontWeight: '600',
//   },
//   activityTime: {
//     fontSize: 12,
//     color: '#6B7280',
//   },
//   noActivityText: {
//     fontSize: 14,
//     color: '#9CA3AF',
//     textAlign: 'center',
//     paddingVertical: 20,
//   },

//   // Acciones rápidas
//   actionsCard: {
//     marginBottom: 10,
//     height:150,
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   actionButton: {
//     flex: 1,
//   },
// });

// export default AdminDashboardScreen;


// AdminDashboardScreen.js - Panel de control admin con actividad reciente de 7 días
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Dimensions,
  Switch,
  Alert,
} from 'react-native';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AdminCard,
  AdminButton,
  AdminHeader,
  AdminDivider,
  AdminLoadingOverlay,
} from './AdminComponents';

const { width } = Dimensions.get('window');

// ✅ CONTEXTO PARA COMUNICACIÓN CON TABVIEW
const TabNavigationContext = React.createContext();

const AdminDashboardScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para estadísticas
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalTrainings, setTotalTrainings] = useState(0);
  const [monthlyTrainings, setMonthlyTrainings] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [beltDistribution, setBeltDistribution] = useState({});
  const [topUsers, setTopUsers] = useState([]);

  // 🆕 NUEVOS ESTADOS PARA CONTROL DE ACTIVIDAD RECIENTE
  const [showRecentActivity, setShowRecentActivity] = useState(true);
  const [activityDaysFilter, setActivityDaysFilter] = useState(7); // Por defecto 7 días
  const [lastCleanupDate, setLastCleanupDate] = useState(null);

  useEffect(() => {
    loadActivitySettings();
    fetchDashboardData();
    
    // 🆕 CONFIGURAR LIMPIEZA AUTOMÁTICA DIARIA
    const cleanupInterval = setInterval(() => {
      performDailyCleanup();
    }, 24 * 60 * 60 * 1000); // Cada 24 horas

    return () => clearInterval(cleanupInterval);
  }, []);

  // 🆕 CARGAR CONFIGURACIÓN DE ACTIVIDAD DESDE ASYNCSTORAGE
  const loadActivitySettings = async () => {
    try {
      const showActivity = await AsyncStorage.getItem('admin_show_recent_activity');
      const daysFilter = await AsyncStorage.getItem('admin_activity_days_filter');
      const lastCleanup = await AsyncStorage.getItem('admin_last_cleanup_date');

      if (showActivity !== null) {
        setShowRecentActivity(JSON.parse(showActivity));
      }
      if (daysFilter !== null) {
        setActivityDaysFilter(parseInt(daysFilter));
      }
      if (lastCleanup !== null) {
        setLastCleanupDate(new Date(lastCleanup));
      }
    } catch (error) {
      console.error('Error al cargar configuración de actividad:', error);
    }
  };

  // 🆕 GUARDAR CONFIGURACIÓN DE ACTIVIDAD
  const saveActivitySettings = async (showActivity, daysFilter) => {
    try {
      await AsyncStorage.setItem('admin_show_recent_activity', JSON.stringify(showActivity));
      await AsyncStorage.setItem('admin_activity_days_filter', daysFilter.toString());
      console.log('✅ Configuración de actividad guardada');
    } catch (error) {
      console.error('Error al guardar configuración de actividad:', error);
    }
  };

  // 🆕 LIMPIEZA AUTOMÁTICA DIARIA
  const performDailyCleanup = async () => {
    try {
      const today = new Date();
      const todayString = today.toDateString();
      
      // Verificar si ya se hizo limpieza hoy
      if (lastCleanupDate && lastCleanupDate.toDateString() === todayString) {
        return; // Ya se hizo limpieza hoy
      }

      console.log('🧹 Realizando limpieza automática de actividad reciente...');
      
      // Actualizar fecha de última limpieza
      await AsyncStorage.setItem('admin_last_cleanup_date', today.toISOString());
      setLastCleanupDate(today);
      
      // Recargar actividad reciente con filtro actualizado
      await fetchRecentActivity();
      
      console.log('✅ Limpieza automática completada');
    } catch (error) {
      console.error('Error en limpieza automática:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Suscribirse a usuarios
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, where('role', '!=', 'admin'));

      const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        const users = [];
        let totalTrainingsCount = 0;
        let monthlyTrainingsCount = 0;
        const beltCount = {};

        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        snapshot.forEach((doc) => {
          const userData = doc.data();
          users.push({ id: doc.id, ...userData });

          // 🎯 CONTADOR TOTAL EXACTO - NUNCA SE MODIFICA
          totalTrainingsCount += userData.allTimeCheckIns || 0;

          // Contar entrenamientos del mes actual
          const monthlyData = userData.monthlyCheckInCount || {};
          monthlyTrainingsCount += monthlyData[currentMonth] || 0;

          // Distribución de cinturones
          const belt = userData.cinturon || 'white';
          beltCount[belt] = (beltCount[belt] || 0) + 1;
        });

        setTotalUsers(users.length);
        setActiveUsers(users.filter(u => (u.allTimeCheckIns || 0) > 0).length);
        
        // 🎯 TOTAL DE ENTRENAMIENTOS SIEMPRE EXACTO
        setTotalTrainings(totalTrainingsCount);
        setMonthlyTrainings(monthlyTrainingsCount);
        setBeltDistribution(beltCount);

        // Top usuarios por entrenamientos
        const sortedUsers = users
          .sort((a, b) => (b.allTimeCheckIns || 0) - (a.allTimeCheckIns || 0))
          .slice(0, 5);
        setTopUsers(sortedUsers);
      });

      // Suscribirse a mensajes
      const messagesRef = collection(db, 'messages');
      const unsubscribeMessages = onSnapshot(messagesRef, (snapshot) => {
        setTotalMessages(snapshot.size);
      });

      // 🆕 OBTENER ACTIVIDAD RECIENTE CON FILTRO DE DÍAS
      await fetchRecentActivity();

      setLoading(false);

      // Cleanup function
      return () => {
        unsubscribeUsers();
        unsubscribeMessages();
      };
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      setLoading(false);
    }
  };

  // 🆕 FUNCIÓN MEJORADA PARA OBTENER ACTIVIDAD RECIENTE CON FILTRO DE 7 DÍAS
  const fetchRecentActivity = async () => {
    try {
      console.log(`🔍 Obteniendo actividad reciente de los últimos ${activityDaysFilter} días...`);
      
      // Calcular fecha límite (7 días atrás por defecto)
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - activityDaysFilter);
      daysAgo.setHours(0, 0, 0, 0); // Inicio del día
      
      const cutoffTimestamp = Timestamp.fromDate(daysAgo);
      
      console.log(`📅 Filtrando desde: ${daysAgo.toLocaleDateString('es-ES')}`);

      // 🆕 QUERY CON FILTRO DE FECHA
      const attendanceQuery = query(
        collection(db, 'attendanceHistory'),
        where('timestamp', '>=', cutoffTimestamp), // 🎯 FILTRO POR FECHA
        orderBy('timestamp', 'desc'),
        limit(50) // Aumentamos el límite para tener más datos dentro del rango
      );

      const attendanceSnapshot = await getDocs(attendanceQuery);
      const activities = [];

      attendanceSnapshot.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'training',
          userId: data.userId,
          username: data.username || 'Usuario',
          timestamp: data.timestamp,
        });
      });

      console.log(`✅ Actividad reciente cargada: ${activities.length} entrenamientos en ${activityDaysFilter} días`);
      setRecentActivity(activities);
      
    } catch (error) {
      console.error('Error al obtener actividad reciente:', error);
      setRecentActivity([]);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDashboardData().finally(() => setRefreshing(false));
  }, []);

  // 🆕 TOGGLE PARA MOSTRAR/OCULTAR ACTIVIDAD RECIENTE
  const toggleRecentActivity = async (value) => {
    setShowRecentActivity(value);
    await saveActivitySettings(value, activityDaysFilter);
    
    if (value) {
      // Si se activa, recargar datos
      await fetchRecentActivity();
    }
  };

  // 🆕 CAMBIAR FILTRO DE DÍAS
  const changeActivityDaysFilter = (days) => {
    Alert.alert(
      'Cambiar Filtro de Días',
      `¿Mostrar actividad de los últimos ${days} días?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setActivityDaysFilter(days);
            await saveActivitySettings(showRecentActivity, days);
            await fetchRecentActivity();
          }
        }
      ]
    );
  };

  // ✅ FUNCIÓN DE NAVEGACIÓN CORREGIDA PARA TABVIEW
  const navigateToTab = (tabKey) => {
    try {
      console.log('🧭 Navegando a pestaña:', tabKey);
      
      // Buscar el contexto del TabView padre
      const parentNavigation = navigation?.getParent?.();
      
      if (parentNavigation) {
        // Si tenemos acceso al navegador padre
        console.log('✅ Usando navegador padre');
        parentNavigation.navigate(tabKey);
        return;
      }

      // Método alternativo: usar el contexto global si está disponible
      if (global.tabNavigationRef) {
        console.log('✅ Usando referencia global');
        global.tabNavigationRef.setIndex(getTabIndex(tabKey));
        return;
      }

      // Método alternativo: emitir evento personalizado
      console.log('✅ Emitiendo evento de navegación');
      if (global.tabNavigationEmitter) {
        global.tabNavigationEmitter.emit('navigateToTab', tabKey);
        return;
      }

      console.log('⚠️ No se pudo navegar - usando fallback');
      // Fallback: mostrar mensaje al usuario
      alert(`Navegar a ${tabKey}. Por favor, toca la pestaña correspondiente.`);
      
    } catch (error) {
      console.error('❌ Error de navegación:', error);
      alert(`Error al navegar. Por favor, toca la pestaña ${tabKey} manualmente.`);
    }
  };

  // ✅ FUNCIÓN AUXILIAR PARA OBTENER ÍNDICE DE PESTAÑA
  const getTabIndex = (tabKey) => {
    const tabMap = {
      'dashboard': 0,
      'users': 1,
      'products': 2,
      'gestionar': 3,
      'orders': 4,
      'messages': 5,
      'settings': 6,
      'backgrounds': 7,
    };
    return tabMap[tabKey] || 0;
  };

  const getBeltColor = (belt) => {
    const colors = {
      white: '#F3F4F6',
      blue: '#3B82F6',
      purple: '#8B5CF6',
      brown: '#A16207',
      black: '#111827',
    };
    return colors[belt?.toLowerCase()] || colors.white;
  };

  const getBeltTextColor = (belt) => {
    const darkBelts = ['purple', 'brown', 'black'];
    return darkBelts.includes(belt?.toLowerCase()) ? '#fff' : '#111827';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';

    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        return 'Hace unos minutos';
      } else if (diffInHours < 24) {
        return `Hace ${Math.floor(diffInHours)} horas`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays === 1) {
          return 'Ayer';
        } else if (diffInDays <= 7) {
          return `Hace ${diffInDays} días`;
        } else {
          return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      }
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  const renderStatCard = (title, value, icon, color = '#111827', subtitle = '') => (
    <AdminCard style={[styles.statCard, { width: (width - 48) / 2 }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </AdminCard>
  );

  const renderBeltDistribution = () => (
    <AdminCard style={styles.distributionCard}>
      <Text style={styles.sectionTitle}>Distribución de Cinturones</Text>
      <View style={styles.beltList}>
        {Object.entries(beltDistribution).map(([belt, count]) => (
          <View key={belt} style={styles.beltItem}>
            <View style={styles.beltInfo}>
              <View style={[styles.beltIndicator, { backgroundColor: getBeltColor(belt) }]} />
              <Text style={styles.beltName}>
                {belt.charAt(0).toUpperCase() + belt.slice(1)}
              </Text>
            </View>
            <Text style={styles.beltCount}>{count}</Text>
          </View>
        ))}
      </View>
    </AdminCard>
  );

  const renderTopUsers = () => (
    <AdminCard style={styles.topUsersCard}>
      <Text style={styles.sectionTitle}>Top Usuarios</Text>
      <View style={styles.usersList}>
        {topUsers.map((user, index) => (
          <View key={user.id} style={styles.userItem}>
            <View style={styles.userRank}>
              <Text style={styles.rankNumber}>{index + 1}</Text>
            </View>
            <View style={[
              styles.userAvatar,
              { backgroundColor: getBeltColor(user.cinturon) }
            ]}>
              <Text style={[
                styles.userAvatarText,
                { color: getBeltTextColor(user.cinturon) }
              ]}>
                {(user.nombre || user.username || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user.nombre || user.username || 'Usuario'}
              </Text>
              <Text style={styles.userTrainings}>
                {user.allTimeCheckIns || 0} entrenamientos
              </Text>
            </View>
          </View>
        ))}
      </View>
    </AdminCard>
  );

  // 🆕 COMPONENTE MEJORADO DE ACTIVIDAD RECIENTE CON CONTROLES
  const renderRecentActivity = () => {
    if (!showRecentActivity) {
      return null; // No mostrar si está desactivado
    }

    return (
      <AdminCard style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          
          {/* 🆕 CONTROLES DE FILTRO */}
          <View style={styles.activityControls}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                activityDaysFilter === 3 && styles.filterButtonActive
              ]}
              onPress={() => changeActivityDaysFilter(3)}
            >
              <Text style={[
                styles.filterButtonText,
                activityDaysFilter === 3 && styles.filterButtonTextActive
              ]}>3d</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                activityDaysFilter === 7 && styles.filterButtonActive
              ]}
              onPress={() => changeActivityDaysFilter(7)}
            >
              <Text style={[
                styles.filterButtonText,
                activityDaysFilter === 7 && styles.filterButtonTextActive
              ]}>7d</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                activityDaysFilter === 15 && styles.filterButtonActive
              ]}
              onPress={() => changeActivityDaysFilter(15)}
            >
              <Text style={[
                styles.filterButtonText,
                activityDaysFilter === 15 && styles.filterButtonTextActive
              ]}>15d</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🆕 INFORMACIÓN DEL FILTRO ACTUAL */}
        <View style={styles.filterInfo}>
          <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
          <Text style={styles.filterInfoText}>
            Mostrando últimos {activityDaysFilter} días • {recentActivity.length} entrenamientos
          </Text>
        </View>

        <View style={styles.activityList}>
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name="fitness-outline" size={20} color="#10B981" />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityText}>
                    <Text style={styles.activityUser}>{activity.username}</Text>
                    {' registró un entrenamiento'}
                  </Text>
                  <Text style={styles.activityTime}>
                    {formatDate(activity.timestamp)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noActivityContainer}>
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text style={styles.noActivityText}>
                No hay entrenamientos en los últimos {activityDaysFilter} días
              </Text>
              <Text style={styles.noActivitySubtext}>
                Los datos se limpian automáticamente cada día
              </Text>
            </View>
          )}
        </View>
      </AdminCard>
    );
  };

  // 🆕 COMPONENTE DE CONFIGURACIÓN DE ACTIVIDAD
  const renderActivitySettings = () => (
    <AdminCard style={styles.settingsCard}>
      <Text style={styles.sectionTitle}>Configuración de Actividad</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Mostrar Actividad Reciente</Text>
          <Text style={styles.settingDescription}>
            Controla si se muestra la sección de actividad reciente
          </Text>
        </View>
        <Switch
          value={showRecentActivity}
          onValueChange={toggleRecentActivity}
          trackColor={{ false: '#E5E7EB', true: '#10B981' }}
          thumbColor={showRecentActivity ? '#FFFFFF' : '#9CA3AF'}
        />
      </View>

      {showRecentActivity && (
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Filtro Actual</Text>
            <Text style={styles.settingDescription}>
              Últimos {activityDaysFilter} días • Limpieza automática diaria
            </Text>
          </View>
          <View style={styles.settingBadge}>
            <Text style={styles.settingBadgeText}>{activityDaysFilter}d</Text>
          </View>
        </View>
      )}

      {lastCleanupDate && (
        <View style={styles.cleanupInfo}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.cleanupText}>
            Última limpieza: {lastCleanupDate.toLocaleDateString('es-ES')}
          </Text>
        </View>
      )}
    </AdminCard>
  );

  // ✅ ACCIONES RÁPIDAS CORREGIDAS PARA TABVIEW
  const renderQuickActions = () => (
    <AdminCard style={styles.actionsCard}>
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      <View style={styles.actionButtons}>
        <AdminButton
          title="Ver Usuarios"
          icon="people-outline"
          variant="secondary"
          style={styles.actionButton}
          onPress={() => navigateToTab('users')}
        />
        <AdminButton
          title="Enviar Mensaje"
          icon="send-outline"
          variant="primary"
          style={styles.actionButton}
          onPress={() => navigateToTab('messages')}
        />
      </View>
      
      {/* ✅ FILA ADICIONAL DE ACCIONES */}
      <View style={[styles.actionButtons, { marginTop: 12 }]}>
        <AdminButton
          title="Productos"
          icon="cube-outline"
          variant="outline"
          style={styles.actionButton}
          onPress={() => navigateToTab('products')}
        />
        <AdminButton
          title="Pedidos"
          icon="receipt-outline"
          variant="outline"
          style={styles.actionButton}
          onPress={() => navigateToTab('orders')}
        />
      </View>

      {/* ✅ TERCERA FILA DE ACCIONES */}
      <View style={[styles.actionButtons, { marginTop: 12 }]}>
        <AdminButton
          title="Gestionar"
          icon="add-circle-outline"
          variant="outline"
          style={styles.actionButton}
          onPress={() => navigateToTab('gestionar')}
        />
        <AdminButton
          title="Fondos"
          icon="image-outline"
          variant="outline"
          style={styles.actionButton}
          onPress={() => navigateToTab('backgrounds')}
        />
      </View>
    </AdminCard>
  );

  if (loading) {
    return <AdminLoadingOverlay visible={true} text="Cargando dashboard..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader
        title="Panel de Control"
        subtitle="Resumen de la academia"
        rightComponent={
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#6B7280" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Estadísticas principales */}
        <View style={styles.statsRow}>
          {renderStatCard('Usuarios', totalUsers, 'people-outline', '#3B82F6')}
          {renderStatCard('Activos', activeUsers, 'checkmark-circle-outline', '#10B981')}
        </View>

        <View style={styles.statsRow}>
          {/* 🎯 CONTADOR TOTAL SIEMPRE EXACTO */}
          {renderStatCard('Entrenamientos', totalTrainings, 'fitness-outline', '#F59E0B', 'Total exacto')}
          {renderStatCard('Este Mes', monthlyTrainings, 'calendar-outline', '#8B5CF6')}
        </View>

        <View style={styles.statsRow}>
          {renderStatCard('Mensajes', totalMessages, 'chatbubbles-outline', '#EF4444')}
          {renderStatCard('Academia', '2025', 'school-outline', '#6B7280', 'Año actual')}
        </View>

        {/* Distribución de cinturones */}
        {renderBeltDistribution()}

        {/* Top usuarios */}
        {renderTopUsers()}

        {/* 🆕 CONFIGURACIÓN DE ACTIVIDAD */}
        {renderActivitySettings()}

        {/* 🆕 ACTIVIDAD RECIENTE MEJORADA */}
        {renderRecentActivity()}

        {/* Acciones rápidas */}
        {renderQuickActions()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  refreshButton: {
    padding: 8,
  },

  // Estadísticas
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statHeader: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Secciones
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },

  // Distribución de cinturones
  distributionCard: {
    marginBottom: 16,
  },
  beltList: {
    gap: 12,
  },
  beltItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  beltInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  beltIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  beltName: {
    fontSize: 16,
    color: '#111827',
  },
  beltCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Top usuarios
  topUsersCard: {
    marginBottom: 16,
  },
  usersList: {
    gap: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  userRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userTrainings: {
    fontSize: 14,
    color: '#6B7280',
  },

  // 🆕 ESTILOS PARA CONFIGURACIÓN DE ACTIVIDAD
  settingsCard: {
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  settingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  cleanupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cleanupText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 6,
  },

  // 🆕 ESTILOS PARA ACTIVIDAD RECIENTE MEJORADA
  activityCard: {
    marginBottom: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityControls: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  filterInfoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
  },
  activityUser: {
    fontWeight: '600',
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  noActivityContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noActivityText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  noActivitySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Acciones rápidas
  actionsCard: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

export default AdminDashboardScreen;

