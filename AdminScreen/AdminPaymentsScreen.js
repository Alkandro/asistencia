// AdminPaymentsScreen_ADAPTADO.js - Panel de administración de pagos adaptado
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  where,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';

// // ✅ NUEVA FUNCIÓN PARA FORMATO DE MONEDA LOCALIZADO funcion universal
// const formatCurrency = (amount, locale = 'es-ES', currency = 'USD') => {
//   // Asegurarse de que amount es un número
//   const numberAmount = Number(amount) || 0;
  
//   return new Intl.NumberFormat(locale, {
//     style: 'currency',
//     currency: currency,
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0,
//   }).format(numberAmount);
// };


// ✅ FUNCIÓN OPTIMIZADA PARA YEN JAPONÉS (JPY) SIN DECIMALES
const formatCurrency = (amount) => {
  const numberAmount = Number(amount) || 0;
  
  // Usamos el locale japonés ('ja-JP') y la divisa 'JPY'.
  return new Intl.NumberFormat('ja-JP', { 
    style: 'currency',
    currency: 'JPY',
    // Aseguramos que no haya decimales
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numberAmount);
};

const AdminPaymentsScreen = () => {
  // ✅ ESTADOS PRINCIPALES
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  
  // ✅ ESTADOS DE FILTROS
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // ✅ ESTADOS DE ESTADÍSTICAS
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    conversionRate: 0
  });
  
  // ✅ ESTADOS DE MODALES
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentDetail, setShowPaymentDetail] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);

  // ✅ OPCIONES DE FILTRO
  const filterOptions = [
    { id: 'all', label: 'Todos', icon: 'list-outline' },
    { id: 'paid', label: 'Pagados', icon: 'checkmark-circle-outline' },
    { id: 'pending', label: 'Pendientes', icon: 'time-outline' },
    { id: 'failed', label: 'Fallidos', icon: 'close-circle-outline' },
    { id: 'refunded', label: 'Reembolsados', icon: 'return-down-back-outline' },
    { id: 'cash', label: 'Efectivo', icon: 'cash-outline' },
    { id: 'stripe', label: 'Tarjeta', icon: 'card-outline' }
  ];

  // ✅ CARGAR DATOS INICIALES
  useEffect(() => {
    loadPayments();
  }, []);

  // ✅ FILTRAR PAGOS CUANDO CAMBIAN LOS FILTROS
  useEffect(() => {
    filterPayments();
  }, [payments, selectedFilter, searchQuery]);

  // ✅ CARGAR PAGOS DESDE FIREBASE
  const loadPayments = () => {
    try {
      console.log('💳 Cargando pagos desde Firebase...');
      
      // Escuchar cambios en la colección de pedidos (orders)
      const ordersQuery = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        const paymentsData = [];
        
        snapshot.forEach((doc) => {
          const order = { id: doc.id, ...doc.data() };
          
          // Convertir pedido a formato de pago
          const payment = {
            id: order.id,
            orderId: order.id,
            orderNumber: order.orderNumber,
            amount: order.totals?.total || 0,
            currency: 'USD',
            status: mapOrderStatusToPaymentStatus(order.status, order.paymentStatus),
            paymentMethod: order.paymentMethod || 'unknown',
            paymentIntentId: order.paymentIntentId || null,
            customerEmail: order.userEmail,
            customerName: order.shippingAddress?.name || 'Cliente',
            description: `Pedido ${order.orderNumber} - ${order.items?.length || 0} productos`,
            createdAt: order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt),
            updatedAt: order.updatedAt?.toDate ? order.updatedAt.toDate() : new Date(order.updatedAt),
            
            // Información adicional del pedido
            items: order.items || [],
            shippingAddress: order.shippingAddress,
            totals: order.totals,
            
            // Metadatos
            platform: order.platform || 'mobile',
            version: order.version || '1.0.0'
          };
          
          paymentsData.push(payment);
        });
        
        console.log(`💳 ${paymentsData.length} pagos cargados`);
        setPayments(paymentsData);
        calculateStats(paymentsData);
        setLoading(false);
        setRefreshing(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error cargando pagos:', error);
      setLoading(false);
      setRefreshing(false);
      Alert.alert('Error', 'No se pudieron cargar los pagos');
    }
  };

  // ✅ MAPEAR ESTADO DE PEDIDO A ESTADO DE PAGO
  const mapOrderStatusToPaymentStatus = (orderStatus, paymentStatus) => {
    if (paymentStatus) {
      return paymentStatus; // paid, pending, failed, refunded
    }
    
    // Mapear basado en el estado del pedido
    switch (orderStatus) {
      case 'pending':
        return 'pending';
      case 'processing':
      case 'shipped':
      case 'delivered':
        return 'paid';
      case 'cancelled':
        return 'failed';
      default:
        return 'pending';
    }
  };

  // ✅ CALCULAR ESTADÍSTICAS
  const calculateStats = (paymentsData) => {
    const totalRevenue = paymentsData
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalTransactions = paymentsData.length;
    const successfulPayments = paymentsData.filter(p => p.status === 'paid').length;
    const pendingPayments = paymentsData.filter(p => p.status === 'pending').length;
    const failedPayments = paymentsData.filter(p => p.status === 'failed').length;
    
    const conversionRate = totalTransactions > 0 
      ? (successfulPayments / totalTransactions) * 100 
      : 0;

    setStats({
      totalRevenue,
      totalTransactions,
      successfulPayments,
      pendingPayments,
      failedPayments,
      conversionRate
    });
  };

  // ✅ FILTRAR PAGOS
  const filterPayments = () => {
    let filtered = [...payments];
    
    // Filtrar por estado
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'cash') {
        filtered = filtered.filter(p => 
          p.paymentMethod === 'cash_on_delivery' || 
          p.paymentMethod === 'cash_pickup'
        );
      } else if (selectedFilter === 'stripe') {
        filtered = filtered.filter(p => 
          p.paymentMethod === 'stripe' || 
          p.paymentMethod === 'card'
        );
      } else {
        filtered = filtered.filter(p => p.status === selectedFilter);
      }
    }
    
    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.orderNumber?.toLowerCase().includes(query) ||
        p.customerEmail?.toLowerCase().includes(query) ||
        p.customerName?.toLowerCase().includes(query) ||
        p.paymentIntentId?.toLowerCase().includes(query)
      );
    }
    
    setFilteredPayments(filtered);
  };

  // ✅ REFRESCAR DATOS
  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  // ✅ PROCESAR REEMBOLSO
  const processRefund = async () => {
    if (!selectedPayment || !refundAmount) {
      Alert.alert('Error', 'Datos incompletos para el reembolso');
      return;
    }

    try {
      setProcessingRefund(true);
      
      const refundAmountNum = parseFloat(refundAmount);
      if (isNaN(refundAmountNum) || refundAmountNum <= 0 || refundAmountNum > selectedPayment.amount) {
        Alert.alert('Error', 'Monto de reembolso inválido');
        return;
      }

      // En producción, aquí harías la llamada a Stripe para procesar el reembolso
      // const refund = await stripe.refunds.create({
      //   payment_intent: selectedPayment.paymentIntentId,
      //   amount: Math.round(refundAmountNum * 100),
      //   reason: refundReason || 'requested_by_customer'
      // });

      // Actualizar el pedido en Firebase
      await updateDoc(doc(db, 'orders', selectedPayment.orderId), {
        paymentStatus: 'refunded',
        refundAmount: refundAmountNum,
        refundReason: refundReason,
        refundedAt: new Date(),
        updatedAt: new Date()
      });

      // Registrar el reembolso
      await addDoc(collection(db, 'refunds'), {
        orderId: selectedPayment.orderId,
        paymentIntentId: selectedPayment.paymentIntentId,
        amount: refundAmountNum,
        reason: refundReason,
        processedBy: 'admin', // En producción, usar el ID del admin
        processedAt: new Date(),
        status: 'completed'
      });

      Alert.alert('Éxito', 'Reembolso procesado correctamente');
      setShowRefundModal(false);
      setRefundAmount('');
      setRefundReason('');
      setSelectedPayment(null);

    } catch (error) {
      console.error('❌ Error procesando reembolso:', error);
      Alert.alert('Error', 'No se pudo procesar el reembolso');
    } finally {
      setProcessingRefund(false);
    }
  };

  // ✅ OBTENER COLOR DEL ESTADO
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      case 'refunded': return '#6B7280';
      default: return null;
    }
  };

  // ✅ OBTENER ICONO DEL ESTADO
  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'failed': return 'close-circle';
      case 'refunded': return 'return-down-back';
      default: return null;
    }
  };

  // ✅ OBTENER ETIQUETA DEL ESTADO
  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'pending': return 'Pendiente';
      case 'failed': return 'Fallido';
      case 'refunded': return 'Reembolsado';
      default: return '';
    }
  };

  // ✅ OBTENER ICONO DEL MÉTODO DE PAGO
  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'stripe':
      case 'card': return 'card';
      case 'cash_on_delivery':
      case 'cash_pickup': return 'cash';
      default: return '';
    }
  };

  // ✅ OBTENER ETIQUETA DEL MÉTODO DE PAGO
  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'stripe':
      case 'card': return 'Tarjeta';
      case 'cash_on_delivery': return 'Contraentrega';
      case 'cash_pickup': return 'Efectivo en tienda';
      default: return '';
    }
  };

  // ✅ RENDERIZAR ESTADÍSTICAS
  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatCurrency(stats.totalRevenue)}
            </Text>
          <Text style={styles.statLabel}>Ingresos Totales</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalTransactions}</Text>
          <Text style={styles.statLabel}>Transacciones</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.conversionRate.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Tasa de Conversión</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pendingPayments}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
      </View>
    </View>
  );

  // ✅ RENDERIZAR FILTROS
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScroll}
      >
        {filterOptions.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              selectedFilter === filter.id && styles.filterChipActive
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Ionicons 
              name={filter.icon} 
              size={16} 
              color={selectedFilter === filter.id ? '#fff' : '#6B7280'} 
            />
            <Text style={[
              styles.filterChipText,
              selectedFilter === filter.id && styles.filterChipTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // ✅ RENDERIZAR TARJETA DE PAGO
  const renderPaymentCard = (payment) => (
    <TouchableOpacity
      key={payment.id}
      style={styles.paymentCard}
      onPress={() => {
        setSelectedPayment(payment);
        setShowPaymentDetail(true);
      }}
    >
      {/* Header del pago */}
      <View style={styles.paymentHeader}>
        <View style={styles.paymentHeaderLeft}>
          <Text style={styles.paymentOrderNumber}>#{payment.orderNumber}</Text>
          {getStatusColor(payment.status) !== null && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
            <Ionicons name={getStatusIcon(payment.status)} size={12} color="#fff" />
            <Text style={styles.statusBadgeText}>{getStatusLabel(payment.status)}</Text>
          </View>
          )}
        </View>
        
        <View style={styles.paymentMethodBadge}>
          <Ionicons name={getPaymentMethodIcon(payment.paymentMethod)} size={14} color="#6B7280" />
          <Text style={styles.paymentMethodText}>{getPaymentMethodLabel(payment.paymentMethod)}</Text>
        </View>
      </View>

      {/* Información del cliente */}
      <View style={styles.paymentInfo}>
        <Text style={styles.customerName}>{payment.customerName}</Text>
        <Text style={styles.customerEmail}>{payment.customerEmail}</Text>
        <Text style={styles.paymentDescription}>{payment.description}</Text>
      </View>

      {/* Total del pago */}
      <View style={styles.paymentTotalContainer}>
        <View style={styles.paymentTotalContent}>
          <Ionicons name="cash-outline" size={16} color="#10B981" />
          <Text style={styles.paymentTotalLabel}>Total:</Text>
          <Text style={styles.paymentTotalValue}>{formatCurrency(payment.amount)}</Text>
        </View>
      </View>

      {/* Footer con fecha */}
      <View style={styles.paymentFooter}>
        <Text style={styles.paymentDate}>
          {payment.createdAt.toLocaleDateString()} • {payment.createdAt.toLocaleTimeString()}
        </Text>
        
        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={() => {
            setSelectedPayment(payment);
            setShowPaymentDetail(true);
          }}
        >
          <Text style={styles.viewDetailsText}>Ver detalles</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // ✅ RENDERIZAR MODAL DE DETALLE
  const renderPaymentDetailModal = () => (
    <Modal
      visible={showPaymentDetail}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowPaymentDetail(false)}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Detalle del Pago</Text>
          <View style={{ width: 24 }} />
        </View>

        {selectedPayment && (
          <ScrollView style={styles.modalContent}>
            {/* Información básica */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Información del Pago</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Número de Pedido:</Text>
                <Text style={styles.detailValue}>{selectedPayment.orderNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estado:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedPayment.status) }]}>
                  <Ionicons name={getStatusIcon(selectedPayment.status)} size={12} color="#fff" />
                  <Text style={styles.statusBadgeText}>{getStatusLabel(selectedPayment.status)}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Método de Pago:</Text>
                <Text style={styles.detailValue}>{getPaymentMethodLabel(selectedPayment.paymentMethod)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Monto:</Text>
                <Text style={styles.detailValue}> {formatCurrency(selectedPayment.amount)}</Text>
              </View>
              {selectedPayment.paymentIntentId && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ID de Transacción:</Text>
                  <Text style={styles.detailValue}>{selectedPayment.paymentIntentId}</Text>
                </View>
              )}
            </View>

            {/* Información del cliente */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Cliente</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nombre:</Text>
                <Text style={styles.detailValue}>{selectedPayment.customerName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{selectedPayment.customerEmail}</Text>
              </View>
            </View>

            {/* Productos */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Productos ({selectedPayment.items?.length || 0})</Text>
              {selectedPayment.items?.map((item, index) => (
                <View key={index} style={styles.productItem}>
                  <Text style={styles.productName}>{item.productName}</Text>
                  <Text style={styles.productDetails}>
                  {formatCurrency(item.unitPrice)} x {item.quantity} = {formatCurrency(item.totalPrice)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Totales */}
            {selectedPayment.totals && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Totales</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Subtotal:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedPayment.totals.subtotal)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Impuestos:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedPayment.totals.tax)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Envío:</Text>
                  <Text style={styles.detailValue}>
                    {selectedPayment.totals.shipping === 0 ? 'Gratis' : formatCurrency(selectedPayment.totals.shipping)}
                  </Text>
                </View>
                <View style={[styles.detailRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>{formatCurrency(selectedPayment.totals.total)}</Text>
                </View>
              </View>
            )}

            {/* Acciones */}
            {selectedPayment.status === 'paid' && (
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.refundButton}
                  onPress={() => {
                    setShowPaymentDetail(false);
                    setShowRefundModal(true);
                  }}
                >
                  <Ionicons name="return-down-back-outline" size={20} color="#fff" />
                  <Text style={styles.refundButtonText}>Procesar Reembolso</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  // ✅ RENDERIZAR MODAL DE REEMBOLSO
  const renderRefundModal = () => (
    <Modal
      visible={showRefundModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.refundModalOverlay}>
        <View style={styles.refundModalContainer}>
          <View style={styles.refundModalHeader}>
            <Text style={styles.refundModalTitle}>Procesar Reembolso</Text>
            <TouchableOpacity onPress={() => setShowRefundModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.refundModalContent}>
            <Text style={styles.refundModalSubtitle}>
              Pedido: {selectedPayment?.orderNumber}
            </Text>
            <Text style={styles.refundModalAmount}>
              Monto máximo: {formatCurrency(selectedPayment?.amount)}
            </Text>

            <View style={styles.refundInputGroup}>
              <Text style={styles.refundInputLabel}>Monto a reembolsar *</Text>
              <TextInput
                style={styles.refundInput}
                value={refundAmount}
                onChangeText={setRefundAmount}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.refundInputGroup}>
              <Text style={styles.refundInputLabel}>Razón del reembolso</Text>
              <TextInput
                style={[styles.refundInput, styles.refundTextArea]}
                value={refundReason}
                onChangeText={setRefundReason}
                placeholder="Describe la razón del reembolso..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.refundModalActions}>
              <TouchableOpacity
                style={styles.refundCancelButton}
                onPress={() => setShowRefundModal(false)}
              >
                <Text style={styles.refundCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.refundConfirmButton}
                onPress={processRefund}
                disabled={processingRefund || !refundAmount}
              >
                {processingRefund ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.refundConfirmText}>Procesar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando pagos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <Ionicons name="refresh" size={20} color="#3B82F6" />
          )}
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por pedido, email o ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Estadísticas */}
      {renderStats()}

      {/* Filtros */}
      {renderFilters()}

      {/* Lista de pagos */}
      <ScrollView
        style={styles.paymentsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredPayments.length > 0 ? (
          filteredPayments.map(renderPaymentCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No hay pagos</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery || selectedFilter !== 'all' 
                ? 'No se encontraron pagos con los filtros aplicados'
                : 'Aún no se han procesado pagos'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modales */}
      {renderPaymentDetailModal()}
      {renderRefundModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  refreshButton: {
    padding: 8,
  },
  
  // Búsqueda
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  
  // Estadísticas
  statsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  // Filtros
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersScroll: {
    paddingHorizontal: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  
  // Lista de pagos
  paymentsList: {
    flex: 1,
    padding: 20,
  },
  paymentCard: {
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
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentOrderNumber: {
    fontSize: 11,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  paymentMethodText: {
    fontSize: 12,
    color: '#6B7280',
  },
  paymentInfo: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  paymentTotalContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  paymentTotalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  paymentTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paymentDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  
  // Estado vacío
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  
  // Modales
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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  
  // Detalles
  detailSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 10,
    fontWeight: '500',
    color: '#111827',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 12,
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
  productItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  },
  
  // Acciones
  actionsContainer: {
    marginBottom: 40,
  },
  refundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  refundButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Modal de reembolso
  refundModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refundModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    maxHeight: '80%',
  },
  refundModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  refundModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  refundModalContent: {
    padding: 20,
  },
  refundModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  refundModalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  refundInputGroup: {
    marginBottom: 16,
  },
  refundInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  refundInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  refundTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  refundModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  refundCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  refundCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  refundConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#EF4444',
  },
  refundConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default AdminPaymentsScreen;


