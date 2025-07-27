// ProductStockScreen.js - Gestión detallada de stock de productos
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
  Image,
} from 'react-native';
import {
  doc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  AdminCard,
  AdminButton,
  AdminHeader,
  AdminDivider,
  AdminLoadingOverlay,
} from '../AdminScreen/AdminComponents';

const ProductStockScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { product: initialProduct } = route.params;

  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(false);
  const [stockChanges, setStockChanges] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Suscripción en tiempo real al producto
    const productRef = doc(db, 'products', initialProduct.id);
    const unsubscribe = onSnapshot(
      productRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        }
      },
      (error) => {
        console.error('Error al obtener producto:', error);
      }
    );

    return () => unsubscribe();
  }, [initialProduct.id]);

  const getTotalStock = () => {
    const currentStock = { ...product.stock, ...stockChanges };
    return Object.values(currentStock).reduce((sum, qty) => sum + (parseInt(qty) || 0), 0);
  };

  const getVariantStock = (variantKey) => {
    if (stockChanges.hasOwnProperty(variantKey)) {
      return stockChanges[variantKey];
    }
    return product.stock?.[variantKey] || 0;
  };

  const handleStockChange = (variantKey, value) => {
    const numValue = parseInt(value) || 0;
    setStockChanges(prev => ({
      ...prev,
      [variantKey]: numValue,
    }));
    setHasChanges(true);
  };

  const handleQuickAdjustment = (variantKey, adjustment) => {
    const currentValue = getVariantStock(variantKey);
    const newValue = Math.max(0, (parseInt(currentValue) || 0) + adjustment);
    handleStockChange(variantKey, newValue);
  };

  const handleSaveChanges = async () => {
    if (!hasChanges) {
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);

      const newStock = { ...product.stock, ...stockChanges };
      const productRef = doc(db, 'products', product.id);
      
      await updateDoc(productRef, {
        stock: newStock,
        updatedAt: new Date(),
      });

      Alert.alert('Éxito', 'Stock actualizado correctamente');
      navigation.goBack();
    } catch (error) {
      console.error('Error al actualizar stock:', error);
      Alert.alert('Error', 'No se pudo actualizar el stock');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscardChanges = () => {
    if (hasChanges) {
      Alert.alert(
        'Descartar cambios',
        '¿Estás seguro de que quieres descartar los cambios?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => {
              setStockChanges({});
              setHasChanges(false);
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const renderProductInfo = () => (
    <AdminCard style={styles.section}>
      <View style={styles.productHeader}>
        <View style={styles.productImageContainer}>
          {product.images && product.images.length > 0 ? (
            <Image
              source={{ uri: product.images[0] }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={32} color="#D1D5DB" />
            </View>
          )}
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productCategory}>
            {product.category?.toUpperCase() || 'PRODUCTO'}
          </Text>
          <Text style={styles.productPrice}>
            ${product.price?.toFixed(2) || '0.00'}
          </Text>
        </View>
      </View>

      <AdminDivider />

      <View style={styles.stockSummary}>
        <View style={styles.stockSummaryItem}>
          <Text style={styles.stockSummaryLabel}>Stock Total Actual</Text>
          <Text style={styles.stockSummaryValue}>
            {Object.values(product.stock || {}).reduce((sum, qty) => sum + qty, 0)} unidades
          </Text>
        </View>
        
        <View style={styles.stockSummaryItem}>
          <Text style={styles.stockSummaryLabel}>Stock Total Nuevo</Text>
          <Text style={[
            styles.stockSummaryValue,
            hasChanges && styles.stockSummaryValueChanged
          ]}>
            {getTotalStock()} unidades
          </Text>
        </View>
      </View>
    </AdminCard>
  );

  const renderStockVariants = () => {
    const stockEntries = Object.keys(product.stock || {});
    
    if (stockEntries.length === 0) {
      return (
        <AdminCard style={styles.section}>
          <View style={styles.emptyStock}>
            <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStockTitle}>Sin variantes de stock</Text>
            <Text style={styles.emptyStockSubtitle}>
              Este producto no tiene variantes configuradas
            </Text>
          </View>
        </AdminCard>
      );
    }

    return (
      <AdminCard style={styles.section}>
        <Text style={styles.sectionTitle}>Stock por Variante</Text>
        
        {stockEntries.map((variantKey, index) => {
          const currentStock = getVariantStock(variantKey);
          const originalStock = product.stock[variantKey] || 0;
          const hasChanged = stockChanges.hasOwnProperty(variantKey);
          
          return (
            <View key={variantKey}>
              {index > 0 && <AdminDivider />}
              
              <View style={styles.variantRow}>
                <View style={styles.variantInfo}>
                  <Text style={styles.variantName}>
                    {variantKey === 'default' ? 'Stock General' : variantKey}
                  </Text>
                  <Text style={styles.variantOriginal}>
                    Original: {originalStock} unidades
                  </Text>
                </View>

                <View style={styles.variantControls}>
                  {/* Botones de ajuste rápido */}
                  <View style={styles.quickAdjustments}>
                    <TouchableOpacity
                      style={styles.adjustButton}
                      onPress={() => handleQuickAdjustment(variantKey, -10)}
                    >
                      <Text style={styles.adjustButtonText}>-10</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.adjustButton}
                      onPress={() => handleQuickAdjustment(variantKey, -1)}
                    >
                      <Text style={styles.adjustButtonText}>-1</Text>
                    </TouchableOpacity>
                    
                    <TextInput
                      style={[
                        styles.stockInput,
                        hasChanged && styles.stockInputChanged
                      ]}
                      value={currentStock.toString()}
                      onChangeText={(value) => handleStockChange(variantKey, value)}
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                    
                    <TouchableOpacity
                      style={styles.adjustButton}
                      onPress={() => handleQuickAdjustment(variantKey, 1)}
                    >
                      <Text style={styles.adjustButtonText}>+1</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.adjustButton}
                      onPress={() => handleQuickAdjustment(variantKey, 10)}
                    >
                      <Text style={styles.adjustButtonText}>+10</Text>
                    </TouchableOpacity>
                  </View>

                  {hasChanged && (
                    <View style={styles.changeIndicator}>
                      <Ionicons 
                        name={currentStock > originalStock ? "trending-up" : "trending-down"} 
                        size={16} 
                        color={currentStock > originalStock ? "#10B981" : "#EF4444"} 
                      />
                      <Text style={[
                        styles.changeText,
                        { color: currentStock > originalStock ? "#10B981" : "#EF4444" }
                      ]}>
                        {currentStock > originalStock ? '+' : ''}{currentStock - originalStock}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </AdminCard>
    );
  };

  const renderStockActions = () => (
    <AdminCard style={styles.section}>
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      
      <View style={styles.actionButtons}>
        <AdminButton
          title="Reabastecer Todo"
          icon="add-circle-outline"
          variant="success"
          style={styles.actionButton}
          onPress={() => {
            Alert.prompt(
              'Reabastecer Stock',
              'Ingresa la cantidad a agregar a todas las variantes:',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Agregar',
                  onPress: (value) => {
                    const addAmount = parseInt(value) || 0;
                    if (addAmount > 0) {
                      const newChanges = {};
                      Object.keys(product.stock || {}).forEach(variantKey => {
                        const currentStock = getVariantStock(variantKey);
                        newChanges[variantKey] = (parseInt(currentStock) || 0) + addAmount;
                      });
                      setStockChanges(prev => ({ ...prev, ...newChanges }));
                      setHasChanges(true);
                    }
                  },
                },
              ],
              'plain-text',
              '',
              'numeric'
            );
          }}
        />
        
        <AdminButton
          title="Agotar Todo"
          icon="remove-circle-outline"
          variant="danger"
          style={styles.actionButton}
          onPress={() => {
            Alert.alert(
              'Agotar Stock',
              '¿Estás seguro de que quieres poner en 0 el stock de todas las variantes?',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Agotar',
                  style: 'destructive',
                  onPress: () => {
                    const newChanges = {};
                    Object.keys(product.stock || {}).forEach(variantKey => {
                      newChanges[variantKey] = 0;
                    });
                    setStockChanges(prev => ({ ...prev, ...newChanges }));
                    setHasChanges(true);
                  },
                },
              ]
            );
          }}
        />
      </View>
    </AdminCard>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader
        title="Gestión de Stock"
        subtitle={product.name}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderProductInfo()}
        {renderStockVariants()}
        {renderStockActions()}
      </ScrollView>

      <View style={styles.bottomSection}>
        <AdminButton
          title="Cancelar"
          variant="secondary"
          onPress={handleDiscardChanges}
          style={styles.cancelButton}
        />
        <AdminButton
          title={hasChanges ? "Guardar Cambios" : "Cerrar"}
          onPress={handleSaveChanges}
          loading={loading}
          style={styles.saveButton}
        />
      </View>

      <AdminLoadingOverlay visible={loading} text="Actualizando stock..." />
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

  // Product info
  productHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 16,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  // Stock summary
  stockSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stockSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  stockSummaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  stockSummaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  stockSummaryValueChanged: {
    color: '#3B82F6',
  },

  // Variant rows
  variantRow: {
    paddingVertical: 16,
  },
  variantInfo: {
    marginBottom: 12,
  },
  variantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  variantOriginal: {
    fontSize: 14,
    color: '#6B7280',
  },
  variantControls: {
    alignItems: 'center',
  },
  quickAdjustments: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adjustButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  adjustButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  stockInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#fff',
    color: '#111827',
  },
  stockInputChanged: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },

  // Empty state
  emptyStock: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStockTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStockSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
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
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});

export default ProductStockScreen;
