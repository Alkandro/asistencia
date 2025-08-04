// CartScreen.js - Carrito con cálculo de totales corregido
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const CartScreen = () => {
  const navigation = useNavigation();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Cargar items del carrito
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const cartRef = collection(db, 'cart');
    const q = query(cartRef, where('userId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setCartItems(items);
      setLoading(false);
    }, (error) => {
      console.error('Error loading cart:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Función de refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Actualizar cantidad
  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    try {
      setUpdating(true);
      const itemRef = doc(db, 'cart', itemId);
      await updateDoc(itemRef, { quantity: newQuantity });
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'No se pudo actualizar la cantidad');
    } finally {
      setUpdating(false);
    }
  };

  // Eliminar item
  const removeItem = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'cart', itemId));
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', 'No se pudo eliminar el producto');
    }
  };

  // Vaciar carrito
  const clearCart = () => {
    Alert.alert(
      'Vaciar Carrito',
      '¿Estás seguro de que quieres eliminar todos los productos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vaciar',
          style: 'destructive',
          onPress: async () => {
            try {
              const batch = writeBatch(db);
              cartItems.forEach((item) => {
                const itemRef = doc(db, 'cart', item.id);
                batch.delete(itemRef);
              });
              await batch.commit();
            } catch (error) {
              console.error('Error clearing cart:', error);
              Alert.alert('Error', 'No se pudo vaciar el carrito');
            }
          }
        }
      ]
    );
  };

  // Calcular totales (CORREGIDO)
  const calculateTotals = () => {
    let subtotal = 0;
    let itemCount = 0;

    cartItems.forEach((item) => {
      // Asegurar que los valores sean números válidos
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const quantity = parseInt(item.quantity) || 0;
      
      subtotal += unitPrice * quantity;
      itemCount += quantity;
    });

    const shipping = subtotal > 50 ? 0 : 10; // Envío gratis por compras mayores a $50
    const tax = subtotal * 0.00; // 8% de impuestos
    const total = subtotal + shipping + tax;

    return {
      subtotal: isNaN(subtotal) ? 0 : subtotal,
      shipping: isNaN(shipping) ? 0 : shipping,
      tax: isNaN(tax) ? 0 : tax,
      total: isNaN(total) ? 0 : total,
      itemCount: isNaN(itemCount) ? 0 : itemCount,
    };
  };

  // Formatear precio
  const formatPrice = (price) => {
    const numPrice = parseFloat(price) || 0;
    return `$${numPrice.toFixed(2)}`;
  };

  // Navegar a checkout
  const proceedToCheckout = () => {
    const totals = calculateTotals();
    if (totals.total <= 0) {
      Alert.alert('Error', 'El carrito está vacío');
      return;
    }
    
    navigation.navigate('Checkout', { 
      cartItems,
      totals 
    });
  };

  // Renderizar item del carrito
  const renderCartItem = ({ item }) => {
    // Validar datos del item
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const quantity = parseInt(item.quantity) || 1;
    const itemTotal = unitPrice * quantity;

    return (
      <View style={styles.cartItem}>
        <View style={styles.itemImageContainer}>
          {item.productImage ? (
            <Image source={{ uri: item.productImage }} style={styles.itemImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={32} color="#D1D5DB" />
            </View>
          )}
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.productName || 'Producto sin nombre'}
          </Text>
          
          {/* Variantes */}
          <View style={styles.itemVariants}>
            {item.size && (
              <Text style={styles.variantText}>Talla: {item.size}</Text>
            )}
            {item.color && (
              <Text style={styles.variantText}>Color: {item.color}</Text>
            )}
          </View>

          <Text style={styles.itemPrice}>{formatPrice(unitPrice)}</Text>
        </View>

        <View style={styles.itemActions}>
          {/* Controles de cantidad */}
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
              onPress={() => updateQuantity(item.id, quantity - 1)}
              disabled={updating || quantity <= 1}
            >
              <Ionicons name="remove" size={16} color={quantity <= 1 ? "#D1D5DB" : "#374151"} />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{quantity}</Text>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, quantity + 1)}
              disabled={updating}
            >
              <Ionicons name="add" size={16} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Total del item */}
          <Text style={styles.itemTotal}>{formatPrice(itemTotal)}</Text>

          {/* Botón eliminar */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeItem(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Renderizar resumen de precios
  const renderPriceSummary = () => {
    const totals = calculateTotals();

    return (
      <View style={styles.priceSummary}>
        <Text style={styles.summaryTitle}>Resumen del Pedido</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal ({totals.itemCount} productos)</Text>
          <Text style={styles.summaryValue}>{formatPrice(totals.subtotal)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Envío</Text>
          <Text style={styles.summaryValue}>
            {totals.shipping === 0 ? 'Gratis' : formatPrice(totals.shipping)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Impuestos</Text>
          <Text style={styles.summaryValue}>{formatPrice(totals.tax)}</Text>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotalLabel}>Total</Text>
          <Text style={styles.summaryTotalValue}>{formatPrice(totals.total)}</Text>
        </View>

        {totals.subtotal < 50 && totals.subtotal > 0 && (
          <Text style={styles.shippingNote}>
            Agrega {formatPrice(50 - totals.subtotal)} más para envío gratis
          </Text>
        )}
      </View>
    );
  };

  // Renderizar estado vacío
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bag-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
      <Text style={styles.emptySubtitle}>
        Agrega productos para comenzar tu compra
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
          <Text style={styles.loadingText}>Cargando carrito...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totals = calculateTotals();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finalizar Compra</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearCart}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      {cartItems.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Lista de productos */}
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
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
            ListHeaderComponent={
              <Text style={styles.listHeader}>
                Finalizar Compra
              </Text>
            }
            ListFooterComponent={renderPriceSummary}
          />

          {/* Footer con botón de checkout */}
          <View style={styles.footer}>
            <View style={styles.footerTotals}>
              <Text style={styles.footerTotalLabel}>Total a Pagar</Text>
              <Text style={styles.footerTotalValue}>{formatPrice(totals.total)}</Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.checkoutButton,
                totals.total <= 0 && styles.checkoutButtonDisabled
              ]}
              onPress={proceedToCheckout}
              disabled={totals.total <= 0 || updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="card-outline" size={20} color="#fff" />
                  <Text style={styles.checkoutButtonText}>Pagar Ahora</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
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
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingBottom: 32,
  },
  listHeader: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  
  // Cart Item
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImageContainer: {
    marginRight: 16,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
    marginRight: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemVariants: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  variantText: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemActions: {
    alignItems: 'center',
    gap: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quantityButtonDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    minWidth: 24,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Price Summary
  priceSummary: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  shippingNote: {
    fontSize: 12,
    color: '#10B981',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  
  // Footer
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footerTotals: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  footerTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
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

export default CartScreen;
