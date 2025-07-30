// AdminOrdersScreen.js - Pantalla de pedidos admin sin i18n
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
} from 'react-native';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  where,
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

  // Navegar a detalle del pedido
  const navigateToOrderDetail = (order) => {
    navigation.navigate('OrderDetail', { order });
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
    const statusObj = orderStatuses.find(s => s.id === status);
    return statusObj ? statusObj.color : '#6B7280';
  };

  // Obtener texto del estado
  const getStatusText = (status) => {
    const statusObj = orderStatuses.find(s => s.id === status);
    return statusObj ? statusObj.name : 'Desconocido';
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
  const renderOrder = ({ item }) => (
    <AdminCard style={styles.orderCard}>
      <TouchableOpacity onPress={() => navigateToOrderDetail(item)}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
            <Text style={styles.customerName}>{item.customerName}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) }
          ]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <Text style={styles.itemsCount}>
            {item.items?.length || 0} producto{(item.items?.length || 0) !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.orderTotal}>
            {formatPrice(item.total)}
          </Text>
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
            onPress={() => navigateToOrderDetail(item)}
          >
            <Ionicons name="eye-outline" size={16} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Ver Detalle</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </AdminCard>
  );

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
    .reduce((sum, order) => sum + (order.total || 0), 0);

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
    marginBottom: 2,
  },
  customerName: {
    fontSize: 14,
    color: '#374151',
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
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
  
  // Actions
  orderActions: {
    flexDirection: 'row',
    gap: 8,
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
