// OrderHistoryScreen.js - Pantalla de historial de pedidos para usuarios
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const OrderHistoryScreen = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar pedidos del usuario
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = [];
      snapshot.forEach((doc) => {
        ordersData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading orders:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Función de refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Formatear fecha
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Formatear precio
  const formatPrice = (price) => `$${price.toFixed(2)}`;

  // Obtener color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'processing': return '#3B82F6';
      case 'shipped': return '#8B5CF6';
      case 'delivered': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // Obtener texto del estado
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'processing': return 'Procesando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  // Navegar a detalle del pedido
  const navigateToOrderDetail = (order) => {
    navigation.navigate('OrderDetail', { order });
  };

  // Renderizar item del pedido
  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigateToOrderDetail(item)}
    >
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

      <View style={styles.orderItems}>
        {item.items?.slice(0, 2).map((orderItem, index) => (
          <View key={index} style={styles.orderItemRow}>
            {orderItem.productImage && (
              <Image 
                source={{ uri: orderItem.productImage }} 
                style={styles.productImage} 
              />
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>
                {orderItem.productName}
              </Text>
              <Text style={styles.productDetails}>
                {orderItem.size && `Talla: ${orderItem.size}`}
                {orderItem.color && ` • Color: ${orderItem.color}`}
              </Text>
              <Text style={styles.productQuantity}>
                Cantidad: {orderItem.quantity}
              </Text>
            </View>
            <Text style={styles.productPrice}>
              {formatPrice(orderItem.unitPrice)}
            </Text>
          </View>
        ))}
        
        {item.items?.length > 2 && (
          <Text style={styles.moreItems}>
            +{item.items.length - 2} producto{item.items.length - 2 !== 1 ? 's' : ''} más
          </Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>{formatPrice(item.total)}</Text>
        </View>
        <View style={styles.viewDetailButton}>
          <Text style={styles.viewDetailText}>Ver detalle</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Renderizar estado vacío
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Sin pedidos</Text>
      <Text style={styles.emptySubtitle}>
        Aún no has realizado ningún pedido
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Shop')}
      >
        <Ionicons name="storefront-outline" size={20} color="#fff" />
        <Text style={styles.shopButtonText}>Ir a la Tienda</Text>
      </TouchableOpacity>
    </View>
  );

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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Pedidos</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerPlaceholder: {
    width: 40,
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
  
  // List
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  
  // Order Card
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  
  // Order Items
  orderItems: {
    marginBottom: 16,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  productDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
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
  moreItems: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Order Footer
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  viewDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
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
    marginBottom: 32,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderHistoryScreen;
