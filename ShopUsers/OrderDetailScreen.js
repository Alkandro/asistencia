import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import {
  doc,
  onSnapshot,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  CartItem,
  PriceSummary,
} from '../ShopComponents';
import {
  AdminCard,
  AdminButton,
  AdminHeader,
  AdminDivider,
  AdminLoadingOverlay,
} from '../AdminComponents';

const OrderDetailScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { order: initialOrder } = route.params;

  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Estados de pedido disponibles
  const orderStatuses = [
    { id: 'pending', name: 'Pendiente', color: '#F59E0B', icon: 'time-outline' },
    { id: 'processing', name: 'Procesando', color: '#3B82F6', icon: 'cog-outline' },
    { id: 'shipped', name: 'Enviado', color: '#8B5CF6', icon: 'airplane-outline' },
    { id: 'delivered', name: 'Entregado', color: '#10B981', icon: 'checkmark-circle-outline' },
    { id: 'cancelled', name: 'Cancelado', color: '#EF4444', icon: 'close-circle-outline' },
  ];

  useEffect(() => {
    // Suscripción en tiempo real al pedido
    const orderRef = doc(db, 'orders', initialOrder.id);
    const unsubscribe = onSnapshot(
      orderRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        }
      },
      (error) => {
        console.error('Error al obtener pedido:', error);
      }
    );

    return () => unsubscribe();
  }, [initialOrder.id]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
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

  const getNextStatus = (currentStatus) => {
    const statusFlow = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex >= 0 && currentIndex < statusFlow.length - 1 
      ? statusFlow[currentIndex + 1] 
      : null;
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      
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

      Alert.alert('Éxito', 'Estado del pedido actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar pedido:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado del pedido');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancelar Pedido',
      '¿Estás seguro de que quieres cancelar este pedido?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: () => handleUpdateStatus('cancelled'),
        },
      ]
    );
  };

  const handleContactCustomer = () => {
    const email = order.shippingAddress?.email || order.userEmail;
    const phone = order.shippingAddress?.phone;

    Alert.alert(
      'Contactar Cliente',
      'Selecciona el método de contacto:',
      [
        { text: 'Cancelar', style: 'cancel' },
        ...(email ? [{
          text: 'Email',
          onPress: () => Linking.openURL(`mailto:${email}?subject=Pedido #${order.id.slice(-8).toUpperCase()}`)
        }] : []),
        ...(phone ? [{
          text: 'Teléfono',
          onPress: () => Linking.openURL(`tel:${phone}`)
        }] : []),
      ]
    );
  };

  const renderOrderHeader = () => {
    const statusInfo = getStatusInfo(order.status);
    const nextStatus = getNextStatus(order.status);

    return (
      <AdminCard style={styles.section}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>
              Pedido #{order.id.slice(-8).toUpperCase()}
            </Text>
            <Text style={styles.orderDate}>
              {formatDate(order.createdAt)}
            </Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Ionicons name={statusInfo.icon} size={16} color="#fff" />
            <Text style={styles.statusBadgeText}>{statusInfo.name}</Text>
          </View>
        </View>

        <AdminDivider />

        <View style={styles.orderActions}>
          {nextStatus && order.status !== 'cancelled' && order.status !== 'delivered' && (
            <AdminButton
              title={`Marcar como ${getStatusInfo(nextStatus).name}`}
              icon={getStatusInfo(nextStatus).icon}
              onPress={() => handleUpdateStatus(nextStatus)}
              loading={updating}
              style={styles.actionButton}
            />
          )}
          
          <AdminButton
            title="Contactar Cliente"
            icon="call-outline"
            variant="secondary"
            onPress={handleContactCustomer}
            style={styles.actionButton}
          />
          
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <AdminButton
              title="Cancelar Pedido"
              icon="close-circle-outline"
              variant="danger"
              onPress={handleCancelOrder}
              disabled={updating}
              style={styles.actionButton}
            />
          )}
        </View>
      </AdminCard>
    );
  };

  const renderCustomerInfo = () => (
    <AdminCard style={styles.section}>
      <Text style={styles.sectionTitle}>Información del Cliente</Text>
      
      <View style={styles.customerCard}>
        <View style={styles.customerRow}>
          <Ionicons name="person-outline" size={20} color="#6B7280" />
          <View style={styles.customerDetails}>
            <Text style={styles.customerLabel}>Nombre</Text>
            <Text style={styles.customerValue}>
              {order.shippingAddress?.name || order.userName || 'No disponible'}
            </Text>
          </View>
        </View>
        
        <AdminDivider />
        
        <View style={styles.customerRow}>
          <Ionicons name="mail-outline" size={20} color="#6B7280" />
          <View style={styles.customerDetails}>
            <Text style={styles.customerLabel}>Email</Text>
            <Text style={styles.customerValue}>
              {order.shippingAddress?.email || order.userEmail || 'No disponible'}
            </Text>
          </View>
        </View>
        
        <AdminDivider />
        
        <View style={styles.customerRow}>
          <Ionicons name="call-outline" size={20} color="#6B7280" />
          <View style={styles.customerDetails}>
            <Text style={styles.customerLabel}>Teléfono</Text>
            <Text style={styles.customerValue}>
              {order.shippingAddress?.phone || 'No disponible'}
            </Text>
          </View>
        </View>
      </View>
    </AdminCard>
  );

  const renderShippingInfo = () => (
    <AdminCard style={styles.section}>
      <Text style={styles.sectionTitle}>Dirección de Envío</Text>
      
      <View style={styles.addressCard}>
        <View style={styles.addressHeader}>
          <Ionicons name="location-outline" size={20} color="#6B7280" />
          <Text style={styles.addressTitle}>Dirección de Entrega</Text>
        </View>
        
        <View style={styles.addressDetails}>
          <Text style={styles.addressName}>
            {order.shippingAddress?.name || 'Nombre no disponible'}
          </Text>
          <Text style={styles.addressLine}>
            {order.shippingAddress?.street || 'Dirección no disponible'}
          </Text>
          <Text style={styles.addressLine}>
            {order.shippingAddress?.city || 'Ciudad'}, {order.shippingAddress?.state || 'Estado'} {order.shippingAddress?.zipCode || 'CP'}
          </Text>
          <Text style={styles.addressLine}>
            {order.shippingAddress?.country || 'País'}
          </Text>
        </View>
      </View>
    </AdminCard>
  );

  const renderOrderItems = () => (
    <AdminCard style={styles.section}>
      <Text style={styles.sectionTitle}>Productos del Pedido</Text>
      
      {order.items?.map((item, index) => (
        <View key={`${item.productId}-${item.size}-${item.color}-${index}`}>
          <CartItem
            item={item}
            onUpdateQuantity={() => {}} // Solo lectura
            onRemove={() => {}} // Solo lectura
            style={styles.readOnlyCartItem}
          />
          {index < order.items.length - 1 && <AdminDivider />}
        </View>
      )) || (
        <Text style={styles.noItemsText}>No hay productos en este pedido</Text>
      )}

      <AdminDivider />
      
      <PriceSummary
        subtotal={order.subtotal || 0}
        tax={order.tax || 0}
        shipping={order.shipping || 0}
        total={order.total || 0}
      />
    </AdminCard>
  );

  const renderPaymentInfo = () => (
    <AdminCard style={styles.section}>
      <Text style={styles.sectionTitle}>Información de Pago</Text>
      
      <View style={styles.paymentCard}>
        <View style={styles.paymentRow}>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>Estado del Pago</Text>
            <View style={styles.paymentStatus}>
              <Ionicons 
                name={order.paymentStatus === 'paid' ? 'checkmark-circle' : 'time'} 
                size={16} 
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
        
        <AdminDivider />
        
        <View style={styles.paymentRow}>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>Método de Pago</Text>
            <Text style={styles.paymentValue}>
              {order.paymentMethod?.card 
                ? `${order.paymentMethod.card.brand?.toUpperCase()} •••• ${order.paymentMethod.card.last4}`
                : 'Tarjeta de crédito/débito'
              }
            </Text>
          </View>
        </View>
        
        <AdminDivider />
        
        <View style={styles.paymentRow}>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>Total Pagado</Text>
            <Text style={styles.paymentTotal}>
              ${order.total?.toFixed(2) || '0.00'} {order.currency || 'USD'}
            </Text>
          </View>
        </View>
        
        {order.paidAt && (
          <>
            <AdminDivider />
            <View style={styles.paymentRow}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentLabel}>Fecha de Pago</Text>
                <Text style={styles.paymentValue}>
                  {formatDate(order.paidAt)}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </AdminCard>
  );

  const renderOrderTimeline = () => {
    const timeline = [
      { status: 'pending', name: 'Pedido Recibido', date: order.createdAt },
      { status: 'processing', name: 'En Procesamiento', date: order.updatedAt },
      { status: 'shipped', name: 'Enviado', date: null },
      { status: 'delivered', name: 'Entregado', date: null },
    ];

    const currentStatusIndex = timeline.findIndex(item => item.status === order.status);

    return (
      <AdminCard style={styles.section}>
        <Text style={styles.sectionTitle}>Estado del Pedido</Text>
        
        <View style={styles.timeline}>
          {timeline.map((item, index) => {
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            const statusInfo = getStatusInfo(item.status);

            return (
              <View key={item.status} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineIcon,
                    {
                      backgroundColor: isCompleted ? statusInfo.color : '#E5E7EB',
                      borderColor: isCurrent ? statusInfo.color : 'transparent',
                      borderWidth: isCurrent ? 2 : 0,
                    }
                  ]}>
                    <Ionicons 
                      name={statusInfo.icon} 
                      size={16} 
                      color={isCompleted ? '#fff' : '#9CA3AF'} 
                    />
                  </View>
                  {index < timeline.length - 1 && (
                    <View style={[
                      styles.timelineLine,
                      { backgroundColor: isCompleted ? statusInfo.color : '#E5E7EB' }
                    ]} />
                  )}
                </View>
                
                <View style={styles.timelineContent}>
                  <Text style={[
                    styles.timelineTitle,
                    { color: isCompleted ? '#111827' : '#9CA3AF' }
                  ]}>
                    {item.name}
                  </Text>
                  {item.date && (
                    <Text style={styles.timelineDate}>
                      {formatDate(item.date)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </AdminCard>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader
        title="Detalle del Pedido"
        subtitle={`#${order.id.slice(-8).toUpperCase()}`}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderOrderHeader()}
        {renderOrderTimeline()}
        {renderCustomerInfo()}
        {renderShippingInfo()}
        {renderOrderItems()}
        {renderPaymentInfo()}
      </ScrollView>

      <AdminLoadingOverlay visible={updating} text="Actualizando pedido..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  orderActions: {
    gap: 8,
  },
  actionButton: {
    marginHorizontal: 0,
  },

  // Customer info
  customerCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  customerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  customerLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  customerValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },

  // Address info
  addressCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  addressDetails: {
    paddingLeft: 28,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },

  // Cart items (read-only)
  readOnlyCartItem: {
    backgroundColor: '#F9FAFB',
  },
  noItemsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 32,
  },

  // Payment info
  paymentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  paymentRow: {
    paddingVertical: 8,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  paymentValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentStatusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  // Timeline
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    height: 24,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default OrderDetailScreen;
