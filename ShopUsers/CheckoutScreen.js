import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
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
  AdminHeader,
  AdminDivider,
  AdminLoadingOverlay,
} from '../AdminScreen/AdminComponents';

const CheckoutScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { cartItems } = route.params;

  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Estados del formulario de dirección
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Estados Unidos',
  });

  // Estados de validación
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Pre-llenar email del usuario autenticado
    if (auth.currentUser?.email) {
      setShippingAddress(prev => ({
        ...prev,
        email: auth.currentUser.email,
      }));
    }
  }, []);

  // Cálculos de precios
  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.1; // 10% de impuestos
  const shipping = subtotal > 100 ? 0 : 10; // Envío gratis para compras > $100
  const total = subtotal + tax + shipping;

  const updateShippingAddress = (field, value) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!shippingAddress.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }
    if (!shippingAddress.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(shippingAddress.email)) {
      newErrors.email = 'El email no es válido';
    }
    if (!shippingAddress.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
    }
    if (!shippingAddress.street.trim()) {
      newErrors.street = 'La dirección es obligatoria';
    }
    if (!shippingAddress.city.trim()) {
      newErrors.city = 'La ciudad es obligatoria';
    }
    if (!shippingAddress.state.trim()) {
      newErrors.state = 'El estado es obligatorio';
    }
    if (!shippingAddress.zipCode.trim()) {
      newErrors.zipCode = 'El código postal es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createStripePaymentIntent = async (orderData) => {
    try {
      // En una implementación real, esto sería una llamada a tu backend
      // que crearía el PaymentIntent en Stripe
      const response = await fetch('https://your-backend.com/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
        body: JSON.stringify({
          amount: Math.round(total * 100), // Stripe usa centavos
          currency: 'usd',
          orderData,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear PaymentIntent');
      }

      const { clientSecret, paymentIntentId } = await response.json();
      return { clientSecret, paymentIntentId };
    } catch (error) {
      console.error('Error al crear PaymentIntent:', error);
      throw error;
    }
  };

  const processStripePayment = async (clientSecret) => {
    try {
      // En una implementación real, aquí usarías Stripe Elements
      // para procesar el pago de manera segura
      
      // Simulación de procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular éxito del pago (en producción esto vendría de Stripe)
      return {
        success: true,
        paymentMethod: {
          id: 'pm_' + Math.random().toString(36).substring(7),
          card: {
            brand: 'visa',
            last4: '4242',
          },
        },
      };
    } catch (error) {
      console.error('Error al procesar pago:', error);
      throw error;
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      setProcessingPayment(true);

      // 1. Crear orden en Firebase
      const orderData = {
        userId: auth.currentUser?.uid,
        userEmail: auth.currentUser?.email,
        userName: shippingAddress.name,
        items: cartItems,
        subtotal,
        tax,
        shipping,
        total,
        currency: 'USD',
        status: 'pending',
        paymentStatus: 'pending',
        shippingAddress,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      const orderId = orderRef.id;

      // 2. Crear PaymentIntent en Stripe
      const { clientSecret, paymentIntentId } = await createStripePaymentIntent({
        ...orderData,
        orderId,
      });

      // 3. Procesar pago con Stripe
      const paymentResult = await processStripePayment(clientSecret);

      if (paymentResult.success) {
        // 4. Actualizar orden con información de pago
        await updateDoc(orderRef, {
          paymentStatus: 'paid',
          status: 'processing',
          stripePaymentIntentId: paymentIntentId,
          paymentMethod: paymentResult.paymentMethod,
          paidAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // 5. Limpiar carrito
        const userId = auth.currentUser?.uid;
        if (userId) {
          const cartRef = doc(db, 'cart', userId);
          await deleteDoc(cartRef);
        }

        // 6. Crear notificación para admin
        await addDoc(collection(db, 'notifications'), {
          type: 'order',
          title: 'Nuevo Pedido Recibido',
          message: `${shippingAddress.name} ha realizado un pedido por $${total.toFixed(2)}`,
          data: {
            orderId,
            userId: auth.currentUser?.uid,
            amount: total,
          },
          isRead: false,
          createdAt: serverTimestamp(),
          targetAudience: 'admin',
        });

        // 7. Navegar a pantalla de confirmación
        navigation.replace('OrderConfirmation', {
          orderId,
          orderData: {
            ...orderData,
            id: orderId,
            paymentMethod: paymentResult.paymentMethod,
          },
        });
      } else {
        throw new Error('El pago no fue exitoso');
      }
    } catch (error) {
      console.error('Error al procesar pedido:', error);
      Alert.alert(
        'Error en el pago',
        'No se pudo procesar tu pedido. Por favor intenta nuevamente.'
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const renderOrderSummary = () => (
    <AdminCard style={styles.section}>
      <Text style={styles.sectionTitle}>Resumen del Pedido</Text>
      
      {cartItems.map((item, index) => (
        <View key={`${item.productId}-${item.size}-${item.color}-${index}`}>
          <CartItem
            item={item}
            onUpdateQuantity={() => {}} // Solo lectura en checkout
            onRemove={() => {}} // Solo lectura en checkout
            style={styles.readOnlyCartItem}
          />
          {index < cartItems.length - 1 && <AdminDivider />}
        </View>
      ))}

      <AdminDivider />
      
      <PriceSummary
        subtotal={subtotal}
        tax={tax}
        shipping={shipping}
        total={total}
      />
    </AdminCard>
  );

  const renderShippingForm = () => (
    <AdminCard style={styles.section}>
      <Text style={styles.sectionTitle}>Información de Envío</Text>
      
      <View style={styles.formRow}>
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Nombre Completo *</Text>
          <TextInput
            style={[styles.textInput, errors.name && styles.textInputError]}
            value={shippingAddress.name}
            onChangeText={(value) => updateShippingAddress('name', value)}
            placeholder="Tu nombre completo"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formField, { flex: 2 }]}>
          <Text style={styles.fieldLabel}>Email *</Text>
          <TextInput
            style={[styles.textInput, errors.email && styles.textInputError]}
            value={shippingAddress.email}
            onChangeText={(value) => updateShippingAddress('email', value)}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>
        
        <View style={[styles.formField, { flex: 1, marginLeft: 12 }]}>
          <Text style={styles.fieldLabel}>Teléfono *</Text>
          <TextInput
            style={[styles.textInput, errors.phone && styles.textInputError]}
            value={shippingAddress.phone}
            onChangeText={(value) => updateShippingAddress('phone', value)}
            placeholder="123-456-7890"
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Dirección *</Text>
          <TextInput
            style={[styles.textInput, errors.street && styles.textInputError]}
            value={shippingAddress.street}
            onChangeText={(value) => updateShippingAddress('street', value)}
            placeholder="Calle, número, apartamento"
          />
          {errors.street && <Text style={styles.errorText}>{errors.street}</Text>}
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formField, { flex: 2 }]}>
          <Text style={styles.fieldLabel}>Ciudad *</Text>
          <TextInput
            style={[styles.textInput, errors.city && styles.textInputError]}
            value={shippingAddress.city}
            onChangeText={(value) => updateShippingAddress('city', value)}
            placeholder="Ciudad"
          />
          {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
        </View>
        
        <View style={[styles.formField, { flex: 1, marginLeft: 12 }]}>
          <Text style={styles.fieldLabel}>Estado *</Text>
          <TextInput
            style={[styles.textInput, errors.state && styles.textInputError]}
            value={shippingAddress.state}
            onChangeText={(value) => updateShippingAddress('state', value)}
            placeholder="Estado"
          />
          {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formField, { flex: 1 }]}>
          <Text style={styles.fieldLabel}>Código Postal *</Text>
          <TextInput
            style={[styles.textInput, errors.zipCode && styles.textInputError]}
            value={shippingAddress.zipCode}
            onChangeText={(value) => updateShippingAddress('zipCode', value)}
            placeholder="12345"
            keyboardType="numeric"
          />
          {errors.zipCode && <Text style={styles.errorText}>{errors.zipCode}</Text>}
        </View>
        
        <View style={[styles.formField, { flex: 2, marginLeft: 12 }]}>
          <Text style={styles.fieldLabel}>País</Text>
          <TextInput
            style={styles.textInput}
            value={shippingAddress.country}
            onChangeText={(value) => updateShippingAddress('country', value)}
            placeholder="País"
          />
        </View>
      </View>
    </AdminCard>
  );

  const renderPaymentInfo = () => (
    <AdminCard style={styles.section}>
      <Text style={styles.sectionTitle}>Información de Pago</Text>
      
      <View style={styles.paymentInfo}>
        <View style={styles.paymentMethod}>
          <Ionicons name="card-outline" size={24} color="#3B82F6" />
          <Text style={styles.paymentMethodText}>Tarjeta de Crédito/Débito</Text>
        </View>
        
        <Text style={styles.paymentNote}>
          El pago se procesará de forma segura a través de Stripe. 
          Tu información de tarjeta está protegida con encriptación de nivel bancario.
        </Text>
        
        <View style={styles.securityBadges}>
          <View style={styles.securityBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text style={styles.securityBadgeText}>SSL Seguro</Text>
          </View>
          <View style={styles.securityBadge}>
            <Ionicons name="lock-closed" size={16} color="#10B981" />
            <Text style={styles.securityBadgeText}>Encriptado</Text>
          </View>
        </View>
      </View>
    </AdminCard>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader
        title="Finalizar Compra"
        subtitle={`${cartItems.length} producto${cartItems.length !== 1 ? 's' : ''}`}
      />

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderOrderSummary()}
          {renderShippingForm()}
          {renderPaymentInfo()}
        </ScrollView>

        <View style={styles.bottomSection}>
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total a Pagar</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
          
          <View style={styles.checkoutButtons}>
            <AdminButton
              title="Cancelar"
              variant="secondary"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
              disabled={processingPayment}
            />
            <AdminButton
              title={processingPayment ? "Procesando..." : "Pagar Ahora"}
              onPress={handlePlaceOrder}
              loading={processingPayment}
              style={styles.payButton}
              icon="card-outline"
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      <AdminLoadingOverlay 
        visible={processingPayment} 
        text="Procesando tu pago de forma segura..." 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
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

  // Cart items (read-only)
  readOnlyCartItem: {
    backgroundColor: '#F9FAFB',
  },

  // Form styles
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  formField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#111827',
  },
  textInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },

  // Payment info
  paymentInfo: {
    alignItems: 'center',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  paymentNote: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  securityBadges: {
    flexDirection: 'row',
    gap: 16,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  securityBadgeText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },

  // Bottom section
  bottomSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  checkoutButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  payButton: {
    flex: 2,
  },
});

export default CheckoutScreen;