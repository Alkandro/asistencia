// AdminOrdersScreen.js - Gestión de pedidos para administradores
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  AdminCard,
  AdminButton,
  AdminHeader,
  AdminDivider,
  AdminLoadingOverlay,
} from '../AdminScreen/AdminComponents';

const AdminOrdersScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [updating, setUpdating] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Filtros disponibles
  const filters = [
    { id: 'all', name: 'Todos', count: 0 },
    { id: 'pending', name: 'Pendientes', count: 0 },
    { id: 'processing', name: 'Procesando', count: 0 },
    { id: 'shipped', name: 'Enviados', count: 0 },
    { id: 'delivered', name: 'Entregados', count: 0 },
    { id: 'cancelled', name: 'Cancelados', count: 0 },
  ];

  // Estados de pedido disponibles
  const orderStatuses = [
    { id: 'pending', name: 'Pendiente', color: '#F59E0B', icon: 'time-outline' },
    { id: 'processing', name: 'Procesando', color: '#3B82F6', icon: 'cog-outline' },
    { id: 'shipped', name: 'Enviado', color: '#8B5CF6', icon: 'airplane-outline' },
    { id: 'delivered', name: 'Entregado', color: '#10B981', icon: 'checkmark-circle-outline' },
    { id: 'cancelled', name: 'Cancelado', color: '#EF4444', icon: 'close-circle-outline' },
  ];

  useEffect(() => {
    // Suscripción a todos los pedidos
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersList = [];
        snapshot.forEach((docSnap) => {
          ordersList.push({ id: docSnap.id, ...docSnap.data() });
        });
        setOrders(ordersList);
        setLoading(false);
      },
      (error) => {
        console.error('Error al obtener pedidos:', error);
        Alert.alert('Error', 'No se pudieron cargar los pedidos');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Aplicar filtros
    let filtered = orders;
    
    if (selectedFilter !== 'all') {
      filtered = orders.filter(order => order.status === selectedFilter);
    }
    
    setFilteredOrders(filtered);
    
    // Actualizar contadores de filtros
    filters.forEach(filter => {
      if (filter.id === 'all') {
        filter.count = orders.length;
      } else {
        filter.count = orders.filter(order => order.status === filter.id).length;
      }
    });
  }, [orders, selectedFilter]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  const getStatusInfo = (status) => {
    return orderStatuses.find(s => s.id === status) || orderStatuses[0];
  };

  const handleUpdateOrderStatus = async (order, newStatus) => {
    try {
      setUpdating(prev => ({ ...prev, [order.id]: true }));
      
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // Crear notificación para el usuario
      await addDoc(collection(db, 'notifications'), {
        type: 'order_update',
        title: 'Estado de Pedido Actualizado',
        message: `Tu pedido #${order.id.slice(-8).toUpperCase()} ha sido ${getStatusInfo(newStatus).name.toLowerCase()}`,
        data: {
          orderId: order.id,
          newStatus,
        },
        userId: order.userId,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      setShowStatusModal(false);
      setSelectedOrder(null);
      Alert.alert('Éxito', 'Estado del pedido actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar pedido:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado del pedido');
    } finally {
      setUpdating(prev => ({ ...prev, [order.id]: false }));
    }
  };

  const handleOrderPress = (order) => {
    navigation.navigate('OrderDetail', { order });
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderFilterTabs = () => (
    <View style={styles.filterTabs}>
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.id}
          style={[
            styles.filterTab,
            selectedFilter === filter.id && styles.filterTabActive
          ]}
          onPress={() => setSelectedFilter(filter.id)}
        >
          <Text style={[
            styles.filterTabText,
            selectedFilter === filter.id && styles.filterTabTextActive
          ]}>
            {filter.name}
          </Text>
          {filter.count > 0 && (
            <View style={[
              styles.filterBadge,
              selectedFilter === filter.id && styles.filterBadgeActive
            ]}>
              <Text style={[
                styles.filterBadgeText,
                selectedFilter === filter.id && styles.filterBadgeTextActive
              ]}>
                {filter.count}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOrderCard = ({ item: order }) => {
    const statusInfo = getStatusInfo(order.status);
    const isUpdating = updating[order.id];
    const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    return (
      <AdminCard style={styles.orderCard}>
        {/* Header del pedido */}
        <TouchableOpacity
          style={styles.orderHeader}
          onPress={() => handleOrderPress(order)}
          disabled={isUpdating}
        >
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>
              #{order.id.slice(-8).toUpperCase()}
            </Text>
            <Text style={styles.orderDate}>
              {formatDate(order.createdAt)}
            </Text>
          </View>
          
          <View style={styles.orderStatus}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
              <Ionicons name={statusInfo.icon} size={12} color="#fff" />
              <Text style={styles.statusBadgeText}>{statusInfo.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </View>
        </TouchableOpacity>

        <AdminDivider />

        {/* Información del cliente */}
        <View style={styles.customerInfo}>
          <View style={styles.customerRow}>
            <Ionicons name="person-outline" size={16} color="#6B7280" />
            <Text style={styles.customerText}>{order.userName || 'Cliente'}</Text>
          </View>
          <View style={styles.customerRow}>
            <Ionicons name="mail-outline" size={16} color="#6B7280" />
            <Text style={styles.customerText}>{order.userEmail || 'Email no disponible'}</Text>
          </View>
          <View style={styles.customerRow}>
            <Ionicons name="cube-outline" size={16} color="#6B7280" />
            <Text style={styles.customerText}>
              {totalItems} producto{totalItems !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <AdminDivider />

        {/* Resumen del pedido */}
        <View style={styles.orderSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>
              ${order.total?.toFixed(2) || '0.00'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pago</Text>
            <View style={styles.paymentStatus}>
              <Ionicons 
                name={order.paymentStatus === 'paid' ? 'checkmark-circle' : 'time'} 
                size={14} 
                color={order.paymentStatus === 'paid' ? '#10B981' : '#F59E0B'} 
              />
              <Text style={[
                styles.paymentStatusText,
                { color: order.paymentStatus === 'paid' ? '#10B981' : '#F59E0B' }
              ]}>
                {order.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}
              </Text>
            </View>
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.orderActions}>
          <AdminButton
            title="Ver Detalle"
            icon="eye-outline"
            variant="secondary"
            style={styles.actionButton}
            onPress={() => handleOrderPress(order)}
            disabled={isUpdating}
          />
          <AdminButton
            title="Cambiar Estado"
            icon="swap-horizontal-outline"
            variant="primary"
            style={styles.actionButton}
            onPress={() => {
              setSelectedOrder(order);
              setShowStatusModal(true);
            }}
            disabled={isUpdating}
          />
        </View>

        {isUpdating && (
          <View style={styles.updatingOverlay}>
            <Text style={styles.updatingText}>Actualizando...</Text>
          </View>
        )}
      </AdminCard>
    );
  };

  const renderStatusModal = () => (
    <Modal
      visible={showStatusModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowStatusModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setShowStatusModal(false)}
            style={styles.modalCloseButton}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Cambiar Estado</Text>
          <View style={styles.modalPlaceholder} />
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.modalSubtitle}>
            Pedido #{selectedOrder?.id.slice(-8).toUpperCase()}
          </Text>
          
          <View style={styles.statusOptions}>
            {orderStatuses.map((status) => (
              <TouchableOpacity
                key={status.id}
                style={[
                  styles.statusOption,
                  selectedOrder?.status === status.id && styles.statusOptionCurrent
                ]}
                onPress={() => handleUpdateOrderStatus(selectedOrder, status.id)}
              >
                <View style={[styles.statusIcon, { backgroundColor: status.color }]}>
                  <Ionicons name={status.icon} size={20} color="#fff" />
                </View>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusName}>{status.name}</Text>
                  {selectedOrder?.status === status.id && (
                    <Text style={styles.statusCurrent}>Estado actual</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>
        {selectedFilter === 'all' ? 'No hay pedidos' : `No hay pedidos ${filters.find(f => f.id === selectedFilter)?.name.toLowerCase()}`}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {selectedFilter === 'all' 
          ? 'Los pedidos aparecerán aquí cuando los usuarios realicen compras'
          : 'Cambia el filtro para ver otros pedidos'
        }
      </Text>
    </View>
  );

  const renderStats = () => {
    const totalRevenue = orders
      .filter(order => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + (order.total || 0), 0);
    
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const todayOrders = orders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const today = new Date();
      return orderDate.toDateString() === today.toDateString();
    }).length;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>${totalRevenue.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Ingresos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pendingOrders}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todayOrders}</Text>
          <Text style={styles.statLabel}>Hoy</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader
        title="Gestión de Pedidos"
        subtitle={`${orders.length} pedido${orders.length !== 1 ? 's' : ''} total${orders.length !== 1 ? 'es' : ''}`}
        rightComponent={
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#6B7280" />
          </TouchableOpacity>
        }
      />

      {orders.length > 0 && renderStats()}
      {renderFilterTabs()}

      {filteredOrders.length === 0 && !loading ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {renderStatusModal()}
      <AdminLoadingOverlay visible={loading} text="Cargando pedidos..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  refreshButton: {
    padding: 8,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Filter tabs
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTabActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterTabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  filterBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  filterBadgeActive: {
    backgroundColor: '#374151',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterBadgeTextActive: {
    color: '#fff',
  },

  // Orders list
  ordersList: {
    padding: 16,
  },
  orderCard: {
    marginBottom: 16,
    position: 'relative',
  },

  // Order header
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
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Customer info
  customerInfo: {
    marginBottom: 16,
    gap: 8,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerText: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Order summary
  orderSummary: {
    marginBottom: 16,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Order actions
  orderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },

  // Updating overlay
  updatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  updatingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Status modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalPlaceholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  statusOptions: {
    gap: 12,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusOptionCurrent: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  statusCurrent: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default AdminOrdersScreen;
