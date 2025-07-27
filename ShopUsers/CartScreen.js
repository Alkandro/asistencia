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
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  CartItem,
  EmptyState,
  PriceSummary,
} from '../ComponentsShop/ShopComponents';

const CartScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Estados de cálculos
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [total, setTotal] = useState(0);

  const userId = auth.currentUser?.uid;

  // Cargar carrito desde Firebase
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const cartRef = doc(db, 'cart', userId);
    
    const unsubscribe = onSnapshot(cartRef, (doc) => {
      if (doc.exists()) {
        const cartData = doc.data();
        setCartItems(cartData.items || []);
      } else {
        setCartItems([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading cart:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Calcular totales
  useEffect(() => {
    const calculateTotals = () => {
      const subtotalAmount = cartItems.reduce((sum, item) => {
        return sum + (item.unitPrice * item.quantity);
      }, 0);

      const taxRate = 0.10; // 10% de impuestos
      const taxAmount = subtotalAmount * taxRate;
      
      const shippingAmount = subtotalAmount > 50 ? 0 : 10; // Envío gratis sobre $50
      
      const totalAmount = subtotalAmount + taxAmount + shippingAmount;

      setSubtotal(subtotalAmount);
      setTax(taxAmount);
      setShipping(shippingAmount);
      setTotal(totalAmount);
    };

    calculateTotals();
  }, [cartItems]);

  // Actualizar cantidad de un item
  const handleUpdateQuantity = async (item, newQuantity) => {
    if (!userId || updating) return;

    try {
      setUpdating(true);
      const cartRef = doc(db, 'cart', userId);
      
      const updatedItems = cartItems.map(cartItem => {
        if (cartItem.productId === item.productId && 
            cartItem.size === item.size && 
            cartItem.color === item.color) {
          return { ...cartItem, quantity: newQuantity };
        }
        return cartItem;
      });

      await updateDoc(cartRef, {
        items: updatedItems,
        updatedAt: new Date(),
      });

    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'No se pudo actualizar la cantidad');
    } finally {
      setUpdating(false);
    }
  };

  // Eliminar item del carrito
  const handleRemoveItem = async (item) => {
    if (!userId || updating) return;

    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de que quieres eliminar ${item.productName} del carrito?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdating(true);
              const cartRef = doc(db, 'cart', userId);
              
              const updatedItems = cartItems.filter(cartItem => 
                !(cartItem.productId === item.productId && 
                  cartItem.size === item.size && 
                  cartItem.color === item.color)
              );

              if (updatedItems.length === 0) {
                // Si no quedan items, eliminar el documento del carrito
                await deleteDoc(cartRef);
              } else {
                await updateDoc(cartRef, {
                  items: updatedItems,
                  updatedAt: new Date(),
                });
              }

            } catch (error) {
              console.error('Error removing item:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  // Limpiar carrito completo
  const handleClearCart = async () => {
    if (!userId || updating || cartItems.length === 0) return;

    Alert.alert(
      'Vaciar carrito',
      '¿Estás seguro de que quieres eliminar todos los productos del carrito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Vaciar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdating(true);
              const cartRef = doc(db, 'cart', userId);
              await deleteDoc(cartRef);
            } catch (error) {
              console.error('Error clearing cart:', error);
              Alert.alert('Error', 'No se pudo vaciar el carrito');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  // Ir al checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Carrito vacío', 'Agrega productos antes de continuar');
      return;
    }

    navigation.navigate('Checkout', {
      cartItems,
      subtotal,
      tax,
      shipping,
      total,
    });
  };

  // Continuar comprando
  const handleContinueShopping = () => {
    navigation.navigate('Shop');
  };

  // Función de refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    // Los datos se actualizan automáticamente por el listener
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Renderizar item del carrito
  const renderCartItem = ({ item }) => (
    <CartItem
      item={item}
      onUpdateQuantity={handleUpdateQuantity}
      onRemove={handleRemoveItem}
      style={styles.cartItem}
    />
  );

  // Renderizar header del carrito
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Mi Carrito</Text>
        <Text style={styles.headerSubtitle}>
          {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}
        </Text>
      </View>
      
      {cartItems.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearCart}
          disabled={updating}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={styles.clearButtonText}>Vaciar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Renderizar footer con resumen y botones
  const renderFooter = () => {
    if (cartItems.length === 0) return null;

    return (
      <View style={styles.footer}>
        {/* Resumen de precios */}
        <PriceSummary
          subtotal={subtotal}
          tax={tax}
          shipping={shipping}
          total={total}
          style={styles.priceSummary}
        />

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinueShopping}
          >
            <Ionicons name="storefront-outline" size={20} color="#6B7280" />
            <Text style={styles.continueButtonText}>Seguir comprando</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkoutButton, updating && styles.checkoutButtonDisabled]}
            onPress={handleCheckout}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.checkoutButtonText}>
                  Finalizar compra - ${total.toFixed(2)}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Renderizar contenido principal
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando carrito...</Text>
        </View>
      );
    }

    if (!userId) {
      return (
        <EmptyState
          icon="person-outline"
          title="Inicia sesión"
          subtitle="Debes iniciar sesión para ver tu carrito"
          actionText="Ir a login"
          onActionPress={() => navigation.navigate('Login')}
        />
      );
    }

    if (cartItems.length === 0) {
      return (
        <EmptyState
          icon="bag-outline"
          title="Carrito vacío"
          subtitle="Aún no has agregado productos a tu carrito"
          actionText="Explorar tienda"
          onActionPress={handleContinueShopping}
        />
      );
    }

    return (
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item, index) => `${item.productId}-${item.size}-${item.color}-${index}`}
        contentContainerStyle={styles.cartList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
          />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <View style={styles.content}>
        {renderContent()}
      </View>

      {renderFooter()}

      {/* Overlay de carga */}
      {updating && (
        <View style={styles.updatingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.updatingText}>Actualizando...</Text>
        </View>
      )}
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
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    gap: 4,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },

  // Content
  content: {
    flex: 1,
  },
  cartList: {
    padding: 16,
    paddingBottom: 32,
  },
  cartItem: {
    marginBottom: 12,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },

  // Footer
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  priceSummary: {
    marginBottom: 20,
  },
  actionButtons: {
    gap: 12,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    gap: 8,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Updating overlay
  updatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updatingText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 16,
  },
});

export default CartScreen;
