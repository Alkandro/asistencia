// AdminProductsScreen.js - Panel de administración de productos
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
  Image,
  Switch,
} from 'react-native';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  AdminCard,
  AdminButton,
  AdminHeader,
  AdminLoadingOverlay,
} from '../AdminScreen/AdminComponents';

const AdminProductsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    // Suscripción a todos los productos (activos e inactivos)
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const productsList = [];
        snapshot.forEach((docSnap) => {
          productsList.push({ id: docSnap.id, ...docSnap.data() });
        });
        setProducts(productsList);
        setLoading(false);
      },
      (error) => {
        console.error('Error al obtener productos:', error);
        Alert.alert('Error', 'No se pudieron cargar los productos');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  const getTotalStock = (stock) => {
    return Object.values(stock || {}).reduce((sum, qty) => sum + qty, 0);
  };

  const getStockStatus = (stock) => {
    const totalStock = getTotalStock(stock);
    if (totalStock === 0) return { text: 'Agotado', color: '#EF4444' };
    if (totalStock < 10) return { text: 'Bajo stock', color: '#F59E0B' };
    return { text: 'En stock', color: '#10B981' };
  };

  const handleToggleActive = async (product) => {
    try {
      setUpdating(prev => ({ ...prev, [product.id]: true }));
      
      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, {
        isActive: !product.isActive,
        updatedAt: new Date(),
      });

      Alert.alert(
        'Éxito',
        `Producto ${!product.isActive ? 'activado' : 'desactivado'} correctamente`
      );
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      Alert.alert('Error', 'No se pudo actualizar el producto');
    } finally {
      setUpdating(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const handleEditProduct = (product) => {
    navigation.navigate('ProductForm', { product, mode: 'edit' });
  };

  const handleDeleteProduct = (product) => {
    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de que quieres eliminar "${product.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdating(prev => ({ ...prev, [product.id]: true }));
              
              const productRef = doc(db, 'products', product.id);
              await deleteDoc(productRef);
              
              Alert.alert('Éxito', 'Producto eliminado correctamente');
            } catch (error) {
              console.error('Error al eliminar producto:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            } finally {
              setUpdating(prev => ({ ...prev, [product.id]: false }));
            }
          },
        },
      ]
    );
  };

  const handleCreateProduct = () => {
    navigation.navigate('ProductForm', { mode: 'create' });
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderProductCard = ({ item: product }) => {
    const stockStatus = getStockStatus(product.stock);
    const totalStock = getTotalStock(product.stock);
    const isUpdating = updating[product.id];

    return (
      <AdminCard style={styles.productCard}>
        {/* Header del producto */}
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {product.name}
            </Text>
            <Text style={styles.productCategory}>
              {product.category?.toUpperCase() || 'SIN CATEGORÍA'}
            </Text>
          </View>
          
          <View style={styles.productActions}>
            <Switch
              value={product.isActive}
              onValueChange={() => handleToggleActive(product)}
              disabled={isUpdating}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor={product.isActive ? '#fff' : '#fff'}
            />
          </View>
        </View>

        {/* Contenido del producto */}
        <View style={styles.productContent}>
          {/* Imagen */}
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

          {/* Detalles */}
          <View style={styles.productDetails}>
            <View style={styles.priceRow}>
              <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
              <View style={[styles.stockBadge, { backgroundColor: stockStatus.color }]}>
                <Text style={styles.stockBadgeText}>{stockStatus.text}</Text>
              </View>
            </View>

            <Text style={styles.stockInfo}>
              Stock total: {totalStock} unidades
            </Text>

            {product.description && (
              <Text style={styles.productDescription} numberOfLines={2}>
                {product.description}
              </Text>
            )}

            {/* Variantes */}
            {(product.sizes || product.colors) && (
              <View style={styles.variantsInfo}>
                {product.sizes && (
                  <Text style={styles.variantText}>
                    Tallas: {product.sizes.join(', ')}
                  </Text>
                )}
                {product.colors && (
                  <Text style={styles.variantText}>
                    Colores: {product.colors.join(', ')}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.productButtons}>
          <AdminButton
            title="Editar"
            icon="create-outline"
            variant="secondary"
            style={styles.actionButton}
            onPress={() => handleEditProduct(product)}
            disabled={isUpdating}
          />
          <AdminButton
            title="Stock"
            icon="cube-outline"
            variant="secondary"
            style={styles.actionButton}
            onPress={() => navigation.navigate('ProductStock', { product })}
            disabled={isUpdating}
          />
          <AdminButton
            title="Eliminar"
            icon="trash-outline"
            variant="danger"
            style={styles.actionButton}
            onPress={() => handleDeleteProduct(product)}
            disabled={isUpdating}
          />
        </View>

        {isUpdating && (
          <View style={styles.updatingOverlay}>
            <Text style={styles.updatingText}>Actualizando...</Text>
          </View>
        )}
      </AdminCard>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{products.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {products.filter(p => p.isActive).length}
          </Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {products.filter(p => getTotalStock(p.stock) === 0).length}
          </Text>
          <Text style={styles.statLabel}>Agotados</Text>
        </View>
      </View>

      <AdminButton
        title="Crear Producto"
        icon="add-outline"
        onPress={handleCreateProduct}
        style={styles.createButton}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="storefront-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No hay productos</Text>
      <Text style={styles.emptyStateSubtitle}>
        Crea tu primer producto para comenzar a vender
      </Text>
      <AdminButton
        title="Crear Producto"
        icon="add-outline"
        onPress={handleCreateProduct}
        style={styles.emptyStateButton}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader
        title="Gestión de Productos"
        subtitle={`${products.length} producto${products.length !== 1 ? 's' : ''} registrado${products.length !== 1 ? 's' : ''}`}
        rightComponent={
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#6B7280" />
          </TouchableOpacity>
        }
      />

      {products.length === 0 && !loading ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productsList}
          ListHeaderComponent={products.length > 0 ? renderHeader : null}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <AdminLoadingOverlay visible={loading} text="Cargando productos..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  refreshButton: {
    padding: 8,
  },
  productsList: {
    padding: 16,
  },

  // Header section
  headerSection: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  createButton: {
    marginHorizontal: 0,
  },

  // Product card
  productCard: {
    marginBottom: 16,
    position: 'relative',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 24,
  },
  productCategory: {
    fontSize: 12,
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  productActions: {
    alignItems: 'flex-end',
  },

  // Product content
  productContent: {
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
  productDetails: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
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
  stockInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  variantsInfo: {
    gap: 4,
  },
  variantText: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Product buttons
  productButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },

  // Updating overlay
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
  updatingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyStateButton: {
    paddingHorizontal: 32,
  },
});

export default AdminProductsScreen;
