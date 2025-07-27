// CartItem.js - Componente de item del carrito individual
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CartItem = ({ 
  item, 
  onUpdateQuantity, 
  onRemove,
  style,
  readOnly = false,
  showVariants = true,
  showRemove = true
}) => {
  const [updating, setUpdating] = useState(false);

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  const handleQuantityChange = async (newQuantity) => {
    if (readOnly || updating) return;
    
    if (newQuantity <= 0) {
      handleRemove();
      return;
    }

    setUpdating(true);
    try {
      await onUpdateQuantity(item, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'No se pudo actualizar la cantidad');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = () => {
    if (readOnly || updating) return;

    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de que quieres eliminar ${item.productName || item.name} del carrito?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive', 
          onPress: () => onRemove && onRemove(item) 
        }
      ]
    );
  };

  const imageUrl = item.productImage || (item.images && item.images[0]);
  const unitPrice = item.unitPrice || item.price || 0;
  const quantity = item.quantity || 1;
  const totalPrice = unitPrice * quantity;

  return (
    <View style={[styles.container, style]}>
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
          
          {showRemove && !readOnly && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemove}
              disabled={updating}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Variantes del producto */}
        {showVariants && (item.size || item.color) && (
          <View style={styles.variants}>
            {item.size && (
              <View style={styles.variantChip}>
                <Text style={styles.variantText}>Talla: {item.size}</Text>
              </View>
            )}
            {item.color && (
              <View style={styles.variantChip}>
                <Text style={styles.variantText}>Color: {item.color}</Text>
              </View>
            )}
          </View>
        )}

        {/* Precio unitario */}
        <Text style={styles.unitPrice}>
          {formatPrice(unitPrice)} c/u
        </Text>

        {/* Controles de cantidad y precio total */}
        <View style={styles.footer}>
          {!readOnly ? (
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                onPress={() => handleQuantityChange(quantity - 1)}
                disabled={updating || quantity <= 1}
              >
                <Ionicons 
                  name="remove" 
                  size={16} 
                  color={quantity <= 1 ? "#D1D5DB" : "#6B7280"} 
                />
              </TouchableOpacity>
              
              <View style={styles.quantityContainer}>
                {updating ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Text style={styles.quantityText}>{quantity}</Text>
                )}
              </View>
              
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(quantity + 1)}
                disabled={updating}
              >
                <Ionicons name="add" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.quantityReadOnly}>
              Cantidad: {quantity}
            </Text>
          )}

          {/* Precio total */}
          <Text style={styles.totalPrice}>
            {formatPrice(totalPrice)}
          </Text>
        </View>

        {/* Información adicional */}
        {item.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            Nota: {item.notes}
          </Text>
        )}

        {/* Estado de disponibilidad */}
        {item.availability && (
          <View style={styles.availabilityContainer}>
            <Ionicons 
              name={item.availability === 'in_stock' ? "checkmark-circle" : "alert-circle"} 
              size={14} 
              color={item.availability === 'in_stock' ? "#10B981" : "#F59E0B"} 
            />
            <Text style={[
              styles.availabilityText,
              { color: item.availability === 'in_stock' ? "#10B981" : "#F59E0B" }
            ]}>
              {item.availability === 'in_stock' ? 'En stock' : 'Stock limitado'}
            </Text>
          </View>
        )}
      </View>

      {/* Overlay de carga */}
      {updating && (
        <View style={styles.updatingOverlay}>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      )}
    </View>
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
    position: 'relative',
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
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  variants: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  variantChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  variantText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  unitPrice: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  quantityButtonDisabled: {
    backgroundColor: '#F9FAFB',
    shadowOpacity: 0,
    elevation: 0,
  },
  quantityContainer: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  quantityReadOnly: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  notes: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '500',
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
});

export default CartItem;
