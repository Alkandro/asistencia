import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc,
  addDoc,
  where,
  limit,
  startAfter,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useTranslation } from 'react-i18next';

const AdminOrdersScreen = () => {
  const { t } = useTranslation();
  
  // ✅ ESTADOS PRINCIPALES
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  
  // ✅ ESTADOS DE FILTROS
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // ✅ ESTADOS DE MODAL
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  // 🆕 ESTADO PARA MODAL DE ELIMINACIÓN
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // ✅ ESTADOS DE EDICIÓN
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  // 🆕 ESTADO PARA RAZÓN DE ELIMINACIÓN
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  // ✅ ESTADÍSTICAS
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0
  });

  // 🆕 ESTADOS DE PAGINACIÓN
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // ✅ OPCIONES DE ESTADO
  const statusOptions = [
    { value: 'pending', label: 'Pendiente', color: '#F59E0B', icon: 'time-outline' },
    { value: 'processing', label: 'Procesando', color: '#3B82F6', icon: 'sync-outline' },
    { value: 'shipped', label: 'Enviado', color: '#8B5CF6', icon: 'airplane-outline' },
    { value: 'delivered', label: 'Entregado', color: '#10B981', icon: 'checkmark-circle-outline' },
    { value: 'cancelled', label: 'Cancelado', color: '#EF4444', icon: 'close-circle-outline' }
  ];

  // 🆕 OPCIONES DE RAZÓN DE ELIMINACIÓN
  const deleteReasons = [
    'Pedido duplicado',
    'Error en el sistema',
    'Solicitud del cliente',
    'Fraude detectado',
    'Producto no disponible',
    'Error de precio',
    'Otro (especificar en notas)'
  ];

  // ✅ CARGAR PEDIDOS EN TIEMPO REAL
  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const ordersQuery = query(
      ordersRef, 
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = [];
      let totalRevenue = 0;
      const statusCount = {
        total: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      };

      snapshot.forEach((doc) => {
        const order = { id: doc.id, ...doc.data() };
        ordersData.push(order);
        
        // Calcular estadísticas
        statusCount.total++;
        statusCount[order.status] = (statusCount[order.status] || 0) + 1;
        
        if (order.status !== 'cancelled') {
          totalRevenue += order.totals?.total || 0;
        }
      });

      setOrders(ordersData);
      setStats({ ...statusCount, totalRevenue });
      setLoading(false);
      
      // Configurar paginación
      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === 20);
      } else {
        setHasMore(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ FILTRAR PEDIDOS
  useEffect(() => {
    let filtered = orders;

    // Filtrar por estado
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber?.toLowerCase().includes(query) ||
        order.userEmail?.toLowerCase().includes(query) ||
        order.shippingAddress?.firstName?.toLowerCase().includes(query) ||
        order.shippingAddress?.lastName?.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  }, [orders, selectedStatus, searchQuery]);

  // 🆕 CARGAR MÁS PEDIDOS
  const loadMoreOrders = async () => {
    if (!hasMore || loadingMore || !lastVisible) return;

    try {
      setLoadingMore(true);
      
      const ordersRef = collection(db, 'orders');
      const nextQuery = query(
        ordersRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(20)
      );

      const snapshot = await getDocs(nextQuery);
      
      if (snapshot.docs.length > 0) {
        const newOrders = [];
        snapshot.forEach((doc) => {
          newOrders.push({ id: doc.id, ...doc.data() });
        });

        setOrders(prev => [...prev, ...newOrders]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more orders:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // ✅ ACTUALIZAR ESTADO DEL PEDIDO
  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      setUpdating(true);
      
      const orderRef = doc(db, 'orders', selectedOrder.id);
      const updateData = {
        status: newStatus,
        updatedAt: new Date(),
        ...(adminNotes && { adminNotes }),
        ...(trackingNumber && { trackingNumber })
      };

      await updateDoc(orderRef, updateData);
      
      setShowStatusModal(false);
      setNewStatus('');
      setAdminNotes('');
      setTrackingNumber('');
      
      Alert.alert('Éxito', 'Estado del pedido actualizado correctamente');
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado del pedido');
    } finally {
      setUpdating(false);
    }
  };

  // ✅ ACTUALIZAR NÚMERO DE SEGUIMIENTO
  const updateTrackingNumber = async () => {
    if (!selectedOrder || !trackingNumber.trim()) return;

    try {
      setUpdating(true);
      
      const orderRef = doc(db, 'orders', selectedOrder.id);
      await updateDoc(orderRef, {
        trackingNumber: trackingNumber.trim(),
        updatedAt: new Date(),
        ...(selectedOrder.status === 'pending' && { status: 'processing' })
      });
      
      setShowTrackingModal(false);
      setTrackingNumber('');
      
      Alert.alert('Éxito', 'Número de seguimiento actualizado');
    } catch (error) {
      console.error('Error updating tracking:', error);
      Alert.alert('Error', 'No se pudo actualizar el número de seguimiento');
    } finally {
      setUpdating(false);
    }
  };

  // 🆕 ELIMINAR PEDIDO CON REGISTRO MÍNIMO
  const deleteOrder = async () => {
    if (!selectedOrder || !deleteReason.trim()) {
      Alert.alert('Error', 'Por favor selecciona una razón para la eliminación');
      return;
    }

    try {
      setDeleting(true);
      
      console.log('🗑️ Iniciando eliminación del pedido:', selectedOrder.orderNumber);
      
      // 🆕 CREAR REGISTRO MÍNIMO EN COLECCIÓN 'deleted_orders'
      const deletedOrderRecord = {
        // Información básica para auditoría
        originalOrderId: selectedOrder.id,
        orderNumber: selectedOrder.orderNumber,
        userId: selectedOrder.userId,
        userEmail: selectedOrder.userEmail,
        
        // Información financiera mínima
        totalAmount: selectedOrder.totals?.total || 0,
        itemCount: selectedOrder.items?.length || 0,
        
        // Fechas importantes
        originalCreatedAt: selectedOrder.createdAt,
        deletedAt: new Date(),
        
        // Información de eliminación
        deleteReason: deleteReason.trim(),
        deletedBy: 'admin', // Podrías usar auth.currentUser.email aquí
        
        // Estado al momento de eliminación
        lastStatus: selectedOrder.status,
        
        // Información mínima del cliente (para estadísticas)
        customerName: `${selectedOrder.shippingAddress?.firstName || ''} ${selectedOrder.shippingAddress?.lastName || ''}`.trim(),
        
        // Metadatos
        platform: selectedOrder.platform || 'mobile',
        version: selectedOrder.version || '1.0.0'
      };

      console.log('📝 Creando registro de eliminación:', deletedOrderRecord);
      
      // Guardar registro en colección 'deleted_orders'
      const deletedOrdersRef = collection(db, 'deleted_orders');
      await addDoc(deletedOrdersRef, deletedOrderRecord);
      
      console.log('✅ Registro de eliminación creado');
      
      // 🗑️ ELIMINAR EL PEDIDO ORIGINAL
      const orderRef = doc(db, 'orders', selectedOrder.id);
      await deleteDoc(orderRef);
      
      console.log('✅ Pedido original eliminado');
      
      // Cerrar modales y limpiar estados
      setShowDeleteModal(false);
      setShowOrderModal(false);
      setDeleteReason('');
      setSelectedOrder(null);
      
      Alert.alert(
        'Pedido Eliminado', 
        `El pedido #${selectedOrder.orderNumber} ha sido eliminado correctamente. Se ha guardado un registro para auditoría.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Error eliminando pedido:', error);
      Alert.alert(
        'Error', 
        'No se pudo eliminar el pedido. Por favor, inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setDeleting(false);
    }
  };

  // 🆕 CONFIRMAR ELIMINACIÓN
  const confirmDelete = () => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que quieres eliminar el pedido #${selectedOrder?.orderNumber}?\n\nEsta acción no se puede deshacer, pero se guardará un registro para auditoría.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => setShowDeleteModal(true)
        }
      ]
    );
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
      return 'Fecha inválida';
    }
  };

  // ✅ OBTENER COLOR DEL ESTADO
  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption?.color || '#6B7280';
  };

  // ✅ OBTENER ICONO DEL ESTADO
  const getStatusIcon = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption?.icon || 'help-circle-outline';
  };

  // ✅ OBTENER LABEL DEL ESTADO
  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption?.label || status;
  };

  // ✅ REFRESH
  const onRefresh = () => {
    setRefreshing(true);
    // Los datos se actualizan automáticamente por el listener
    setTimeout(() => setRefreshing(false), 1000);
  };

  // ✅ RENDERIZAR ESTADÍSTICAS
  const renderStats = () => (
    <View style={styles.statsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Pedidos</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.processing}</Text>
          <Text style={styles.statLabel}>Procesando</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.delivered}</Text>
          <Text style={styles.statLabel}>Entregados</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#8B5CF6' }]}>${stats.totalRevenue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Ingresos</Text>
        </View>
      </ScrollView>
    </View>
  );

  // ✅ RENDERIZAR FILTROS
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por número, email o nombre..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros de estado */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilters}>
        <TouchableOpacity
          style={[styles.statusFilter, selectedStatus === 'all' && styles.statusFilterActive]}
          onPress={() => setSelectedStatus('all')}
        >
          <Text style={[styles.statusFilterText, selectedStatus === 'all' && styles.statusFilterTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
        
        {statusOptions.map((status) => (
          <TouchableOpacity
            key={status.value}
            style={[
              styles.statusFilter, 
              selectedStatus === status.value && styles.statusFilterActive,
              { borderColor: status.color }
            ]}
            onPress={() => setSelectedStatus(status.value)}
          >
            <Ionicons 
              name={status.icon} 
              size={16} 
              color={selectedStatus === status.value ? '#fff' : status.color} 
            />
            <Text style={[
              styles.statusFilterText, 
              selectedStatus === status.value && styles.statusFilterTextActive,
              { color: selectedStatus === status.value ? '#fff' : status.color }
            ]}>
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // 🆕 RENDERIZAR TARJETA DE PEDIDO CON TOTAL ABAJO Y BOTÓN ELIMINAR
  const renderOrderCard = (order) => (
    <TouchableOpacity
      key={order.id}
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(order);
        setShowOrderModal(true);
      }}
    >
      {/* Header del pedido - SIN TOTAL */}
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Ionicons name={getStatusIcon(order.status)} size={12} color="#fff" />
            <Text style={styles.statusBadgeText}>{getStatusLabel(order.status)}</Text>
          </View>
        </View>
      </View>

      {/* Información del cliente */}
      <View style={styles.orderInfo}>
        <View style={styles.orderInfoRow}>
          <Ionicons name="person" size={16} color="#6B7280" />
          <Text style={styles.orderInfoText}>
            {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
          </Text>
        </View>
        
        <View style={styles.orderInfoRow}>
          <Ionicons name="mail" size={16} color="#6B7280" />
          <Text style={styles.orderInfoText}>{order.userEmail}</Text>
        </View>
        
        <View style={styles.orderInfoRow}>
          <Ionicons name="calendar" size={16} color="#6B7280" />
          <Text style={styles.orderInfoText}>{formatDate(order.createdAt)}</Text>
        </View>
      </View>

      {/* Items del pedido */}
      <View style={styles.orderItems}>
        <Text style={styles.orderItemsTitle}>
          {order.items?.length || 0} producto{(order.items?.length || 0) !== 1 ? 's' : ''}
        </Text>
        {order.items?.slice(0, 2).map((item, index) => (
          <Text key={index} style={styles.orderItemText}>
            • {item.productName} x{item.quantity}
          </Text>
        ))}
        {(order.items?.length || 0) > 2 && (
          <Text style={styles.orderItemText}>
            • +{(order.items?.length || 0) - 2} más...
          </Text>
        )}
      </View>

      {/* 🆕 TOTAL DEL PEDIDO ABAJO */}
      <View style={styles.orderTotalContainer}>
        <View style={styles.orderTotalRow}>
          <View style={styles.orderTotalLeft}>
            <Ionicons name="cash" size={16} color="#10B981" />
            <Text style={styles.orderTotalLabel}>Total del Pedido:</Text>
          </View>
          <Text style={styles.orderTotal}>${order.totals?.total?.toFixed(2) || '0.00'}</Text>
        </View>
      </View>

      {/* 🆕 ACCIONES RÁPIDAS CON BOTÓN ELIMINAR */}
      <View style={styles.orderActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={(e) => {
            e.stopPropagation();
            setSelectedOrder(order);
            setNewStatus(order.status);
            setAdminNotes(order.adminNotes || '');
            setShowStatusModal(true);
          }}
        >
          <Ionicons name="create-outline" size={16} color="#3B82F6" />
          <Text style={styles.quickActionText}>Estado</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickAction}
          onPress={(e) => {
            e.stopPropagation();
            setSelectedOrder(order);
            setTrackingNumber(order.trackingNumber || '');
            setShowTrackingModal(true);
          }}
        >
          <Ionicons name="location-outline" size={16} color="#10B981" />
          <Text style={styles.quickActionText}>Tracking</Text>
        </TouchableOpacity>
        
        {/* 🆕 BOTÓN ELIMINAR */}
        <TouchableOpacity
          style={[styles.quickAction, styles.deleteAction]}
          onPress={(e) => {
            e.stopPropagation();
            setSelectedOrder(order);
            confirmDelete();
          }}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text style={[styles.quickActionText, styles.deleteActionText]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // 🆕 RENDERIZAR MODAL DE ELIMINACIÓN
  const renderDeleteModal = () => (
    <Modal
      visible={showDeleteModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowDeleteModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.deleteModalHeader}>
            <Ionicons name="warning" size={32} color="#EF4444" />
            <Text style={styles.deleteModalTitle}>Eliminar Pedido</Text>
          </View>
          
          <Text style={styles.deleteModalSubtitle}>
            Pedido: #{selectedOrder?.orderNumber}
          </Text>
          
          <Text style={styles.deleteModalDescription}>
            Selecciona la razón para eliminar este pedido. Se guardará un registro mínimo para auditoría.
          </Text>
          
          <View style={styles.deleteReasonsContainer}>
            {deleteReasons.map((reason, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.deleteReasonOption,
                  deleteReason === reason && styles.deleteReasonOptionSelected
                ]}
                onPress={() => setDeleteReason(reason)}
              >
                <Ionicons 
                  name={deleteReason === reason ? "radio-button-on" : "radio-button-off"} 
                  size={20} 
                  color={deleteReason === reason ? "#EF4444" : "#9CA3AF"} 
                />
                <Text style={[
                  styles.deleteReasonText,
                  deleteReason === reason && styles.deleteReasonTextSelected
                ]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowDeleteModal(false);
                setDeleteReason('');
              }}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalDeleteButton, !deleteReason && styles.modalDeleteButtonDisabled]}
              onPress={deleteOrder}
              disabled={deleting || !deleteReason}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="trash" size={16} color="#fff" />
                  <Text style={styles.modalDeleteText}>Eliminar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ✅ RENDERIZAR MODAL DE DETALLE CON BOTÓN ELIMINAR
  const renderOrderModal = () => (
    <Modal
      visible={showOrderModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowOrderModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowOrderModal(false)}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>
            Pedido #{selectedOrder?.orderNumber}
          </Text>
          
          {/* 🆕 BOTÓN ELIMINAR EN EL HEADER */}
          <TouchableOpacity
            style={styles.modalDeleteHeaderButton}
            onPress={confirmDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {selectedOrder && (
            <>
              {/* Estado y fecha */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Estado del Pedido</Text>
                <View style={styles.modalRow}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) }]}>
                    <Ionicons name={getStatusIcon(selectedOrder.status)} size={14} color="#fff" />
                    <Text style={styles.statusBadgeText}>{getStatusLabel(selectedOrder.status)}</Text>
                  </View>
                  <Text style={styles.modalDate}>{formatDate(selectedOrder.createdAt)}</Text>
                </View>
              </View>

              {/* Información del cliente */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Cliente</Text>
                <Text style={styles.modalText}>
                  {selectedOrder.shippingAddress?.firstName} {selectedOrder.shippingAddress?.lastName}
                </Text>
                <Text style={styles.modalText}>{selectedOrder.userEmail}</Text>
                {selectedOrder.shippingAddress?.phone && (
                  <Text style={styles.modalText}>{selectedOrder.shippingAddress.phone}</Text>
                )}
              </View>

              {/* Dirección de envío */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Dirección de Envío</Text>
                <Text style={styles.modalText}>{selectedOrder.shippingAddress?.address1}</Text>
                {selectedOrder.shippingAddress?.address2 && (
                  <Text style={styles.modalText}>{selectedOrder.shippingAddress.address2}</Text>
                )}
                <Text style={styles.modalText}>
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.postalCode}
                </Text>
                <Text style={styles.modalText}>{selectedOrder.shippingAddress?.country}</Text>
              </View>

              {/* Productos */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Productos</Text>
                {selectedOrder.items?.map((item, index) => (
                  <View key={index} style={styles.modalProductItem}>
                    <View style={styles.modalProductLeft}>
                      <Text style={styles.modalProductName}>{item.productName}</Text>
                      {item.size && <Text style={styles.modalProductDetail}>Talla: {item.size}</Text>}
                      {item.color && <Text style={styles.modalProductDetail}>Color: {item.color}</Text>}
                    </View>
                    <View style={styles.modalProductRight}>
                      <Text style={styles.modalProductPrice}>${item.totalPrice?.toFixed(2)}</Text>
                      <Text style={styles.modalProductQuantity}>x{item.quantity}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Totales */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Resumen</Text>
                <View style={styles.modalTotalRow}>
                  <Text style={styles.modalTotalLabel}>Subtotal</Text>
                  <Text style={styles.modalTotalValue}>${selectedOrder.totals?.subtotal?.toFixed(2)}</Text>
                </View>
                <View style={styles.modalTotalRow}>
                  <Text style={styles.modalTotalLabel}>Impuestos</Text>
                  <Text style={styles.modalTotalValue}>${selectedOrder.totals?.tax?.toFixed(2)}</Text>
                </View>
                <View style={styles.modalTotalRow}>
                  <Text style={styles.modalTotalLabel}>Envío</Text>
                  <Text style={styles.modalTotalValue}>
                    {selectedOrder.totals?.shipping === 0 ? 'Gratis' : `$${selectedOrder.totals?.shipping?.toFixed(2)}`}
                  </Text>
                </View>
                <View style={[styles.modalTotalRow, styles.modalTotalRowFinal]}>
                  <Text style={styles.modalTotalLabelFinal}>Total</Text>
                  <Text style={styles.modalTotalValueFinal}>${selectedOrder.totals?.total?.toFixed(2)}</Text>
                </View>
              </View>

              {/* Método de pago */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Método de Pago</Text>
                <Text style={styles.modalText}>{selectedOrder.paymentMethod?.name}</Text>
                {selectedOrder.paymentMethod?.lastFourDigits && (
                  <Text style={styles.modalText}>
                    •••• •••• •••• {selectedOrder.paymentMethod.lastFourDigits}
                  </Text>
                )}
              </View>

              {/* Tracking */}
              {selectedOrder.trackingNumber && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Número de Seguimiento</Text>
                  <Text style={styles.modalText}>{selectedOrder.trackingNumber}</Text>
                </View>
              )}

              {/* Notas del admin */}
              {selectedOrder.adminNotes && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Notas del Administrador</Text>
                  <Text style={styles.modalText}>{selectedOrder.adminNotes}</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // ✅ RENDERIZAR MODAL DE ESTADO
  const renderStatusModal = () => (
    <Modal
      visible={showStatusModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowStatusModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalCardTitle}>Actualizar Estado</Text>
          
          <View style={styles.statusOptionsContainer}>
            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status.value}
                style={[
                  styles.statusOption,
                  newStatus === status.value && styles.statusOptionSelected
                ]}
                onPress={() => setNewStatus(status.value)}
              >
                <Ionicons 
                  name={status.icon} 
                  size={20} 
                  color={newStatus === status.value ? '#fff' : status.color} 
                />
                <Text style={[
                  styles.statusOptionText,
                  newStatus === status.value && styles.statusOptionTextSelected
                ]}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.notesInput}
            placeholder="Notas del administrador (opcional)"
            value={adminNotes}
            onChangeText={setAdminNotes}
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={updateOrderStatus}
              disabled={updating || !newStatus}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalConfirmText}>Actualizar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ✅ RENDERIZAR MODAL DE TRACKING
  const renderTrackingModal = () => (
    <Modal
      visible={showTrackingModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTrackingModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalCardTitle}>Número de Seguimiento</Text>
          
          <TextInput
            style={styles.trackingInput}
            placeholder="Ingresa el número de seguimiento"
            value={trackingNumber}
            onChangeText={setTrackingNumber}
            autoCapitalize="characters"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowTrackingModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={updateTrackingNumber}
              disabled={updating || !trackingNumber.trim()}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalConfirmText}>Guardar</Text>
              )}
            </TouchableOpacity>
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
          <Text style={styles.loadingText}>Cargando pedidos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Pedidos</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Estadísticas */}
      {renderStats()}

      {/* Filtros */}
      {renderFilters()}

      {/* Lista de pedidos */}
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          
          if (isCloseToBottom && hasMore && !loadingMore) {
            loadMoreOrders();
          }
        }}
        scrollEventThrottle={400}
      >
        {filteredOrders.length > 0 ? (
          <>
            {filteredOrders.map(renderOrderCard)}
            
            {/* Indicador de carga más */}
            {loadingMore && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.loadingMoreText}>Cargando más pedidos...</Text>
              </View>
            )}
            
            {!hasMore && filteredOrders.length > 10 && (
              <View style={styles.endContainer}>
                <Text style={styles.endText}>No hay más pedidos</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {searchQuery || selectedStatus !== 'all' ? 'No se encontraron pedidos' : 'No hay pedidos aún'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || selectedStatus !== 'all' 
                ? 'Intenta cambiar los filtros de búsqueda'
                : 'Los pedidos aparecerán aquí cuando los usuarios realicen compras'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modales */}
      {renderOrderModal()}
      {renderStatusModal()}
      {renderTrackingModal()}
      {renderDeleteModal()}
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

  // Estadísticas
  statsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statCard: {
    alignItems: 'center',
    paddingHorizontal: 20,
    minWidth: 100,
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

  // Filtros
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  statusFilters: {
    flexDirection: 'row',
  },
  statusFilter: {
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
  statusFilterActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  statusFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusFilterTextActive: {
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  orderItems: {
    marginBottom: 12,
  },
  orderItemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  orderItemText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  
  // 🆕 ESTILOS PARA TOTAL ABAJO
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
  orderTotalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    gap: 4,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  
  // 🆕 ESTILOS PARA BOTÓN ELIMINAR
  deleteAction: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteActionText: {
    color: '#EF4444',
  },

  // Estados vacíos
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

  // Carga más
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#6B7280',
  },
  endContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  endText: {
    fontSize: 14,
    color: '#9CA3AF',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  // 🆕 BOTÓN ELIMINAR EN HEADER DEL MODAL
  modalDeleteHeaderButton: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  modalProductItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalProductLeft: {
    flex: 1,
  },
  modalProductName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  modalProductDetail: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalProductRight: {
    alignItems: 'flex-end',
  },
  modalProductPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  modalProductQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  modalTotalRowFinal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 8,
  },
  modalTotalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalTotalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  modalTotalLabelFinal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  modalTotalValueFinal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },

  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },

  // 🆕 ESTILOS PARA MODAL DE ELIMINACIÓN
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
  },
  deleteModalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteModalDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  deleteReasonsContainer: {
    gap: 8,
    marginBottom: 20,
  },
  deleteReasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  deleteReasonOptionSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  deleteReasonText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  deleteReasonTextSelected: {
    color: '#EF4444',
    fontWeight: '500',
  },

  // Status options
  statusOptionsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  statusOptionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  statusOptionTextSelected: {
    color: '#fff',
  },

  // Inputs
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  trackingInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    marginBottom: 16,
  },

  // Modal actions
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // 🆕 BOTÓN ELIMINAR EN MODAL
  modalDeleteButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  modalDeleteButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalDeleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AdminOrdersScreen;
