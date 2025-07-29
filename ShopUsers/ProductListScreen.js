// ProductListScreen.js - Pantalla de lista de productos para administradores
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
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ProductListScreen = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Categorías disponibles
  const categories = [
    { id: 'all', name: 'Todos' },
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

  // Filtrar productos
  useEffect(() => {
    let filtered = products;

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchQuery]);

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

  // Navegar a editar producto
  const editProduct = (product) => {
    navigation.navigate('ProductForm', { product });
  };

  // Navegar a crear producto
  const createProduct = () => {
    navigation.navigate('ProductForm');
  };

  // Formatear precio
  const formatPrice = (price) => `$${price.toFixed(2)}`;

  // Calcular stock total
  const getTotalStock = (stock) => {
    if (!stock || typeof stock !== 'object') return 0;
    return Object.values(stock).reduce((sum, qty) => sum + (qty || 0), 0);
  };

  // Renderizar filtros
  const renderFilters = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <SafeAreaView style={styles.filtersModal}>
        <View style={styles.filtersHeader}>
          <Text style={styles.filtersTitle}>Filtros</Text>
          <TouchableOpacity
            style={styles.closeFiltersButton}
            onPress={() => setShowFilters(false)}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.filtersContent}>
          <Text style={styles.filterSectionTitle}>Categorías</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipSelected
                ]}
                onPress={() => {
                  setSelectedCategory(category.id);
                  setShowFilters(false);
                }}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category.id && styles.categoryChipTextSelected
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );

  // Renderizar producto
  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.productImageContainer}>
          {item.images && item.images.length > 0 ? (
            <Image source={{ uri: item.images[0] }} style={styles.productImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={32} color="#D1D5DB" />
            </View>
          )}
          
          {/* Badge de estado */}
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.active ? '#10B981' : '#EF4444' }
          ]}>
            <Text style={styles.statusText}>
              {item.active ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productCategory}>
            {categories.find(cat => cat.id === item.category)?.name || item.category}
          </Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>
              {formatPrice(item.price)}
            </Text>
            {item.originalPrice && item.originalPrice > item.price && (
              <Text style={styles.originalPrice}>
                {formatPrice(item.originalPrice)}
              </Text>
            )}
          </View>

          <View style={styles.productMeta}>
            <Text style={styles.stockInfo}>
              Stock: {getTotalStock(item.stock)}
            </Text>
            {item.featured && (
              <View style={styles.featuredBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.featuredText}>Destacado</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.productActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => editProduct(item)}
        >
          <Ionicons name="create-outline" size={16} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>

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
    </View>
  );

  // Renderizar estado vacío
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>
        {searchQuery || selectedCategory !== 'all' 
          ? 'Sin resultados' 
          : 'Sin productos'
        }
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedCategory !== 'all'
          ? 'Intenta cambiar los filtros de búsqueda'
          : 'Comienza agregando tu primer producto'
        }
      </Text>
      {(!searchQuery && selectedCategory === 'all') && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={createProduct}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Crear Producto</Text>
        </TouchableOpacity>
      )}
    </View>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Productos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={createProduct}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {selectedCategory !== 'all' && (
        <View style={styles.activeFilters}>
          <View style={styles.activeFilterChip}>
            <Text style={styles.activeFilterText}>
              {categories.find(cat => cat.id === selectedCategory)?.name}
            </Text>
            <TouchableOpacity onPress={() => setSelectedCategory('all')}>
              <Ionicons name="close" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
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
      />

      {renderFilters()}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
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
  
  // Search
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Active Filters
  activeFilters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  
  // Results
  resultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // List
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  
  // Product Card
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  productImageContainer: {
    position: 'relative',
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
  statusBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
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
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  originalPrice: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'line-through',
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
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
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
  
  // Filters Modal
  filtersModal: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeFiltersButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContent: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
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
    marginBottom: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductListScreen;
