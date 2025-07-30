// AdminProductsScreen.js - Pantalla de productos admin sin i18n
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
  Image,
  ActivityIndicator,
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
import { Ionicons } from '@expo/vector-icons';
import AdminProductManagementScreen from '../ShopAdmin/AdminProductManagementScreen';
import {
  AdminCard,
  AdminButton,
  AdminHeader,
} from './AdminComponents';

const AdminProductsScreen = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Categorías disponibles
  const categories = [
    { id: 'gi', name: 'Gi' },
    { id: 'nogi', name: 'No-Gi' },
    { id: 'accessories', name: 'Accesorios' },
    { id: 'equipment', name: 'Equipamiento' },
    { id: 'supplements', name: 'Suplementos' },
  ];

  // Cargar productos desde Firebase
  useEffect(() => {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = [];
      snapshot.forEach((doc) => {
        productsData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading products:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Función de refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Cambiar estado del producto
  const toggleProductStatus = async (product) => {
    try {
      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, {
        active: !product.active,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating product status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado del producto');
    }
  };

  // Eliminar producto
  const deleteProduct = (product) => {
    Alert.alert(
      'Eliminar Producto',
      `¿Estás seguro de que quieres eliminar "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'products', product.id));
              Alert.alert('Éxito', 'Producto eliminado correctamente');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          }
        }
      ]
    );
  };

  // Navegar a gestión completa de productos
  const navigateToProductManagement = () => {
    navigation.navigate('AdminProductManagementScreen');
  };

  // Formatear precio
  const formatPrice = (price) => `$${price.toFixed(2)}`;

  // Calcular stock total
  const getTotalStock = (stock) => {
    if (!stock || typeof stock !== 'object') return 0;
    return Object.values(stock).reduce((sum, qty) => sum + (qty || 0), 0);
  };

  // Renderizar producto
  const renderProduct = ({ item }) => (
    <AdminCard style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.productImageContainer}>
          {item.images && item.images.length > 0 ? (
            <Image source={{ uri: item.images[0] }} style={styles.productImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={32} color="#D1D5DB" />
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productCategory}>
            {categories.find(cat => cat.id === item.category)?.name || item.category}
          </Text>
          <Text style={styles.productPrice}>
            {formatPrice(item.price)}
            {item.originalPrice && item.originalPrice > item.price && (
              <Text style={styles.originalPrice}> {formatPrice(item.originalPrice)}</Text>
            )}
          </Text>
          
          <View style={styles.productMeta}>
            <Text style={styles.stockInfo}>
              Stock: {getTotalStock(item.stock)}
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.active ? '#10B981' : '#EF4444' }
            ]}>
              <Text style={styles.statusText}>
                {item.active ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.statusButton]}
          onPress={() => toggleProductStatus(item)}
        >
          <Ionicons 
            name={item.active ? "pause-outline" : "play-outline"} 
            size={16} 
            color={item.active ? "#F59E0B" : "#10B981"} 
          />
          <Text style={[
            styles.actionButtonText,
            { color: item.active ? "#F59E0B" : "#10B981" }
          ]}>
            {item.active ? 'Desactivar' : 'Activar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteProduct(item)}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
            Eliminar
          </Text>
        </TouchableOpacity>
      </View>
    </AdminCard>
  );

  // Renderizar estado vacío
  const renderEmptyState = () => (
    <AdminCard style={styles.emptyCard}>
      <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Sin productos</Text>
      <Text style={styles.emptySubtitle}>
        Comienza agregando tu primer producto
      </Text>
      <AdminButton
        title="Gestionar Productos"
        onPress={navigateToProductManagement}
        style={styles.emptyButton}
      />
    </AdminCard>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando productos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader
        title="Productos"
        subtitle={`${products.length} productos registrados`}
        rightComponent={
          <TouchableOpacity 
            style={styles.manageButton} 
            onPress={navigateToProductManagement}
          >
            <Ionicons name="settings-outline" size={20} color="#3B82F6" />
            <Text style={styles.manageButtonText}>Gestionar</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={products.slice(0, 10)} // Mostrar solo los primeros 10
        renderItem={renderProduct}
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
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={
          products.length > 10 && (
            <AdminButton
              title={`Ver todos los productos (${products.length})`}
              onPress={navigateToProductManagement}
              variant="secondary"
              style={styles.viewAllButton}
            />
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    padding: 16,
    paddingBottom: 32,
  },
  
  // Header Actions
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  
  // Product Card
  productCard: {
    marginBottom: 16,
  },
  productHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  productImageContainer: {
    marginRight: 16,
  },
  productImage: {
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
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'line-through',
    fontWeight: '400',
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockInfo: {
    fontSize: 12,
    color: '#6B7280',
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
  
  // Actions
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    gap: 4,
    flex: 1,
  },
  statusButton: {
    backgroundColor: '#FEF3C7',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  
  // Empty State
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 32,
  },
  
  // View All Button
  viewAllButton: {
    marginTop: 16,
  },
});

export default AdminProductsScreen;
