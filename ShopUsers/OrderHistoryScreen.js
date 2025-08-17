// OrderHistoryScreen.js - Pantalla de historial de pedidos para usuarios
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   SafeAreaView,
//   RefreshControl,
//   TouchableOpacity,
//   Image,
//   ActivityIndicator,
// } from 'react-native';
// import {
//   collection,
//   query,
//   where,
//   orderBy,
//   onSnapshot,
// } from 'firebase/firestore';
// import { db, auth } from '../firebase';
// import { useNavigation } from '@react-navigation/native';
// import { Ionicons } from '@expo/vector-icons';

// const OrderHistoryScreen = () => {
//   const navigation = useNavigation();
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   // Cargar pedidos del usuario
//   useEffect(() => {
//     const currentUser = auth.currentUser;
//     if (!currentUser) return;

//     const ordersRef = collection(db, 'orders');
//     const q = query(
//       ordersRef,
//       where('userId', '==', currentUser.uid),
//       orderBy('createdAt', 'desc')
//     );

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

//   // Función de refresh
//   const handleRefresh = async () => {
//     setRefreshing(true);
//     setTimeout(() => setRefreshing(false), 1000);
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
//     switch (status) {
//       case 'pending': return '#F59E0B';
//       case 'processing': return '#3B82F6';
//       case 'shipped': return '#8B5CF6';
//       case 'delivered': return '#10B981';
//       case 'cancelled': return '#EF4444';
//       default: return '#6B7280';
//     }
//   };

//   // Obtener texto del estado
//   const getStatusText = (status) => {
//     switch (status) {
//       case 'pending': return 'Pendiente';
//       case 'processing': return 'Procesando';
//       case 'shipped': return 'Enviado';
//       case 'delivered': return 'Entregado';
//       case 'cancelled': return 'Cancelado';
//       default: return 'Desconocido';
//     }
//   };

//   // Navegar a detalle del pedido
//   const navigateToOrderDetail = (order) => {
//     navigation.navigate('OrderDetail', { order });
//   };

//   // Renderizar item del pedido
//   const renderOrderItem = ({ item }) => (
//     <TouchableOpacity
//       style={styles.orderCard}
//       onPress={() => navigateToOrderDetail(item)}
//     >
//       <View style={styles.orderHeader}>
//         <View style={styles.orderInfo}>
//           <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
//           <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
//         </View>
//         <View style={[
//           styles.statusBadge,
//           { backgroundColor: getStatusColor(item.status) }
//         ]}>
//           <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
//         </View>
//       </View>

//       <View style={styles.orderItems}>
//         {item.items?.slice(0, 2).map((orderItem, index) => (
//           <View key={index} style={styles.orderItemRow}>
//             {orderItem.productImage && (
//               <Image 
//                 source={{ uri: orderItem.productImage }} 
//                 style={styles.productImage} 
//               />
//             )}
//             <View style={styles.productInfo}>
//               <Text style={styles.productName} numberOfLines={1}>
//                 {orderItem.productName}
//               </Text>
//               <Text style={styles.productDetails}>
//                 {orderItem.size && `Talla: ${orderItem.size}`}
//                 {orderItem.color && ` • Color: ${orderItem.color}`}
//               </Text>
//               <Text style={styles.productQuantity}>
//                 Cantidad: {orderItem.quantity}
//               </Text>
//             </View>
//             <Text style={styles.productPrice}>
//               {formatPrice(orderItem.unitPrice)}
//             </Text>
//           </View>
//         ))}
        
//         {item.items?.length > 2 && (
//           <Text style={styles.moreItems}>
//             +{item.items.length - 2} producto{item.items.length - 2 !== 1 ? 's' : ''} más
//           </Text>
//         )}
//       </View>

//       <View style={styles.orderFooter}>
//         <View style={styles.totalContainer}>
//           <Text style={styles.totalLabel}>Total:</Text>
//           <Text style={styles.totalAmount}>{formatPrice(item.total)}</Text>
//         </View>
//         <View style={styles.viewDetailButton}>
//           <Text style={styles.viewDetailText}>Ver detalle</Text>
//           <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
//         </View>
//       </View>
//     </TouchableOpacity>
//   );

//   // Renderizar estado vacío
//   const renderEmptyState = () => (
//     <View style={styles.emptyContainer}>
//       <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
//       <Text style={styles.emptyTitle}>Sin pedidos</Text>
//       <Text style={styles.emptySubtitle}>
//         Aún no has realizado ningún pedido
//       </Text>
//       <TouchableOpacity
//         style={styles.shopButton}
//         onPress={() => navigation.navigate('Shop')}
//       >
//         <Ionicons name="storefront-outline" size={20} color="#fff" />
//         <Text style={styles.shopButtonText}>Ir a la Tienda</Text>
//       </TouchableOpacity>
//     </View>
//   );

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
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#111827" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Mis Pedidos</Text>
//         <View style={styles.headerPlaceholder} />
//       </View>

//       <FlatList
//         data={orders}
//         renderItem={renderOrderItem}
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
  
//   // Header
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#F3F4F6',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#111827',
//   },
//   headerPlaceholder: {
//     width: 40,
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
  
//   // List
//   listContent: {
//     padding: 16,
//     paddingBottom: 32,
//   },
  
//   // Order Card
//   orderCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   orderHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
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
  
//   // Order Items
//   orderItems: {
//     marginBottom: 16,
//   },
//   orderItemRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   productImage: {
//     width: 50,
//     height: 50,
//     borderRadius: 8,
//     marginRight: 12,
//   },
//   productInfo: {
//     flex: 1,
//   },
//   productName: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#111827',
//     marginBottom: 2,
//   },
//   productDetails: {
//     fontSize: 12,
//     color: '#6B7280',
//     marginBottom: 2,
//   },
//   productQuantity: {
//     fontSize: 12,
//     color: '#6B7280',
//   },
//   productPrice: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#111827',
//   },
//   moreItems: {
//     fontSize: 12,
//     color: '#6B7280',
//     fontStyle: 'italic',
//     textAlign: 'center',
//     marginTop: 8,
//   },
  
//   // Order Footer
//   orderFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingTop: 16,
//     borderTopWidth: 1,
//     borderTopColor: '#E5E7EB',
//   },
//   totalContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   totalLabel: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginRight: 8,
//   },
//   totalAmount: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#111827',
//   },
//   viewDetailButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   viewDetailText: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#3B82F6',
//   },
  
//   // Empty State
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 64,
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
//     marginBottom: 32,
//   },
//   shopButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#3B82F6',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//     gap: 8,
//   },
//   shopButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// export default OrderHistoryScreen;


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  limit 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useTranslation } from 'react-i18next';

const OrderHistoryScreen = () => {
  const { t } = useTranslation();
  
  // ✅ ESTADOS
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // ✅ FILTROS DE ESTADO
  const statusFilters = [
    { key: 'all', label: 'Todos', icon: 'list-outline' },
    { key: 'pending', label: 'Pendientes', icon: 'time-outline', color: '#F59E0B' },
    { key: 'processing', label: 'Procesando', icon: 'sync-outline', color: '#3B82F6' },
    { key: 'shipped', label: 'Enviados', icon: 'airplane-outline', color: '#8B5CF6' },
    { key: 'delivered', label: 'Entregados', icon: 'checkmark-circle-outline', color: '#10B981' },
    { key: 'cancelled', label: 'Cancelados', icon: 'close-circle-outline', color: '#EF4444' }
  ];

  // ✅ CARGAR PEDIDOS DEL USUARIO
  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    console.log('📋 Cargando pedidos para usuario:', auth.currentUser.uid);

    const ordersRef = collection(db, 'orders');
    const ordersQuery = query(
      ordersRef,
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      console.log('📋 Snapshot recibido, documentos:', snapshot.docs.length);
      
      const ordersData = [];
      snapshot.forEach((doc) => {
        const orderData = { id: doc.id, ...doc.data() };
        console.log('📋 Pedido cargado:', orderData.orderNumber, orderData);
        ordersData.push(orderData);
      });

      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('❌ Error cargando pedidos:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ✅ FILTRAR PEDIDOS
  const filteredOrders = orders.filter(order => {
    if (selectedFilter === 'all') return true;
    return order.status === selectedFilter;
  });

  // ✅ OBTENER COLOR DEL ESTADO
  const getStatusColor = (status) => {
    const filter = statusFilters.find(f => f.key === status);
    return filter?.color || '#6B7280';
  };

  // ✅ OBTENER ICONO DEL ESTADO
  const getStatusIcon = (status) => {
    const filter = statusFilters.find(f => f.key === status);
    return filter?.icon || 'help-circle-outline';
  };

  // ✅ OBTENER LABEL DEL ESTADO
  const getStatusLabel = (status) => {
    const filter = statusFilters.find(f => f.key === status);
    return filter?.label || status;
  };

  // ✅ FORMATEAR FECHA
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha inválida';
    }
  };

  // ✅ CALCULAR TOTAL SEGURO
  const calculateSafeTotal = (totals) => {
    if (!totals) return '0.00';
    
    // Intentar diferentes propiedades para el total
    const total = totals.total || totals.finalTotal || totals.grandTotal || 0;
    
    if (typeof total === 'number' && !isNaN(total)) {
      return total.toFixed(2);
    }
    
    return '0.00';
  };

  // ✅ OBTENER CANTIDAD DE ITEMS SEGURA
  const getSafeItemCount = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.length;
  };

  // ✅ OBTENER PRECIO DE ITEM SEGURO
  const getSafeItemPrice = (item) => {
    if (!item) return '0.00';
    
    // Intentar diferentes propiedades para el precio
    const price = item.totalPrice || item.unitPrice || item.price || 0;
    
    if (typeof price === 'number' && !isNaN(price)) {
      return price.toFixed(2);
    }
    
    return '0.00';
  };

  // ✅ OBTENER CANTIDAD DE ITEM SEGURA
  const getSafeItemQuantity = (item) => {
    if (!item) return 1;
    
    const quantity = item.quantity || item.count || 1;
    
    if (typeof quantity === 'number' && !isNaN(quantity) && quantity > 0) {
      return quantity;
    }
    
    return 1;
  };

  // ✅ REFRESH
  const onRefresh = () => {
    setRefreshing(true);
    // Los datos se actualizan automáticamente por el listener
    setTimeout(() => setRefreshing(false), 1000);
  };

  // ✅ RENDERIZAR FILTROS
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {statusFilters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.filterButtonActive,
              filter.color && selectedFilter === filter.key && { backgroundColor: filter.color }
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Ionicons 
              name={filter.icon} 
              size={16} 
              color={selectedFilter === filter.key ? '#fff' : (filter.color || '#6B7280')} 
            />
            <Text style={[
              styles.filterButtonText,
              selectedFilter === filter.key && styles.filterButtonTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // 🆕 RENDERIZAR ITEM DE PEDIDO CON VALIDACIONES SEGURAS
  const renderOrderItem = (order) => {
    // ✅ VALIDACIONES SEGURAS
    const safeOrder = order || {};
    const safeItems = safeOrder.items || [];
    const safeTotals = safeOrder.totals || {};
    const safeShippingAddress = safeOrder.shippingAddress || {};
    
    console.log('🔍 Renderizando pedido:', safeOrder.orderNumber, {
      items: safeItems.length,
      totals: safeTotals,
      status: safeOrder.status
    });

    return (
      <View key={safeOrder.id || Math.random()} style={styles.orderCard}>
        {/* Header del pedido */}
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderRow}>
            <Text style={styles.orderNumber}>
              #{safeOrder.orderNumber || 'Sin número'}
            </Text>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: getStatusColor(safeOrder.status || 'pending') }
            ]}>
              <Ionicons 
                name={getStatusIcon(safeOrder.status || 'pending')} 
                size={12} 
                color="#fff" 
              />
              <Text style={styles.statusBadgeText}>
                {getStatusLabel(safeOrder.status || 'pending')}
              </Text>
            </View>
          </View>
          
          <Text style={styles.orderDate}>
            {formatDate(safeOrder.createdAt)}
          </Text>
        </View>

        {/* Información del pedido */}
        <View style={styles.orderInfo}>
          <View style={styles.orderInfoRow}>
            <Ionicons name="cube-outline" size={16} color="#6B7280" />
            <Text style={styles.orderInfoText}>
              {getSafeItemCount(safeItems)} producto{getSafeItemCount(safeItems) !== 1 ? 's' : ''}
            </Text>
          </View>
          
          {safeShippingAddress.city && (
            <View style={styles.orderInfoRow}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.orderInfoText}>
                {safeShippingAddress.city}, {safeShippingAddress.country || 'España'}
              </Text>
            </View>
          )}
          
          {safeOrder.trackingNumber && (
            <View style={styles.orderInfoRow}>
              <Ionicons name="airplane-outline" size={16} color="#6B7280" />
              <Text style={styles.orderInfoText}>
                Tracking: {safeOrder.trackingNumber}
              </Text>
            </View>
          )}
        </View>

        {/* Lista de productos */}
        <View style={styles.productsContainer}>
          <Text style={styles.productsTitle}>Productos:</Text>
          {safeItems.slice(0, 2).map((item, index) => {
            // ✅ VALIDACIÓN SEGURA DE CADA ITEM
            const safeItem = item || {};
            
            return (
              <View key={index} style={styles.productItem}>
                <View style={styles.productLeft}>
                  <Text style={styles.productName}>
                    {safeItem.productName || safeItem.name || 'Producto sin nombre'}
                  </Text>
                  {safeItem.size && (
                    <Text style={styles.productDetail}>Talla: {safeItem.size}</Text>
                  )}
                  {safeItem.color && (
                    <Text style={styles.productDetail}>Color: {safeItem.color}</Text>
                  )}
                </View>
                <View style={styles.productRight}>
                  <Text style={styles.productPrice}>
                    ${getSafeItemPrice(safeItem)}
                  </Text>
                  <Text style={styles.productQuantity}>
                    x{getSafeItemQuantity(safeItem)}
                  </Text>
                </View>
              </View>
            );
          })}
          
          {/* Mostrar "más productos" solo si hay más de 2 */}
          {getSafeItemCount(safeItems) > 2 && (
            <Text style={styles.moreItems}>
              +{getSafeItemCount(safeItems) - 2} producto{getSafeItemCount(safeItems) - 2 !== 1 ? 's' : ''} más
            </Text>
          )}
        </View>

        {/* Total del pedido */}
        <View style={styles.orderTotalContainer}>
          <View style={styles.orderTotalRow}>
            <Text style={styles.orderTotalLabel}>Total:</Text>
            <Text style={styles.orderTotal}>
              ${calculateSafeTotal(safeTotals)}
            </Text>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.orderActions}>
          {safeOrder.trackingNumber && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                Alert.alert(
                  'Número de Seguimiento',
                  safeOrder.trackingNumber,
                  [
                    { text: 'Copiar', onPress: () => {/* Implementar copia */} },
                    { text: 'Cerrar' }
                  ]
                );
              }}
            >
              <Ionicons name="location" size={16} color="#3B82F6" />
              <Text style={styles.actionButtonText}>Rastrear</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              Alert.alert(
                'Ayuda',
                '¿Necesitas ayuda con tu pedido? Contacta con nuestro soporte.',
                [
                  { text: 'Contactar', onPress: () => {/* Implementar contacto */} },
                  { text: 'Cerrar' }
                ]
              );
            }}
          >
            <Ionicons name="help-circle" size={16} color="#10B981" />
            <Text style={styles.actionButtonText}>Ayuda</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Pedidos</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      {renderFilters()}

      {/* Lista de pedidos */}
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredOrders.length > 0 ? (
          filteredOrders.map(renderOrderItem)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {selectedFilter === 'all' ? 'No tienes pedidos aún' : `No hay pedidos ${getStatusLabel(selectedFilter).toLowerCase()}`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === 'all' 
                ? 'Tus pedidos aparecerán aquí después de realizar una compra'
                : `Cambia el filtro para ver otros pedidos`
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  refreshButton: {
    padding: 8,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },

  // Filtros
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    gap: 4,
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },

  // Lista de pedidos
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
   
    marginBottom: 12,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // mantiene número y estado en la misma fila
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderInfo: {
    marginBottom: 12,
    gap: 4,
  },
  orderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderInfoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  productsContainer: {
    marginBottom: 12,
  },
  productsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productLeft: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  productDetail: {
    fontSize: 12,
    color: '#6B7280',
  },
  productRight: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  productQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  moreItems: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  orderTotalContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Estado vacío
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default OrderHistoryScreen;
