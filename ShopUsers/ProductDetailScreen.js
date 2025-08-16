// ProductDetailScreen_FUNCTIONAL_VARIANTS.js - Selector de variantes funcional
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ProductDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Obtener productId de múltiples formas posibles
  const productId = route.params?.productId || 
                   route.params?.id || 
                   route.params?.product?.id ||
                   route.params?.item?.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  console.log('🔍 ProductDetailScreen - Route params:', route.params);
  console.log('🆔 ProductID extraído:', productId);

  // Cargar producto desde Firebase
  useEffect(() => {
    if (!productId) {
      Alert.alert(
        'Error de Navegación', 
        `No se pudo obtener el ID del producto.\n\nParámetros recibidos: ${JSON.stringify(route.params)}`,
        [
          { text: 'Volver', onPress: () => navigation.goBack() }
        ]
      );
      return;
    }
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      console.log('📦 Cargando producto con ID:', productId);
      
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        const productData = productSnap.data();
        console.log('✅ Producto encontrado:', productData.name);
        console.log('📊 Stock del producto:', productData.stock);
        
        // Limpiar y validar datos del producto
        const cleanProduct = {
          id: productSnap.id,
          ...productData,
          name: productData.name || 'Producto sin nombre',
          description: productData.description || '',
          price: parseFloat(productData.price) || 0,
          images: Array.isArray(productData.images) ? productData.images : [],
          sizes: Array.isArray(productData.sizes) ? productData.sizes : [],
          colors: Array.isArray(productData.colors) ? productData.colors : [],
          stock: productData.stock || {},
        };

        setProduct(cleanProduct);
        
        // Auto-seleccionar primera opción disponible
        if (cleanProduct.sizes.length > 0) {
          const firstAvailableSize = cleanProduct.sizes.find(size => 
            getVariantStock(cleanProduct, size, null) > 0
          );
          if (firstAvailableSize) {
            setSelectedSize(firstAvailableSize);
          }
        }
        
        if (cleanProduct.colors.length > 0) {
          const firstAvailableColor = cleanProduct.colors.find(color => 
            getVariantStock(cleanProduct, null, color) > 0
          );
          if (firstAvailableColor) {
            setSelectedColor(firstAvailableColor);
          }
        }
      } else {
        console.log('❌ Producto no encontrado');
        Alert.alert(
          'Producto No Encontrado',
          `No se encontró el producto con ID: ${productId}`,
          [
            { text: 'Reintentar', onPress: loadProduct },
            { text: 'Volver', onPress: () => navigation.goBack() }
          ]
        );
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert(
        'Error',
        'No se pudo cargar el producto. Verifica tu conexión.',
        [
          { text: 'Reintentar', onPress: loadProduct },
          { text: 'Volver', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // FUNCIÓN CLAVE: Obtener stock de una variante específica
  const getVariantStock = (product, size, color) => {
    if (!product || !product.stock) {
      return 0;
    }

    // Si no hay variantes, usar stock general
    if (!size && !color) {
      if (typeof product.stock === 'number') {
        return product.stock;
      }
      // Si es objeto, sumar todo
      if (typeof product.stock === 'object') {
        return Object.values(product.stock).reduce((total, stock) => {
          return total + (parseInt(stock) || 0);
        }, 0);
      }
      return 0;
    }

    // Buscar stock por variante específica
    const stockKey = [size, color].filter(Boolean).join('-');
    console.log('🔍 Buscando stock para:', stockKey);
    console.log('📊 Stock object:', product.stock);
    
    // Intentar diferentes formatos de clave
    const possibleKeys = [
      stockKey,
      `${size}-${color}`,
      `${color}-${size}`,
      size,
      color,
    ].filter(Boolean);

    for (const key of possibleKeys) {
      if (product.stock[key] !== undefined) {
        const stock = parseInt(product.stock[key]) || 0;
        console.log(`✅ Stock encontrado para ${key}:`, stock);
        return stock;
      }
    }

    console.log('⚠️ No se encontró stock para la variante');
    return 0;
  };

  // Obtener stock total del producto
  const getTotalStock = () => {
    if (!product) return 0;
    
    if (selectedSize || selectedColor) {
      return getVariantStock(product, selectedSize, selectedColor);
    }
    
    return getVariantStock(product, null, null);
  };

  // Formatear precio
  const formatPrice = (price) => `$${(parseFloat(price) || 0).toFixed(2)}`;

  // Agregar al carrito
  const addToCart = async () => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'Debes iniciar sesión para agregar productos al carrito');
      return;
    }

    // Validar selección de variantes
    if (product.sizes.length > 0 && !selectedSize) {
      Alert.alert('Selecciona una Talla', 'Debes seleccionar una talla antes de agregar al carrito');
      return;
    }

    if (product.colors.length > 0 && !selectedColor) {
      Alert.alert('Selecciona un Color', 'Debes seleccionar un color antes de agregar al carrito');
      return;
    }

    // Verificar stock
    const availableStock = getTotalStock();
    if (availableStock < quantity) {
      Alert.alert('Stock Insuficiente', `Solo hay ${availableStock} unidades disponibles`);
      return;
    }

    try {
      setAddingToCart(true);

      const cartItem = {
        userId: auth.currentUser.uid,
        productId: product.id,
        productName: product.name,
        productImage: product.images?.[0] || '',
        unitPrice: product.price,
        quantity: quantity,
        size: selectedSize,
        color: selectedColor,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'cart'), cartItem);
      
      Alert.alert(
        'Producto Agregado',
        `${product.name} se agregó al carrito`,
        [
          { text: 'Seguir Comprando', style: 'cancel' },
          { text: 'Ver Carrito', onPress: () => navigation.navigate('Cart') }
        ]
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'No se pudo agregar el producto al carrito');
    } finally {
      setAddingToCart(false);
    }
  };

  // Renderizar galería de imágenes
  const renderImageGallery = () => {
    if (!product.images || product.images.length === 0) {
      return (
        <View style={[styles.productImage, styles.placeholderImageContainer]}>
          <Ionicons name="image-outline" size={64} color="#D1D5DB" />
          <Text style={styles.placeholderText}>Sin imagen</Text>
        </View>
      );
    }

    return (
      <View style={styles.imageGalleryContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
        >
          {product.images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
        
        {product.images.length > 1 && (
          <View style={styles.imageIndicators}>
            {product.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.imageIndicator,
                  index === currentImageIndex && styles.imageIndicatorActive
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  // RENDERIZAR SELECTOR DE TALLAS FUNCIONAL
  const renderSizeSelector = () => {
    if (!product.sizes || product.sizes.length === 0) return null;

    return (
      <View style={styles.variantSection}>
        <Text style={styles.variantTitle}>Talla</Text>
        <View style={styles.variantOptions}>
          {product.sizes.map((size) => {
            const stock = getVariantStock(product, size, selectedColor);
            const isAvailable = stock > 0;
            const isSelected = selectedSize === size;
            
            console.log(`👕 Talla ${size}: Stock ${stock}, Disponible: ${isAvailable}`);
            
            // Solo mostrar si está disponible
            if (!isAvailable) return null;
            
            return (
              <TouchableOpacity
                key={size}
                style={[
                  styles.variantOption,
                  isSelected && styles.variantOptionSelected,
                  !isAvailable && styles.variantOptionDisabled,
                ]}
                onPress={() => isAvailable && setSelectedSize(size)}
                disabled={!isAvailable}
              >
                <Text style={[
                  styles.variantOptionText,
                  isSelected && styles.variantOptionTextSelected,
                  !isAvailable && styles.variantOptionTextDisabled,
                ]}>
                  {size}
                </Text>
                {!isAvailable && (
                  <View style={styles.outOfStockOverlay}>
                    <Text style={styles.outOfStockText}>AGOTADO</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // RENDERIZAR SELECTOR DE COLORES FUNCIONAL
  const renderColorSelector = () => {
    if (!product.colors || product.colors.length === 0) return null;

    return (
      <View style={styles.variantSection}>
        <Text style={styles.variantTitle}>Color</Text>
        <View style={styles.variantOptions}>
          {product.colors.map((color) => {
            const stock = getVariantStock(product, selectedSize, color);
            const isAvailable = stock > 0;
            const isSelected = selectedColor === color;
            
            console.log(`🎨 Color ${color}: Stock ${stock}, Disponible: ${isAvailable}`);
            
            // Solo mostrar si está disponible
            if (!isAvailable) return null;
            
            return (
              <TouchableOpacity
                key={color}
                style={[
                  styles.variantOption,
                  isSelected && styles.variantOptionSelected,
                  !isAvailable && styles.variantOptionDisabled,
                ]}
                onPress={() => isAvailable && setSelectedColor(color)}
                disabled={!isAvailable}
              >
                <Text style={[
                  styles.variantOptionText,
                  isSelected && styles.variantOptionTextSelected,
                  !isAvailable && styles.variantOptionTextDisabled,
                ]}>
                  {color}
                </Text>
                {!isAvailable && (
                  <View style={styles.outOfStockOverlay}>
                    <Text style={styles.outOfStockText}>AGOTADO</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Renderizar selector de cantidad
  const renderQuantitySelector = () => {
    const maxStock = getTotalStock();
    
    return (
      <View style={styles.quantitySection}>
        <Text style={styles.variantTitle}>Cantidad</Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Ionicons name="remove" size={20} color={quantity <= 1 ? "#9CA3AF" : "#374151"} />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{quantity}</Text>
          
          <TouchableOpacity
            style={[styles.quantityButton, quantity >= maxStock && styles.quantityButtonDisabled]}
            onPress={() => setQuantity(Math.min(maxStock, quantity + 1))}
            disabled={quantity >= maxStock}
          >
            <Ionicons name="add" size={20} color={quantity >= maxStock ? "#9CA3AF" : "#374151"} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.stockInfo}>
          {maxStock > 0 ? `${maxStock} disponibles` : 'Sin stock'}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle del Producto</Text>
          <TouchableOpacity style={styles.cartButton}>
            <Ionicons name="bag-outline" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando producto...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Producto No Encontrado</Text>
          <View style={styles.cartButton} />
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Producto No Encontrado</Text>
          <Text style={styles.errorSubtitle}>
            El producto que buscas no está disponible o ha sido eliminado.
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Volver a la Tienda</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalStock = getTotalStock();
  const canAddToCart = totalStock > 0 && 
                      (!product.sizes.length || selectedSize) && 
                      (!product.colors.length || selectedColor);

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
          <Text style={styles.productName}>{product.name}</Text>
          
          <View style={styles.productPricing}>
            <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
            {product.originalPrice && product.originalPrice > product.price && (
              <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
            )}
          </View>

          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.productDescription}>{product.description}</Text>
            </View>
          )}

          {/* Selector de tallas */}
          {renderSizeSelector()}

          {/* Selector de colores */}
          {renderColorSelector()}

          {/* Selector de cantidad */}
          {renderQuantitySelector()}
        </View>
      </ScrollView>

      {/* Footer con precio y botón */}
      <View style={styles.footer}>
        <View style={styles.footerPricing}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerPrice}>
            {formatPrice(product.price * quantity)}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            !canAddToCart && styles.addToCartButtonDisabled
          ]}
          onPress={addToCart}
          disabled={!canAddToCart || addingToCart}
        >
          {addingToCart ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons 
                name="bag-add" 
                size={20} 
                color={canAddToCart ? "#fff" : "#9CA3AF"} 
              />
              <Text style={[
                styles.addToCartButtonText,
                !canAddToCart && styles.addToCartButtonTextDisabled
              ]}>
                {totalStock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
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
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Content
  content: {
    flex: 1,
  },
  
  // Image Gallery
  imageGalleryContainer: {
    position: 'relative',
  },
  productImage: {
    width: width,
    height: width,
    backgroundColor: '#F3F4F6',
  },
  placeholderImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 16,
    color: '#9CA3AF',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  imageIndicatorActive: {
    backgroundColor: '#fff',
  },
  
  // Product Info
  productInfo: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  productPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  originalPrice: {
    fontSize: 20,
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  
  // Description
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  
  // Variant Selectors
  variantSection: {
    marginBottom: 24,
  },
  variantTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  variantOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  variantOption: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    minWidth: 60,
    alignItems: 'center',
  },
  variantOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  variantOptionDisabled: {
    borderColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
  },
  variantOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  variantOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  variantOptionTextDisabled: {
    color: '#9CA3AF',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  outOfStockText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Quantity Selector
  quantitySection: {
    marginBottom: 24,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    minWidth: 40,
    textAlign: 'center',
  },
  stockInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Footer
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footerPricing: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  footerPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    minWidth: 180,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  addToCartButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  addToCartButtonTextDisabled: {
    color: '#9CA3AF',
  },
  
  // Loading & Error States
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductDetailScreen;
