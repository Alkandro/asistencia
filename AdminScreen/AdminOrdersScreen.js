// // AdminOrdersScreen.js - Pantalla de pedidos admin sin i18n
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   SafeAreaView,
//   RefreshControl,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import {
//   collection,
//   onSnapshot,
//   query,
//   orderBy,
//   doc,
//   updateDoc,
//   where,
// } from 'firebase/firestore';
// import { db } from '../firebase';
// import { useNavigation } from '@react-navigation/native';
// import { Ionicons } from '@expo/vector-icons';
// import {
//   AdminCard,
//   AdminButton,
//   AdminHeader,
// } from './AdminComponents';

// const AdminOrdersScreen = () => {
//   const navigation = useNavigation();
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [selectedStatus, setSelectedStatus] = useState('all');

//   // Estados de pedidos
//   const orderStatuses = [
//     { id: 'all', name: 'Todos', color: '#6B7280' },
//     { id: 'pending', name: 'Pendientes', color: '#F59E0B' },
//     { id: 'processing', name: 'Procesando', color: '#3B82F6' },
//     { id: 'shipped', name: 'Enviados', color: '#8B5CF6' },
//     { id: 'delivered', name: 'Entregados', color: '#10B981' },
//     { id: 'cancelled', name: 'Cancelados', color: '#EF4444' },
//   ];

//   // Cargar pedidos desde Firebase
//   useEffect(() => {
//     const ordersRef = collection(db, 'orders');
//     const q = query(ordersRef, orderBy('createdAt', 'desc'));

//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const ordersData = [];
//       snapshot.forEach((doc) => {
//         ordersData.push({
//           id: doc.id,
//           ...doc.data(),
//         });
//       });
//       setOrders(ordersData);
//       setLoading(false);
//     }, (error) => {
//       console.error('Error loading orders:', error);
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   // Filtrar pedidos por estado
//   const filteredOrders = selectedStatus === 'all' 
//     ? orders 
//     : orders.filter(order => order.status === selectedStatus);

//   // Función de refresh
//   const handleRefresh = async () => {
//     setRefreshing(true);
//     setTimeout(() => setRefreshing(false), 1000);
//   };

//   // Actualizar estado del pedido
//   const updateOrderStatus = async (orderId, newStatus) => {
//     try {
//       const orderRef = doc(db, 'orders', orderId);
//       await updateDoc(orderRef, {
//         status: newStatus,
//         updatedAt: new Date(),
//       });
//       Alert.alert('Éxito', 'Estado del pedido actualizado');
//     } catch (error) {
//       console.error('Error updating order status:', error);
//       Alert.alert('Error', 'No se pudo actualizar el estado del pedido');
//     }
//   };

//   // Mostrar opciones de estado
//   const showStatusOptions = (order) => {
//     const statusOptions = orderStatuses
//       .filter(status => status.id !== 'all' && status.id !== order.status)
//       .map(status => ({
//         text: status.name,
//         onPress: () => updateOrderStatus(order.id, status.id)
//       }));

//     Alert.alert(
//       'Cambiar Estado',
//       `Pedido #${order.orderNumber}`,
//       [
//         ...statusOptions,
//         { text: 'Cancelar', style: 'cancel' }
//       ]
//     );
//   };

//   // Navegar a detalle del pedido
//   const navigateToOrderDetail = (order) => {
//     navigation.navigate('OrderDetail', { order });
//   };

//   // Formatear fecha
//   const formatDate = (timestamp) => {
//     if (!timestamp) return '';
//     const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
//     return date.toLocaleDateString('es-ES', {
//       day: '2-digit',
//       month: '2-digit',
//       year: 'numeric',
//     });
//   };

//   // Formatear precio
//   const formatPrice = (price) => `$${price.toFixed(2)}`;

//   // Obtener color del estado
//   const getStatusColor = (status) => {
//     const statusObj = orderStatuses.find(s => s.id === status);
//     return statusObj ? statusObj.color : '#6B7280';
//   };

//   // Obtener texto del estado
//   const getStatusText = (status) => {
//     const statusObj = orderStatuses.find(s => s.id === status);
//     return statusObj ? statusObj.name : 'Desconocido';
//   };

//   // Renderizar filtro de estado
//   const renderStatusFilter = () => (
//     <View style={styles.statusFilter}>
//       <FlatList
//         data={orderStatuses}
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             style={[
//               styles.statusChip,
//               selectedStatus === item.id && styles.statusChipSelected,
//               selectedStatus === item.id && { backgroundColor: item.color }
//             ]}
//             onPress={() => setSelectedStatus(item.id)}
//           >
//             <Text style={[
//               styles.statusChipText,
//               selectedStatus === item.id && styles.statusChipTextSelected
//             ]}>
//               {item.name}
//             </Text>
//             {item.id !== 'all' && (
//               <View style={styles.statusCount}>
//                 <Text style={styles.statusCountText}>
//                   {orders.filter(order => order.status === item.id).length}
//                 </Text>
//               </View>
//             )}
//           </TouchableOpacity>
//         )}
//         contentContainerStyle={styles.statusFilterContent}
//       />
//     </View>
//   );

//   // Renderizar pedido
//   const renderOrder = ({ item }) => (
//     <AdminCard style={styles.orderCard}>
//       <TouchableOpacity onPress={() => navigateToOrderDetail(item)}>
//         <View style={styles.orderHeader}>
//           <View style={styles.orderInfo}>
//             <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
//             <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
//             <Text style={styles.customerName}>{item.customerName}</Text>
//           </View>
//           <View style={[
//             styles.statusBadge,
//             { backgroundColor: getStatusColor(item.status) }
//           ]}>
//             <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
//           </View>
//         </View>

//         <View style={styles.orderDetails}>
//           <Text style={styles.itemsCount}>
//             {item.items?.length || 0} producto{(item.items?.length || 0) !== 1 ? 's' : ''}
//           </Text>
//           <Text style={styles.orderTotal}>
//             {formatPrice(item.total)}
//           </Text>
//         </View>

//         <View style={styles.orderActions}>
//           <TouchableOpacity
//             style={styles.actionButton}
//             onPress={() => showStatusOptions(item)}
//           >
//             <Ionicons name="swap-horizontal-outline" size={16} color="#3B82F6" />
//             <Text style={styles.actionButtonText}>Cambiar Estado</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.actionButton}
//             onPress={() => navigateToOrderDetail(item)}
//           >
//             <Ionicons name="eye-outline" size={16} color="#3B82F6" />
//             <Text style={styles.actionButtonText}>Ver Detalle</Text>
//           </TouchableOpacity>
//         </View>
//       </TouchableOpacity>
//     </AdminCard>
//   );

//   // Renderizar estado vacío
//   const renderEmptyState = () => (
//     <AdminCard style={styles.emptyCard}>
//       <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
//       <Text style={styles.emptyTitle}>
//         {selectedStatus === 'all' ? 'Sin pedidos' : `Sin pedidos ${getStatusText(selectedStatus).toLowerCase()}`}
//       </Text>
//       <Text style={styles.emptySubtitle}>
//         {selectedStatus === 'all' 
//           ? 'Los pedidos aparecerán aquí cuando los usuarios realicen compras'
//           : 'No hay pedidos con este estado actualmente'
//         }
//       </Text>
//       {selectedStatus !== 'all' && (
//         <AdminButton
//           title="Ver Todos los Pedidos"
//           onPress={() => setSelectedStatus('all')}
//           variant="secondary"
//           style={styles.emptyButton}
//         />
//       )}
//     </AdminCard>
//   );

//   // Calcular estadísticas rápidas
//   const totalOrders = orders.length;
//   const pendingOrders = orders.filter(order => order.status === 'pending').length;
//   const totalRevenue = orders
//     .filter(order => order.status !== 'cancelled')
//     .reduce((sum, order) => sum + (order.total || 0), 0);

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#3B82F6" />
//           <Text style={styles.loadingText}>Cargando pedidos...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <AdminHeader
//         title="Pedidos"
//         subtitle={`${totalOrders} pedidos • ${pendingOrders} pendientes`}
//         rightComponent={
//           <View style={styles.headerStats}>
//             <Text style={styles.revenueText}>{formatPrice(totalRevenue)}</Text>
//             <Text style={styles.revenueLabel}>Ingresos</Text>
//           </View>
//         }
//       />

//       {renderStatusFilter()}

//       <View style={styles.resultsContainer}>
//         <Text style={styles.resultsText}>
//           {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''}
//           {selectedStatus !== 'all' && ` • ${getStatusText(selectedStatus)}`}
//         </Text>
//       </View>

//       <FlatList
//         data={filteredOrders}
//         renderItem={renderOrder}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={styles.listContent}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={handleRefresh}
//             tintColor="#3B82F6"
//           />
//         }
//         ListEmptyComponent={renderEmptyState}
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
  
//   // Loading
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#6B7280',
//   },
  
//   // Header Stats
//   headerStats: {
//     alignItems: 'flex-end',
//   },
//   revenueText: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#10B981',
//   },
//   revenueLabel: {
//     fontSize: 12,
//     color: '#6B7280',
//   },
  
//   // Status Filter
//   statusFilter: {
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//   },
//   statusFilterContent: {
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   statusChip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 20,
//     backgroundColor: '#F3F4F6',
//     marginRight: 8,
//     gap: 6,
//   },
//   statusChipSelected: {
//     backgroundColor: '#3B82F6',
//   },
//   statusChipText: {
//     fontSize: 12,
//     fontWeight: '500',
//     color: '#6B7280',
//   },
//   statusChipTextSelected: {
//     color: '#fff',
//   },
//   statusCount: {
//     backgroundColor: 'rgba(255, 255, 255, 0.3)',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 10,
//     minWidth: 20,
//     alignItems: 'center',
//   },
//   statusCountText: {
//     fontSize: 10,
//     fontWeight: '600',
//     color: '#fff',
//   },
  
//   // Results
//   resultsContainer: {
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//   },
//   resultsText: {
//     fontSize: 14,
//     color: '#6B7280',
//   },
  
//   // List
//   listContent: {
//     padding: 16,
//     paddingBottom: 32,
//   },
  
//   // Order Card
//   orderCard: {
//     marginBottom: 16,
//   },
//   orderHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 12,
//   },
//   orderInfo: {
//     flex: 1,
//   },
//   orderNumber: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#111827',
//     marginBottom: 4,
//   },
//   orderDate: {
//     fontSize: 12,
//     color: '#6B7280',
//     marginBottom: 2,
//   },
//   customerName: {
//     fontSize: 14,
//     color: '#374151',
//   },
//   statusBadge: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#fff',
//     textTransform: 'uppercase',
//   },
//   orderDetails: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: '#E5E7EB',
//   },
//   itemsCount: {
//     fontSize: 14,
//     color: '#6B7280',
//   },
//   orderTotal: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#111827',
//   },
  
//   // Actions
//   orderActions: {
//     flexDirection: 'row',
//     gap: 8,
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 6,
//     backgroundColor: '#EFF6FF',
//     gap: 4,
//     flex: 1,
//   },
//   actionButtonText: {
//     fontSize: 12,
//     fontWeight: '500',
//     color: '#3B82F6',
//   },
  
//   // Empty State
//   emptyCard: {
//     alignItems: 'center',
//     paddingVertical: 48,
//   },
//   emptyTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#6B7280',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptySubtitle: {
//     fontSize: 14,
//     color: '#9CA3AF',
//     textAlign: 'center',
//     marginBottom: 24,
//     paddingHorizontal: 32,
//   },
//   emptyButton: {
//     paddingHorizontal: 32,
//   },
// });

// export default AdminOrdersScreen;


// AdminOrdersScreen.js - Pantalla de pedidos admin con info de usuario y pago
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  AdminCard,
  AdminButton,
  AdminHeader,
} from './AdminComponents';

const AdminOrdersScreen = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [userDetails, setUserDetails] = useState({});

  // Estados de pedidos
  const orderStatuses = [
    { id: 'all', name: 'Todos', color: '#6B7280' },
    { id: 'pending', name: 'Pendientes', color: '#F59E0B' },
    { id: 'processing', name: 'Procesando', color: '#3B82F6' },
    { id: 'shipped', name: 'Enviados', color: '#8B5CF6' },
    { id: 'delivered', name: 'Entregados', color: '#10B981' },
    { id: 'cancelled', name: 'Cancelados', color: '#EF4444' },
  ];

  // Cargar pedidos desde Firebase
  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const ordersData = [];
      const userIds = new Set();
      
      snapshot.forEach((doc) => {
        const orderData = { id: doc.id, ...doc.data() };
        ordersData.push(orderData);
        if (orderData.userId) {
          userIds.add(orderData.userId);
        }
      });

      // Cargar información de usuarios
      const userDetailsMap = {};
      for (const userId of userIds) {
        try {
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            userDetailsMap[userId] = userSnap.data();
          }
        } catch (error) {
          console.error('Error loading user:', userId, error);
        }
      }

      setUserDetails(userDetailsMap);
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading orders:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filtrar pedidos por estado
  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  // Función de refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Actualizar estado del pedido
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date(),
      });
      Alert.alert('Éxito', 'Estado del pedido actualizado');
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado del pedido');
    }
  };

  // Mostrar opciones de estado
  const showStatusOptions = (order) => {
    const statusOptions = orderStatuses
      .filter(status => status.id !== 'all' && status.id !== order.status)
      .map(status => ({
        text: status.name,
        onPress: () => updateOrderStatus(order.id, status.id)
      }));

    Alert.alert(
      'Cambiar Estado',
      `Pedido #${order.orderNumber}`,
      [
        ...statusOptions,
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  // Mostrar detalle del pedido
  const showOrderDetailModal = (order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  // Formatear fecha
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formatear precio
  const formatPrice = (price) => `$${(parseFloat(price) || 0).toFixed(2)}`;

  // Obtener color del estado
  const getStatusColor = (status) => {
    const statusObj = orderStatuses.find(s => s.id === status);
    return statusObj ? statusObj.color : '#6B7280';
  };

  // Obtener texto del estado
  const getStatusText = (status) => {
    const statusObj = orderStatuses.find(s => s.id === status);
    return statusObj ? statusObj.name : 'Desconocido';
  };

  // Obtener información del usuario
  const getUserInfo = (userId) => {
    return userDetails[userId] || { 
      name: 'Usuario desconocido', 
      email: 'No disponible',
      phone: 'No disponible'
    };
  };

  // Renderizar filtro de estado
  const renderStatusFilter = () => (
    <View style={styles.statusFilter}>
      <FlatList
        data={orderStatuses}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.statusChip,
              selectedStatus === item.id && styles.statusChipSelected,
              selectedStatus === item.id && { backgroundColor: item.color }
            ]}
            onPress={() => setSelectedStatus(item.id)}
          >
            <Text style={[
              styles.statusChipText,
              selectedStatus === item.id && styles.statusChipTextSelected
            ]}>
              {item.name}
            </Text>
            {item.id !== 'all' && (
              <View style={styles.statusCount}>
                <Text style={styles.statusCountText}>
                  {orders.filter(order => order.status === item.id).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.statusFilterContent}
      />
    </View>
  );

  // Renderizar pedido
  const renderOrder = ({ item }) => {
    const userInfo = getUserInfo(item.userId);
    
    return (
      <AdminCard style={styles.orderCard}>
        <TouchableOpacity onPress={() => showOrderDetailModal(item)}>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
              <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) }
            ]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          </View>

          {/* Información del usuario */}
          <View style={styles.userInfo}>
            <View style={styles.userIcon}>
              <Ionicons name="person" size={16} color="#3B82F6" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userInfo.name}</Text>
              <Text style={styles.userEmail}>{userInfo.email}</Text>
              {userInfo.phone && userInfo.phone !== 'No disponible' && (
                <Text style={styles.userPhone}>📞 {userInfo.phone}</Text>
              )}
            </View>
          </View>

          {/* Información del pedido */}
          <View style={styles.orderDetails}>
            <View style={styles.orderSummary}>
              <Text style={styles.itemsCount}>
                {item.items?.length || 0} producto{(item.items?.length || 0) !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.orderTotal}>
                {formatPrice(item.total)}
              </Text>
            </View>
            
            {/* Información de pago */}
            {item.paymentInfo && (
              <View style={styles.paymentInfo}>
                <Ionicons name="card" size={14} color="#10B981" />
                <Text style={styles.paymentMethod}>
                  {item.paymentInfo.method || 'Tarjeta'} 
                  {item.paymentInfo.last4 && ` ****${item.paymentInfo.last4}`}
                </Text>
                {item.paymentInfo.status && (
                  <View style={[
                    styles.paymentStatus,
                    { backgroundColor: item.paymentInfo.status === 'paid' ? '#10B981' : '#F59E0B' }
                  ]}>
                    <Text style={styles.paymentStatusText}>
                      {item.paymentInfo.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.orderActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => showStatusOptions(item)}
            >
              <Ionicons name="swap-horizontal-outline" size={16} color="#3B82F6" />
              <Text style={styles.actionButtonText}>Cambiar Estado</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => showOrderDetailModal(item)}
            >
              <Ionicons name="eye-outline" size={16} color="#3B82F6" />
              <Text style={styles.actionButtonText}>Ver Detalle</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </AdminCard>
    );
  };

  // Renderizar modal de detalle
  const renderOrderDetailModal = () => {
    if (!selectedOrder) return null;
    
    const userInfo = getUserInfo(selectedOrder.userId);

    return (
      <Modal
        visible={showOrderDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOrderDetail(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalle del Pedido</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowOrderDetail(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Información del pedido */}
            <AdminCard style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Información del Pedido</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Número:</Text>
                <Text style={styles.detailValue}>#{selectedOrder.orderNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fecha:</Text>
                <Text style={styles.detailValue}>{formatDate(selectedOrder.createdAt)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estado:</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(selectedOrder.status) }
                ]}>
                  <Text style={styles.statusText}>{getStatusText(selectedOrder.status)}</Text>
                </View>
              </View>
            </AdminCard>

            {/* Información del cliente */}
            <AdminCard style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Información del Cliente</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nombre:</Text>
                <Text style={styles.detailValue}>{userInfo.name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{userInfo.email}</Text>
              </View>
              {userInfo.phone && userInfo.phone !== 'No disponible' && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Teléfono:</Text>
                  <Text style={styles.detailValue}>{userInfo.phone}</Text>
                </View>
              )}
            </AdminCard>

            {/* Información de pago */}
            {selectedOrder.paymentInfo && (
              <AdminCard style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Información de Pago</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Método:</Text>
                  <Text style={styles.detailValue}>
                    {selectedOrder.paymentInfo.method || 'Tarjeta de crédito'}
                  </Text>
                </View>
                {selectedOrder.paymentInfo.last4 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tarjeta:</Text>
                    <Text style={styles.detailValue}>****{selectedOrder.paymentInfo.last4}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Estado:</Text>
                  <View style={[
                    styles.paymentStatus,
                    { backgroundColor: selectedOrder.paymentInfo.status === 'paid' ? '#10B981' : '#F59E0B' }
                  ]}>
                    <Text style={styles.paymentStatusText}>
                      {selectedOrder.paymentInfo.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </Text>
                  </View>
                </View>
                {selectedOrder.paymentInfo.transactionId && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>ID Transacción:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.paymentInfo.transactionId}</Text>
                  </View>
                )}
              </AdminCard>
            )}

            {/* Productos */}
            <AdminCard style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Productos</Text>
              {selectedOrder.items?.map((item, index) => (
                <View key={index} style={styles.productItem}>
                  <Text style={styles.productName}>{item.productName}</Text>
                  <Text style={styles.productDetails}>
                    {item.size && `Talla: ${item.size}`}
                    {item.color && ` • Color: ${item.color}`}
                  </Text>
                  <View style={styles.productPricing}>
                    <Text style={styles.productQuantity}>Cantidad: {item.quantity}</Text>
                    <Text style={styles.productPrice}>{formatPrice(item.unitPrice)}</Text>
                  </View>
                </View>
              ))}
            </AdminCard>

            {/* Totales */}
            <AdminCard style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Resumen de Pago</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Subtotal:</Text>
                <Text style={styles.detailValue}>{formatPrice(selectedOrder.subtotal || 0)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Envío:</Text>
                <Text style={styles.detailValue}>{formatPrice(selectedOrder.shipping || 0)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Impuestos:</Text>
                <Text style={styles.detailValue}>{formatPrice(selectedOrder.tax || 0)}</Text>
              </View>
              <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>{formatPrice(selectedOrder.total)}</Text>
              </View>
            </AdminCard>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  // Renderizar estado vacío
  const renderEmptyState = () => (
    <AdminCard style={styles.emptyCard}>
      <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>
        {selectedStatus === 'all' ? 'Sin pedidos' : `Sin pedidos ${getStatusText(selectedStatus).toLowerCase()}`}
      </Text>
      <Text style={styles.emptySubtitle}>
        {selectedStatus === 'all' 
          ? 'Los pedidos aparecerán aquí cuando los usuarios realicen compras'
          : 'No hay pedidos con este estado actualmente'
        }
      </Text>
      {selectedStatus !== 'all' && (
        <AdminButton
          title="Ver Todos los Pedidos"
          onPress={() => setSelectedStatus('all')}
          variant="secondary"
          style={styles.emptyButton}
        />
      )}
    </AdminCard>
  );

  // Calcular estadísticas rápidas
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const totalRevenue = orders
    .filter(order => order.status !== 'cancelled')
    .reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando pedidos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader
        title="Pedidos"
        subtitle={`${totalOrders} pedidos • ${pendingOrders} pendientes`}
        rightComponent={
          <View style={styles.headerStats}>
            <Text style={styles.revenueText}>{formatPrice(totalRevenue)}</Text>
            <Text style={styles.revenueLabel}>Ingresos</Text>
          </View>
        }
      />

      {renderStatusFilter()}

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''}
          {selectedStatus !== 'all' && ` • ${getStatusText(selectedStatus)}`}
        </Text>
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {renderOrderDetailModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  
  // Header Stats
  headerStats: {
    alignItems: 'flex-end',
  },
  revenueText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  revenueLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Status Filter
  statusFilter: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    gap: 6,
  },
  statusChipSelected: {
    backgroundColor: '#3B82F6',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusChipTextSelected: {
    color: '#fff',
  },
  statusCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  statusCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Results
  resultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // List
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  
  // Order Card
  orderCard: {
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  
  // User Info
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    gap: 12,
  },
  userIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Order Details
  orderDetails: {
    marginBottom: 16,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemsCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  
  // Payment Info
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  paymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  paymentStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  
  // Actions
  orderActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    gap: 4,
    flex: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  
  // Detail Sections
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 2,
    textAlign: 'right',
  },
  totalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  
  // Product Items
  productItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  productDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  productPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  
  // Empty State
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  emptyButton: {
    paddingHorizontal: 32,
  },
});

export default AdminOrdersScreen;
