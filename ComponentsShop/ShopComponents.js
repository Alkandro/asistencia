import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ActivityIndicator,
  Dimensions,
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ===== COMPONENTES DE PRODUCTO =====

// Card de producto para la lista
export const ProductCard = ({ 
  product, 
  onPress, 
  style,
  showAddToCart = false,
  onAddToCart 
}) => {
  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  const getStockStatus = (stock) => {
    const totalStock = Object.values(stock || {}).reduce((sum, qty) => sum + qty, 0);
    if (totalStock === 0) return { text: 'Agotado', color: '#EF4444' };
    if (totalStock < 5) return { text: 'Pocas unidades', color: '#F59E0B' };
    return { text: 'Disponible', color: '#10B981' };
  };

  const stockStatus = getStockStatus(product.stock);
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <TouchableOpacity 
      style={[styles.productCard, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Imagen del producto */}
      <View style={styles.productImageContainer}>
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={40} color="#D1D5DB" />
          </View>
        )}
        
        {/* Badge de stock */}
        <View style={[styles.stockBadge, { backgroundColor: stockStatus.color }]}>
          <Text style={styles.stockBadgeText}>{stockStatus.text}</Text>
        </View>
      </View>

      {/* Información del producto */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productCategory}>
          {product.category?.toUpperCase() || 'PRODUCTO'}
        </Text>
        <Text style={styles.productPrice}>
          {formatPrice(product.price)}
        </Text>
      </View>

      {/* Botón agregar al carrito (opcional) */}
      {showAddToCart && (
        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={(e) => {
            e.stopPropagation();
            onAddToCart && onAddToCart(product);
          }}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

// ===== COMPONENTES DE CARRITO =====

// Item del carrito
export const CartItem = ({ 
  item, 
  onUpdateQuantity, 
  onRemove,
  style,
  readOnly = false
}) => {
  const [updating, setUpdating] = useState(false);

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  const handleQuantityChange = async (newQuantity) => {
    if (readOnly) return;
    
    if (newQuantity <= 0) {
      Alert.alert(
        'Eliminar producto',
        '¿Estás seguro de que quieres eliminar este producto del carrito?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => onRemove && onRemove(item) }
        ]
      );
      return;
    }

    setUpdating(true);
    try {
      await onUpdateQuantity(item, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdating(false);
    }
  };

  const imageUrl = item.productImage || (item.images && item.images[0]);

  return (
    <View style={[styles.cartItem, style]}>
      {/* Imagen del producto */}
      <View style={styles.cartItemImage}>
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.cartImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.cartImagePlaceholder}>
            <Ionicons name="image-outline" size={24} color="#D1D5DB" />
          </View>
        )}
      </View>

      {/* Información del producto */}
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName} numberOfLines={2}>
          {item.productName || item.name}
        </Text>
        
        {/* Variantes */}
        {(item.size || item.color) && (
          <View style={styles.cartItemVariants}>
            {item.size && (
              <Text style={styles.cartItemVariant}>Talla: {item.size}</Text>
            )}
            {item.color && (
              <Text style={styles.cartItemVariant}>Color: {item.color}</Text>
            )}
          </View>
        )}

        {/* Precio unitario */}
        <Text style={styles.cartItemPrice}>
          {formatPrice(item.unitPrice || item.price)}
        </Text>
      </View>

      {/* Controles de cantidad */}
      <View style={styles.cartItemControls}>
        {!readOnly ? (
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item.quantity - 1)}
              disabled={updating}
            >
              <Ionicons name="remove" size={16} color="#6B7280" />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{item.quantity}</Text>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item.quantity + 1)}
              disabled={updating}
            >
              <Ionicons name="add" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.quantityReadOnly}>Cantidad: {item.quantity}</Text>
        )}

        {/* Precio total */}
        <Text style={styles.cartItemTotal}>
          {formatPrice((item.unitPrice || item.price) * item.quantity)}
        </Text>

        {/* Botón eliminar */}
        {!readOnly && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove && onRemove(item)}
            disabled={updating}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      {updating && (
        <View style={styles.updatingOverlay}>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      )}
    </View>
  );
};

// ===== COMPONENTES DE INTERFAZ =====

// Header de la tienda
export const ShopHeader = ({ 
  title, 
  subtitle, 
  cartItemCount = 0, 
  onCartPress,
  onSearchPress,
  style 
}) => {
  return (
    <View style={[styles.shopHeader, style]}>
      <View style={styles.shopHeaderContent}>
        <View style={styles.shopHeaderText}>
          <Text style={styles.shopHeaderTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.shopHeaderSubtitle}>{subtitle}</Text>
          )}
        </View>
        
        <View style={styles.shopHeaderActions}>
          {onSearchPress && (
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={onSearchPress}
            >
              <Ionicons name="search-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
          )}
          
          {onCartPress && (
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={onCartPress}
            >
              <Ionicons name="bag-outline" size={24} color="#6B7280" />
              {cartItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

// Filtro de categorías
export const CategoryFilter = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  style 
}) => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={[styles.categoryFilter, style]}
      contentContainerStyle={styles.categoryFilterContent}
    >
      <TouchableOpacity
        style={[
          styles.categoryButton,
          !selectedCategory && styles.categoryButtonActive
        ]}
        onPress={() => onSelectCategory(null)}
      >
        <Text style={[
          styles.categoryButtonText,
          !selectedCategory && styles.categoryButtonTextActive
        ]}>
          Todos
        </Text>
      </TouchableOpacity>
      
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryButton,
            selectedCategory === category.id && styles.categoryButtonActive
          ]}
          onPress={() => onSelectCategory(category.id)}
        >
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === category.id && styles.categoryButtonTextActive
          ]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ===== COMPONENTES DE ESTADO =====

// Loading de productos
export const ProductsLoading = ({ count = 6 }) => {
  return (
    <View style={styles.productsGrid}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.productCardSkeleton}>
          <View style={styles.productImageSkeleton} />
          <View style={styles.productInfoSkeleton}>
            <View style={styles.productNameSkeleton} />
            <View style={styles.productCategorySkeleton} />
            <View style={styles.productPriceSkeleton} />
          </View>
        </View>
      ))}
    </View>
  );
};

// Estado vacío
export const EmptyState = ({ 
  icon = "cube-outline", 
  title, 
  subtitle, 
  actionText,
  onActionPress,
  style 
}) => {
  return (
    <View style={[styles.emptyState, style]}>
      <Ionicons name={icon} size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>{title}</Text>
      {subtitle && (
        <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
      )}
      {actionText && onActionPress && (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={onActionPress}
        >
          <Text style={styles.emptyStateButtonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ===== COMPONENTES DE PAGO =====

// Resumen de precios
export const PriceSummary = ({ 
  subtotal = 0, 
  tax = 0, 
  shipping = 0, 
  discount = 0,
  total = 0,
  style 
}) => {
  const formatPrice = (price) => `$${price.toFixed(2)}`;

  return (
    <View style={[styles.priceSummary, style]}>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Subtotal</Text>
        <Text style={styles.priceValue}>{formatPrice(subtotal)}</Text>
      </View>
      
      {tax > 0 && (
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Impuestos</Text>
          <Text style={styles.priceValue}>{formatPrice(tax)}</Text>
        </View>
      )}
      
      {shipping > 0 && (
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Envío</Text>
          <Text style={styles.priceValue}>{formatPrice(shipping)}</Text>
        </View>
      )}
      
      {discount > 0 && (
        <View style={styles.priceRow}>
          <Text style={[styles.priceLabel, { color: '#10B981' }]}>Descuento</Text>
          <Text style={[styles.priceValue, { color: '#10B981' }]}>-{formatPrice(discount)}</Text>
        </View>
      )}
      
      <View style={styles.priceDivider} />
      
      <View style={styles.priceRow}>
        <Text style={styles.priceTotalLabel}>Total</Text>
        <Text style={styles.priceTotalValue}>{formatPrice(total)}</Text>
      </View>
    </View>
  );
};

// Formulario de pago
export const PaymentForm = ({ 
  onSubmit, 
  loading = false,
  style 
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : cleaned;
  };

  const formatExpiryDate = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handleSubmit = () => {
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const paymentData = {
      cardNumber: cardNumber.replace(/\s/g, ''),
      expiryDate,
      cvv,
      cardholderName,
    };

    onSubmit && onSubmit(paymentData);
  };

  return (
    <View style={[styles.paymentForm, style]}>
      <Text style={styles.paymentFormTitle}>Información de Pago</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nombre del Titular</Text>
        <TextInput
          style={styles.textInput}
          value={cardholderName}
          onChangeText={setCardholderName}
          placeholder="Nombre completo"
          autoCapitalize="words"
          editable={!loading}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Número de Tarjeta</Text>
        <TextInput
          style={styles.textInput}
          value={cardNumber}
          onChangeText={(text) => setCardNumber(formatCardNumber(text))}
          placeholder="1234 5678 9012 3456"
          keyboardType="numeric"
          maxLength={19}
          editable={!loading}
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Fecha de Vencimiento</Text>
          <TextInput
            style={styles.textInput}
            value={expiryDate}
            onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
            placeholder="MM/AA"
            keyboardType="numeric"
            maxLength={5}
            editable={!loading}
          />
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>CVV</Text>
          <TextInput
            style={styles.textInput}
            value={cvv}
            onChangeText={setCvv}
            placeholder="123"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
            editable={!loading}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.paymentButton, loading && styles.paymentButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.paymentButtonText}>Procesar Pago</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// ===== ESTILOS =====

const styles = StyleSheet.create({
  // Product Card
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: (width - 48) / 2,
    marginHorizontal: 4,
  },
  productImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  addToCartButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Cart Item
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  cartItemImage: {
    marginRight: 16,
  },
  cartImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  cartImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cartItemVariants: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 12,
  },
  cartItemVariant: {
    fontSize: 12,
    color: '#6B7280',
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#6B7280',
  },
  cartItemControls: {
    alignItems: 'flex-end',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  quantityReadOnly: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  cartItemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  removeButton: {
    padding: 4,
  },
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

  // Shop Header
  shopHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  shopHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shopHeaderText: {
    flex: 1,
  },
  shopHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  shopHeaderSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  shopHeaderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Category Filter
  categoryFilter: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryFilterContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },

  // Products Grid
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  // Loading Skeletons
  productCardSkeleton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: (width - 48) / 2,
    marginHorizontal: 4,
  },
  productImageSkeleton: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  productInfoSkeleton: {
    gap: 8,
  },
  productNameSkeleton: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    width: '80%',
  },
  productCategorySkeleton: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    width: '60%',
  },
  productPriceSkeleton: {
    height: 18,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    width: '40%',
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Price Summary
  priceSummary: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  priceTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  priceTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  // Payment Form
  paymentForm: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentFormTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
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
    color: '#111827',
    backgroundColor: '#fff',
  },
  paymentButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  paymentButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Exports individuales - no usar export default para evitar ciclos
// Los componentes ya están exportados individualmente arriba

