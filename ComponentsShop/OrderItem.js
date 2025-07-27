// OrderItem.js - Componente de item de pedido individual
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const OrderItem = ({ 
  item, 
  onPress,
  style,
  showStatus = true,
  showActions = false,
  onTrack,
  onReorder,
  onReview
}) => {
  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'pendiente':
        return '#F59E0B';
      case 'processing':
      case 'procesando':
        return '#3B82F6';
      case 'shipped':
      case 'enviado':
        return '#8B5CF6';
      case 'delivered':
      case 'entregado':
        return '#10B981';
      case 'cancelled':
      case 'cancelado':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Pendiente';
      case 'processing':
        return 'Procesando';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status || 'Desconocido';
    }
  };

  const imageUrl = item.productImage || (item.images && item.images[0]);

  return (
    <TouchableOpacity 
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Imagen del producto */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={24} color="#D1D5DB" />
          </View>
        )}
      </View>

      {/* Información del producto */}
      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.productName || item.name}
          </Text>
          
          {showStatus && item.status && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          )}
        </View>

        {/* Detalles del pedido */}
        <View style={styles.details}>
          {item.orderNumber && (
            <Text style={styles.orderNumber}>Pedido #{item.orderNumber}</Text>
          )}
          
          {item.orderDate && (
            <Text style={styles.orderDate}>
              Pedido el {formatDate(item.orderDate)}
            </Text>
          )}
        </View>

        {/* Variantes del producto */}
        {(item.size || item.color) && (
          <View style={styles.variants}>
            {item.size && (
              <Text style={styles.variant}>Talla: {item.size}</Text>
            )}
            {item.color && (
              <Text style={styles.variant}>Color: {item.color}</Text>
            )}
          </View>
        )}

        {/* Cantidad y precio */}
        <View style={styles.priceInfo}>
          <Text style={styles.quantity}>Cantidad: {item.quantity}</Text>
          <Text style={styles.price}>
            {formatPrice((item.unitPrice || item.price) * item.quantity)}
          </Text>
        </View>

        {/* Información de entrega */}
        {item.deliveryDate && (
          <View style={styles.deliveryInfo}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.deliveryText}>
              Entrega estimada: {formatDate(item.deliveryDate)}
            </Text>
          </View>
        )}

        {/* Acciones */}
        {showActions && (
          <View style={styles.actions}>
            {onTrack && item.status !== 'delivered' && item.status !== 'cancelled' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onTrack(item)}
              >
                <Ionicons name="location-outline" size={16} color="#3B82F6" />
                <Text style={styles.actionButtonText}>Rastrear</Text>
              </TouchableOpacity>
            )}

            {onReorder && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onReorder(item)}
              >
                <Ionicons name="refresh-outline" size={16} color="#6B7280" />
                <Text style={styles.actionButtonText}>Reordenar</Text>
              </TouchableOpacity>
            )}

            {onReview && item.status === 'delivered' && !item.reviewed && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onReview(item)}
              >
                <Ionicons name="star-outline" size={16} color="#F59E0B" />
                <Text style={styles.actionButtonText}>Reseñar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Indicador de más información */}
      {onPress && (
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
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
  },
  imageContainer: {
    marginRight: 16,
  },
  image: {
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
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  details: {
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  variants: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 12,
  },
  variant: {
    fontSize: 12,
    color: '#6B7280',
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantity: {
    fontSize: 14,
    color: '#6B7280',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  deliveryText: {
    fontSize: 12,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  chevron: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

export default OrderItem;
