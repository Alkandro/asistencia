// ProductDetailScreen.js - Pantalla de detalle de producto
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  Alert,
  FlatList,
} from 'react-native';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ProductDetailScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { product } = route.params;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    // Seleccionar primera variante disponible por defecto
    if (product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
    if (product.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
  }, [product]);

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  const getVariantKey = (size, color) => {
    const parts = [];
    if (size) parts.push(size);
    if (color) parts.push(color);
    return parts.join('-') || 'default';
  };

  const getAvailableStock = () => {
    const variantKey = getVariantKey(selectedSize, selectedColor);
    return product.stock?.[variantKey] || 0;
  };

  const getStockStatus = () => {
    const stock = getAvailableStock();
    if (stock === 0) return { text: 'Agotado', color: '#EF4444' };
    if (stock < 5) return { text: `Solo ${stock} disponibles`, color: '#F59E0B' };
    return { text: 'Disponible', color: '#10B981' };
  };

  const handleAddToCart = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'Debes iniciar sesión para agregar productos al carrito');
        return;
      }

      const availableStock = getAvailableStock();
      if (availableStock === 0) {
        Alert.alert('Sin stock', 'Esta variante está agotada');
        return;
      }

      if (quantity > availableStock) {
        Alert.alert('Stock insuficiente', `Solo hay ${availableStock} unidades disponibles`);
        return;
      }

      setAddingToCart(true);

      const cartRef = doc(db, 'cart', userId);
      const cartSnap = await getDoc(cartRef);

      const newItem = {
        productId: product.id,
        productName: product.name,
        size: selectedSize,
        color: selectedColor,
        quantity: quantity,
        unitPrice: product.price,
        totalPrice: product.price * quantity,
        imageUrl: product.images?.[0] || null,
        addedAt: new Date(),
      };

      if (cartSnap.exists()) {
        const cartData = cartSnap.data();
        const existingItems = cartData.items || [];
        
        // Verificar si el producto ya está en el carrito
        const existingItemIndex = existingItems.findIndex(item => 
          item.productId === product.id && 
          item.size === selectedSize && 
          item.color === selectedColor
        );

        if (existingItemIndex >= 0) {
          // Actualizar cantidad
          const newQuantity = existingItems[existingItemIndex].quantity + quantity;
          if (newQuantity > availableStock) {
            Alert.alert('Stock insuficiente', `Solo puedes agregar ${availableStock - existingItems[existingItemIndex].quantity} unidades más`);
            return;
          }
          
          existingItems[existingItemIndex].quantity = newQuantity;
          existingItems[existingItemIndex].totalPrice = 
            existingItems[existingItemIndex].quantity * existingItems[existingItemIndex].unitPrice;
        } else {
          // Agregar nuevo item
          existingItems.push(newItem);
        }

        await updateDoc(cartRef, {
          items: existingItems,
          updatedAt: new Date(),
        });
      } else {
        // Crear carrito nuevo
        await setDoc(cartRef, {
          userId,
          items: [newItem],
          updatedAt: new Date(),
        });
      }

      Alert.alert(
        'Éxito', 
        'Producto agregado al carrito',
        [
          { text: 'Seguir comprando', style: 'cancel' },
          { text: 'Ver carrito', onPress: () => navigation.navigate('Cart') }
        ]
      );
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      Alert.alert('Error', 'No se pudo agregar el producto al carrito');
    } finally {
      setAddingToCart(false);
    }
  };

  const renderImageGallery = () => (
    <View style={styles.imageGallery}>
      {/* Imagen principal */}
      <View style={styles.mainImageContainer}>
        {product.images && product.images.length > 0 ? (
          <Image
            source={{ uri: product.images[selectedImageIndex] }}
            style={styles.mainImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={64} color="#D1D5DB" />
          </View>
        )}
      </View>

      {/* Thumbnails */}
      {product.images && product.images.length > 1 && (
        <FlatList
          data={product.images}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.thumbnailsList}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[
                styles.thumbnail,
                selectedImageIndex === index && styles.thumbnailSelected
              ]}
              onPress={() => setSelectedImageIndex(index)}
            >
              <Image
                source={{ uri: item }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  const renderSizeSelector = () => {
    if (!product.sizes || product.sizes.length === 0) return null;

    return (
      <View style={styles.selectorSection}>
        <Text style={styles.selectorTitle}>Talla</Text>
        <View style={styles.selectorOptions}>
          {product.sizes.map((size) => {
            const variantKey = getVariantKey(size, selectedColor);
            const stock = product.stock?.[variantKey] || 0;
            const isSelected = selectedSize === size;
            const isAvailable = stock > 0;

            return (
              <TouchableOpacity
                key={size}
                style={[
                  styles.selectorOption,
                  isSelected && styles.selectorOptionSelected,
                  !isAvailable && styles.selectorOptionDisabled,
                ]}
                onPress={() => isAvailable && setSelectedSize(size)}
                disabled={!isAvailable}
              >
                <Text style={[
                  styles.selectorOptionText,
                  isSelected && styles.selectorOptionTextSelected,
                  !isAvailable && styles.selectorOptionTextDisabled,
                ]}>
                  {size}
                </Text>
                {!isAvailable && (
                  <View style={styles.unavailableBadge}>
                    <Text style={styles.unavailableBadgeText}>Agotado</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderColorSelector = () => {
    if (!product.colors || product.colors.length === 0) return null;

    const colorMap = {
      white: '#FFFFFF',
      black: '#000000',
      blue: '#3B82F6',
      red: '#EF4444',
      green: '#10B981',
      yellow: '#F59E0B',
      purple: '#8B5CF6',
      gray: '#6B7280',
    };

    return (
      <View style={styles.selectorSection}>
        <Text style={styles.selectorTitle}>Color</Text>
        <View style={styles.selectorOptions}>
          {product.colors.map((color) => {
            const variantKey = getVariantKey(selectedSize, color);
            const stock = product.stock?.[variantKey] || 0;
            const isSelected = selectedColor === color;
            const isAvailable = stock > 0;
            const colorValue = colorMap[color.toLowerCase()] || '#D1D5DB';

            return (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  isSelected && styles.colorOptionSelected,
                  !isAvailable && styles.colorOptionDisabled,
                ]}
                onPress={() => isAvailable && setSelectedColor(color)}
                disabled={!isAvailable}
              >
                <View style={[
                  styles.colorSwatch,
                  { backgroundColor: colorValue },
                  color.toLowerCase() === 'white' && styles.colorSwatchBorder,
                ]} />
                <Text style={[
                  styles.colorOptionText,
                  isSelected && styles.colorOptionTextSelected,
                  !isAvailable && styles.colorOptionTextDisabled,
                ]}>
                  {color}
                </Text>
                {!isAvailable && (
                  <View style={styles.unavailableBadge}>
                    <Text style={styles.unavailableBadgeText}>Agotado</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderQuantitySelector = () => {
    const maxQuantity = Math.min(getAvailableStock(), 10);

    return (
      <View style={styles.selectorSection}>
        <Text style={styles.selectorTitle}>Cantidad</Text>
        <View style={styles.quantitySelector}>
          <TouchableOpacity
            style={[
              styles.quantityButton,
              quantity <= 1 && styles.quantityButtonDisabled
            ]}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Ionicons name="remove" size={20} color={quantity <= 1 ? '#D1D5DB' : '#6B7280'} />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{quantity}</Text>
          
          <TouchableOpacity
            style={[
              styles.quantityButton,
              quantity >= maxQuantity && styles.quantityButtonDisabled
            ]}
            onPress={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
            disabled={quantity >= maxQuantity}
          >
            <Ionicons name="add" size={20} color={quantity >= maxQuantity ? '#D1D5DB' : '#6B7280'} />
          </TouchableOpacity>
        </View>
        <Text style={styles.stockInfo}>
          {maxQuantity} unidades disponibles
        </Text>
      </View>
    );
  };

  const stockStatus = getStockStatus();

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
        <Text style={styles.headerTitle}>Detalle del Producto</Text>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Ionicons name="bag-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Galería de imágenes */}
        {renderImageGallery()}

        {/* Información del producto */}
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={styles.productCategory}>
              {product.category?.toUpperCase() || 'PRODUCTO'}
            </Text>
            <View style={[styles.stockBadge, { backgroundColor: stockStatus.color }]}>
              <Text style={styles.stockBadgeText}>{stockStatus.text}</Text>
            </View>
          </View>

          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>

          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>Descripción</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          )}

          {/* Selectores */}
          {renderSizeSelector()}
          {renderColorSelector()}
          {renderQuantitySelector()}
        </View>
      </ScrollView>

      {/* Botón de agregar al carrito */}
      <View style={styles.bottomSection}>
        <View style={styles.priceSection}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>
            {formatPrice(product.price * quantity)}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            (getAvailableStock() === 0 || addingToCart) && styles.addToCartButtonDisabled
          ]}
          onPress={handleAddToCart}
          disabled={getAvailableStock() === 0 || addingToCart}
        >
          {addingToCart ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.addToCartButtonText}>Agregando...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="bag-add" size={20} color="#fff" />
              <Text style={styles.addToCartButtonText}>
                {getAvailableStock() === 0 ? 'Agotado' : 'Agregar al Carrito'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cartButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },

  // Image gallery
  imageGallery: {
    backgroundColor: '#F9FAFB',
  },
  mainImageContainer: {
    width: width,
    height: width,
    backgroundColor: '#fff',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  thumbnailsList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailSelected: {
    borderColor: '#111827',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },

  // Product info
  productInfo: {
    padding: 20,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productCategory: {
    fontSize: 12,
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 32,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },

  // Description
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },

  // Selectors
  selectorSection: {
    marginBottom: 24,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  selectorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectorOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    position: 'relative',
  },
  selectorOptionSelected: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  selectorOptionDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  selectorOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectorOptionTextSelected: {
    color: '#fff',
  },
  selectorOptionTextDisabled: {
    color: '#9CA3AF',
  },

  // Color selector
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    position: 'relative',
  },
  colorOptionSelected: {
    borderColor: '#111827',
    backgroundColor: '#F9FAFB',
  },
  colorOptionDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  colorSwatchBorder: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  colorOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textTransform: 'capitalize',
  },
  colorOptionTextSelected: {
    color: '#111827',
    fontWeight: '600',
  },
  colorOptionTextDisabled: {
    color: '#9CA3AF',
  },

  // Unavailable badge
  unavailableBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unavailableBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600',
  },

  // Quantity selector
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    minWidth: 32,
    textAlign: 'center',
  },
  stockInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },

  // Bottom section
  bottomSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default ProductDetailScreen;