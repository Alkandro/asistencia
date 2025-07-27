import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  CartItem,
  PriceSummary,
} from '../ComponentsShop/ShopComponents';
import {
  AdminCard,
  AdminButton,
} from '../AdminScreen/AdminComponents';

const OrderConfirmationScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId, orderData } = route.params;

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

  const getPaymentMethodDisplay = (paymentMethod) => {
    if (!paymentMethod) return 'Tarjeta';
    
    const brand = paymentMethod.card?.brand || 'tarjeta';
    const last4 = paymentMethod.card?.last4 || '****';
    
    return `${brand.toUpperCase()} •••• ${last4}`;
  };

  const handleContinueShopping = () => {
    navigation.navigate('Shop');
  };

  const handleViewOrders = () => {
    navigation.navigate('OrderHistory');
  };

  const renderSuccessHeader = () => (
    <AdminCard style={styles.successCard}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={64} color="#10B981" />
      </View>
      
      <Text style={styles.successTitle}>¡Pedido Confirmado!</Text>
      <Text style={styles.successSubtitle}>
        Tu pedido ha sido procesado exitosamente
      </Text>
      
      <View style={styles.orderInfo}>
        <Text style={styles.orderNumber}>
          Pedido #{orderId.slice(-8).toUpperCase()}
        </Text>
        <Text style={styles.orderDate}>
          {formatDate(orderData.createdAt)}
        </Text>
      </View>
    </AdminCard>
  );

  const renderOrderDetails = () => (
    <AdminCard style={styles.section}>
      <Text style={styles.sectionTitle}>Detalles del Pedido</Text>
      
      {orderData.items.map((item, index) => (
        <View key={`${item.productId}-${item.size}-${item.color}-${index}`}>
          <CartItem
            item={item}
            onUpdateQuantity={() => {}} // Solo lectura
            onRemove={() => {}} // Solo lectura
            style={styles.readOnlyCartItem}
          />
          {index < orderData.items.length - 1 && <AdminDivider />}
        </View>
      ))}

      <AdminDivider />
      
      <PriceSummary
        subtotal={orderData.subtotal}
        tax={orderData.tax}
        shipping={orderData.shipping}
        total={orderData.total}
      />
    </AdminCard>
  );

  const renderShippingInfo = () => (
    <AdminCard style={styles.section}>
      <Text style={styles.sectionTitle}>Información de Envío</Text>
      
      <View style={styles.addressCard}>
        <View style={styles.addressHeader}>
          <Ionicons name="location-outline" size={20} color="#6B7280" />
          <Text style={styles.addressTitle}>Dirección de Entrega</Text>
        </View>
        
        <View style={styles.addressDetails}>
          <Text style={styles.addressName}>{orderData.shippingAddress.name}</Text>
          <Text style={styles.addressLine}>{orderData.shippingAddress.street}</Text>
          <Text style={styles.addressLine}>
            {orderData.shippingAddress.city}, {orderData.shippingAddress.state} {orderData.shippingAddress.zipCode}
          </Text>
          <Text style={styles.addressLine}>{orderData.shippingAddress.country}</Text>
          
          <AdminDivider style={styles.addressDivider} />
          
          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={16} color="#6B7280" />
              <Text style={styles.contactText}>{orderData.shippingAddress.email}</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text style={styles.contactText}>{orderData.shippingAddress.phone}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.deliveryInfo}>
        <View style={styles.deliveryRow}>
          <Ionicons name="time-outline" size={20} color="#3B82F6" />
          <View style={styles.deliveryText}>
            <Text style={styles.deliveryTitle}>Tiempo de Entrega</Text>
            <Text style={styles.deliverySubtitle}>3-5 días hábiles</Text>
          </View>
        </View>
        
        <View style={styles.deliveryRow}>
          <Ionicons name="cube-outline" size={20} color="#3B82F6" />
          <View style={styles.deliveryText}>
            <Text style={styles.deliveryTitle}>Seguimiento</Text>
            <Text style={styles.deliverySubtitle}>
              Recibirás un email con el número de seguimiento
            </Text>
          </View>
        </View>
      </View>
    </AdminCard>
  );

  const renderPaymentInfo = () => (
    <AdminCard style={styles.section}>
      <Text style={styles.sectionTitle}>Información de Pago</Text>
      
      <View style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <Ionicons name="card-outline" size={20} color="#6B7280" />
          <Text style={styles.paymentTitle}>Método de Pago</Text>
          <View style={styles.paymentStatus}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.paymentStatusText}>Pagado</Text>
          </View>
        </View>
        
        <Text style={styles.paymentMethod}>
          {getPaymentMethodDisplay(orderData.paymentMethod)}
        </Text>
        <Text style={styles.paymentAmount}>
          ${orderData.total.toFixed(2)} USD
        </Text>
      </View>
    </AdminCard>
  );

  const renderNextSteps = () => (
    <AdminCard style={styles.section}>
      <Text style={styles.sectionTitle}>Próximos Pasos</Text>
      
      <View style={styles.stepsList}>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Confirmación por Email</Text>
            <Text style={styles.stepDescription}>
              Recibirás un email de confirmación con todos los detalles de tu pedido
            </Text>
          </View>
        </View>
        
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Preparación del Pedido</Text>
            <Text style={styles.stepDescription}>
              Nuestro equipo preparará tu pedido con cuidado
            </Text>
          </View>
        </View>
        
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Envío y Seguimiento</Text>
            <Text style={styles.stepDescription}>
              Te enviaremos el número de seguimiento para que puedas rastrear tu pedido
            </Text>
          </View>
        </View>
      </View>
    </AdminCard>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSuccessHeader()}
        {renderOrderDetails()}
        {renderShippingInfo()}
        {renderPaymentInfo()}
        {renderNextSteps()}
      </ScrollView>

      <View style={styles.bottomSection}>
        <AdminButton
          title="Ver Mis Pedidos"
          variant="secondary"
          onPress={handleViewOrders}
          style={styles.ordersButton}
          icon="list-outline"
        />
        <AdminButton
          title="Seguir Comprando"
          onPress={handleContinueShopping}
          style={styles.shopButton}
          icon="storefront-outline"
        />
      </View>
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

  // Success header
  successCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  orderInfo: {
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Cart items (read-only)
  readOnlyCartItem: {
    backgroundColor: '#F9FAFB',
  },

  // Address info
  addressCard: {
    marginBottom: 16,
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
  addressDivider: {
    marginVertical: 12,
  },
  contactInfo: {
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },

  // Delivery info
  deliveryInfo: {
    gap: 16,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  deliveryText: {
    marginLeft: 12,
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  deliverySubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Payment info
  paymentCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  paymentMethod: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  // Next steps
  stepsList: {
    gap: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // Bottom section
  bottomSection: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  ordersButton: {
    flex: 1,
  },
  shopButton: {
    flex: 1,
  },
});

export default OrderConfirmationScreen;