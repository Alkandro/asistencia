// AdminSalesScreen.js - Pantalla de gestión de ventas para administradores
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
  Modal,
  ScrollView,
} from 'react-native';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
  getDocs,
  startAfter,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  AdminCard,
  AdminButton,
  AdminHeader,
  AdminDivider,
  AdminLoadingOverlay,
} from '../AdminScreen/AdminComponents';

const AdminSalesScreen = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('today'); // today, week, month, all
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Estados de estadísticas
  const [totalSales, setTotalSales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [averageOrder, setAverageOrder] = useState(0);
  const [topProducts, setTopProducts] = useState([]);

  // Cargar pedidos desde Firebase
  useEffect(() => {
    loadOrders();
  }, [selectedPeriod]);

  const loadOrders = () => {
    setLoading(true);
    
    const ordersRef = collection(db, 'orders');
    let q = query(ordersRef, orderBy('createdAt', 'desc'));

    // Filtrar por período
    if (selectedPeriod !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (selectedPeriod) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      q = query(ordersRef, where('createdAt', '>=', startDate), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = [];
      snapshot.forEach((doc) => {
        ordersData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      setOrders(ordersData);
      calculateStatistics(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading orders:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  // Calcular estadísticas
  const calculateStatistics = (ordersData) => {
    const total = ordersData.reduce((sum, order) => sum + (order.total || 0), 0);
    const count = ordersData.length;
    const average = count > 0 ? total / count : 0;

    setTotalSales(total);
    setTotalOrders(count);
    setAverageOrder(average);

    // Calcular productos más vendidos
    const productCounts = {};
    ordersData.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const key = item.productId || item.productName;
          if (productCounts[key]) {
            productCounts[key].quantity += item.quantity;
            productCounts[key].revenue += (item.unitPrice || item.price) * item.quantity;
          } else {
            productCounts[key] = {
              name: item.productName,
              quantity: item.quantity,
              revenue: (item.unitPrice || item.price) * item.quantity,
            };
          }
        });
      }
    });

    const topProductsArray = Object.entries(productCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    setTopProducts(topProductsArray);
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

  // Función de refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    loadOrders();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Formatear precio
  const formatPrice = (price) => `$${price.toFixed(2)}`;

  // Formatear fecha
  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener color del estado
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
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
    switch (status?.toLowerCase()) {
      case 'pending': return 'Pendiente';
      case 'processing': return 'Procesando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status || 'Desconocido';
    }
  };

  // Renderizar estadísticas
  const renderStatistics = () => (
    <AdminCard style={styles.statsCard}>
      <AdminHeader
        title="Estadísticas de Ventas"
        subtitle={`Período: ${getPeriodText()}`}
        rightComponent={
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
        }
      />
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatPrice(totalSales)}</Text>
          <Text style={styles.statLabel}>Ventas Totales</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalOrders}</Text>
          <Text style={styles.statLabel}>Pedidos</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatPrice(averageOrder)}</Text>
          <Text style={styles.statLabel}>Promedio</Text>
        </View>
      </View>

      {topProducts.length > 0 && (
        <>
          <AdminDivider />
          <Text style={styles.sectionTitle}>Productos Más Vendidos</Text>
          {topProducts.map((product, index) => (
            <View key={product.id} style={styles.topProductItem}>
              <View style={styles.topProductRank}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.topProductInfo}>
                <Text style={styles.topProductName}>{product.name}</Text>
                <Text style={styles.topProductStats}>
                  {product.quantity} vendidos • {formatPrice(product.revenue)}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}
    </AdminCard>
  );

  // Renderizar pedido
  const renderOrder = ({ item }) => (
    <AdminCard style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>Pedido #{item.orderNumber || item.id.slice(-6)}</Text>
          <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.customerName}>Cliente: {item.customerName || 'N/A'}</Text>
        <Text style={styles.orderTotal}>Total: {formatPrice(item.total || 0)}</Text>
        
        {item.items && (
          <Text style={styles.itemCount}>
            {item.items.length} producto{item.items.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
        >
          <Ionicons name="eye-outline" size={16} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Ver Detalle</Text>
        </TouchableOpacity>

        {item.status === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.processButton]}
            onPress={() => updateOrderStatus(item.id, 'processing')}
          >
            <Ionicons name="play-outline" size={16} color="#10B981" />
            <Text style={[styles.actionButtonText, { color: '#10B981' }]}>Procesar</Text>
          </TouchableOpacity>
        )}

        {item.status === 'processing' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.shipButton]}
            onPress={() => updateOrderStatus(item.id, 'shipped')}
          >
            <Ionicons name="airplane-outline" size={16} color="#8B5CF6" />
            <Text style={[styles.actionButtonText, { color: '#8B5CF6' }]}>Enviar</Text>
          </TouchableOpacity>
        )}
      </View>
    </AdminCard>
  );

  // Obtener texto del período
  const getPeriodText = () => {
    switch (selectedPeriod) {
      case 'today': return 'Hoy';
      case 'week': return 'Última semana';
      case 'month': return 'Último mes';
      case 'all': return 'Todo el tiempo';
      default: return 'Personalizado';
    }
  };

  // Renderizar modal de filtros
  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filtrar Período</Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowFilterModal(false)}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {[
            { key: 'today', label: 'Hoy', icon: 'today-outline' },
            { key: 'week', label: 'Última semana', icon: 'calendar-outline' },
            { key: 'month', label: 'Último mes', icon: 'calendar-outline' },
            { key: 'all', label: 'Todo el tiempo', icon: 'infinite-outline' },
          ].map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodOption,
                selectedPeriod === period.key && styles.periodOptionSelected
              ]}
              onPress={() => {
                setSelectedPeriod(period.key);
                setShowFilterModal(false);
              }}
            >
              <Ionicons 
                name={period.icon} 
                size={20} 
                color={selectedPeriod === period.key ? '#3B82F6' : '#6B7280'} 
              />
              <Text style={[
                styles.periodOptionText,
                selectedPeriod === period.key && styles.periodOptionTextSelected
              ]}>
                {period.label}
              </Text>
              {selectedPeriod === period.key && (
                <Ionicons name="checkmark" size={20} color="#3B82F6" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader
        title="Gestión de Ventas"
        subtitle={`${orders.length} pedidos encontrados`}
      />

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderStatistics}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
          />
        }
        ListEmptyComponent={
          !loading && (
            <AdminCard style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Sin pedidos</Text>
              <Text style={styles.emptySubtitle}>
                No hay pedidos en el período seleccionado
              </Text>
            </AdminCard>
          )
        }
      />

      {renderFilterModal()}
      
      {loading && <AdminLoadingOverlay />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  
  // Statistics
  statsCard: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  
  // Top Products
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  topProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  topProductRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  topProductInfo: {
    flex: 1,
  },
  topProductName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  topProductStats: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Orders
  orderCard: {
    marginBottom: 12,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  orderDetails: {
    marginBottom: 16,
  },
  customerName: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 12,
    color: '#6B7280',
  },
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
  },
  processButton: {
    backgroundColor: '#ECFDF5',
  },
  shipButton: {
    backgroundColor: '#F3E8FF',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  
  // Filter Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  periodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
    gap: 12,
  },
  periodOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  periodOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  periodOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: '500',
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
  },
});

export default AdminSalesScreen;
