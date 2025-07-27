// ProductCard.js - Componente de tarjeta de producto individual
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ProductCard = ({ 
  product, 
  onPress, 
  style,
  showAddToCart = false,
  onAddToCart,
  size = 'normal' // 'normal', 'small', 'large'
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

  // Calcular dimensiones según el tamaño
  const getCardWidth = () => {
    switch (size) {
      case 'small':
        return (width - 60) / 3;
      case 'large':
        return width - 32;
      default:
        return (width - 48) / 2;
    }
  };

  const getImageHeight = () => {
    switch (size) {
      case 'small':
        return 80;
      case 'large':
        return 200;
      default:
        return 120;
    }
  };

  const cardWidth = getCardWidth();
  const imageHeight = getImageHeight();

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { width: cardWidth },
        size === 'large' && styles.largeContainer,
        style
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Imagen del producto */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={[styles.image, { height: imageHeight }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholderImage, { height: imageHeight }]}>
            <Ionicons name="image-outline" size={size === 'small' ? 24 : 40} color="#D1D5DB" />
          </View>
        )}
        
        {/* Badge de stock */}
        <View style={[styles.stockBadge, { backgroundColor: stockStatus.color }]}>
          <Text style={styles.stockBadgeText}>{stockStatus.text}</Text>
        </View>

        {/* Badge de descuento (si aplica) */}
        {product.discount && product.discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{product.discount}%</Text>
          </View>
        )}
      </View>

      {/* Información del producto */}
      <View style={styles.info}>
        <Text 
          style={[
            styles.name,
            size === 'small' && styles.nameSmall,
            size === 'large' && styles.nameLarge
          ]} 
          numberOfLines={size === 'large' ? 3 : 2}
        >
          {product.name}
        </Text>
        
        <Text style={[
          styles.category,
          size === 'small' && styles.categorySmall
        ]}>
          {product.category?.toUpperCase() || 'PRODUCTO'}
        </Text>

        {/* Rating (si está disponible) */}
        {product.rating && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
            {product.reviewCount && (
              <Text style={styles.reviewCount}>({product.reviewCount})</Text>
            )}
          </View>
        )}

        {/* Precio */}
        <View style={styles.priceContainer}>
          {product.originalPrice && product.originalPrice > product.price && (
            <Text style={styles.originalPrice}>
              {formatPrice(product.originalPrice)}
            </Text>
          )}
          <Text style={[
            styles.price,
            size === 'small' && styles.priceSmall,
            size === 'large' && styles.priceLarge
          ]}>
            {formatPrice(product.price)}
          </Text>
        </View>

        {/* Variantes disponibles (colores) */}
        {product.colors && product.colors.length > 1 && size !== 'small' && (
          <View style={styles.colorsContainer}>
            {product.colors.slice(0, 4).map((color, index) => (
              <View 
                key={index}
                style={[
                  styles.colorDot,
                  { backgroundColor: color.toLowerCase() === 'white' ? '#F3F4F6' : color }
                ]}
              />
            ))}
            {product.colors.length > 4 && (
              <Text style={styles.moreColors}>+{product.colors.length - 4}</Text>
            )}
          </View>
        )}
      </View>

      {/* Botón agregar al carrito */}
      {showAddToCart && stockStatus.text !== 'Agotado' && (
        <TouchableOpacity 
          style={[
            styles.addToCartButton,
            size === 'small' && styles.addToCartButtonSmall,
            size === 'large' && styles.addToCartButtonLarge
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onAddToCart && onAddToCart(product);
          }}
        >
          <Ionicons 
            name="add" 
            size={size === 'small' ? 16 : 20} 
            color="#fff" 
          />
        </TouchableOpacity>
      )}

      {/* Botón de favorito */}
      {product.isFavorite !== undefined && (
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation();
            // Implementar lógica de favoritos
          }}
        >
          <Ionicons 
            name={product.isFavorite ? "heart" : "heart-outline"} 
            size={16} 
            color={product.isFavorite ? "#EF4444" : "#6B7280"} 
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  largeContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    borderRadius: 8,
  },
  placeholderImage: {
    width: '100%',
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
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  nameSmall: {
    fontSize: 12,
  },
  nameLarge: {
    fontSize: 16,
  },
  category: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  categorySmall: {
    fontSize: 9,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
  },
  reviewCount: {
    fontSize: 10,
    color: '#6B7280',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  priceSmall: {
    fontSize: 14,
  },
  priceLarge: {
    fontSize: 18,
  },
  originalPrice: {
    fontSize: 12,
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  colorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  moreColors: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addToCartButtonSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  addToCartButtonLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProductCard;

