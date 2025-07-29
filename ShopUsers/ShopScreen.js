// ShopScreen.js - Pantalla principal de tienda completa
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  ProductCard,
  ShopHeader,
  CategoryFilter,
  ProductsLoading,
  EmptyState,
} from '../ComponentsShop/ShopComponents';

const ShopScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  
  // Estados de filtros
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  // Estados de categorías
  const [categories, setCategories] = useState([
    { id: 'gi', name: 'Gi' },
    { id: 'nogi', name: 'No-Gi' },
    { id: 'accessories', name: 'Accesorios' },
    { id: 'equipment', name: 'Equipamiento' },
    { id: 'supplements', name: 'Suplementos' },
  ]);

  // Cargar productos desde Firebase
  useEffect(() => {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('active', '==', true), orderBy('createdAt', 'desc'));

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

  // Cargar contador del carrito
  useEffect(() => {
    const loadCartCount = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const cartRef = doc(db, 'cart', userId);
        const cartSnap = await getDoc(cartRef);
        
        if (cartSnap.exists()) {
          const cartData = cartSnap.data();
          const totalItems = cartData.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          setCartItemCount(totalItems);
        }
      } catch (error) {
        console.error('Error loading cart count:', error);
      }
    };

    loadCartCount();
  }, []);

  // Filtrar productos
  useEffect(() => {
    let filtered = products;

    // Filtrar por categoría
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchQuery]);

  // Función para agregar al carrito
  const handleAddToCart = async (product) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'Debes iniciar sesión para agregar productos al carrito');
        return;
      }

      // Verificar stock disponible
      const totalStock = Object.values(product.stock || {}).reduce((sum, qty) => sum + qty, 0);
      if (totalStock === 0) {
        Alert.alert('Sin stock', 'Este producto no está disponible');
        return;
      }

      const cartRef = doc(db, 'cart', userId);
      const cartSnap = await getDoc(cartRef);

      const newItem = {
        productId: product.id,
        productName: product.name,
        productImage: product.images?.[0] || null,
        unitPrice: product.price,
        quantity: 1,
        size: Object.keys(product.stock || {})[0] || 'default', // Primera talla disponible
        color: product.colors?.[0] || 'default',
        addedAt: new Date(),
      };

      if (cartSnap.exists()) {
        const cartData = cartSnap.data();
        const existingItems = cartData.items || [];
        
        // Verificar si el producto ya existe con las mismas variantes
        const existingItemIndex = existingItems.findIndex(item => 
          item.productId === product.id && 
          item.size === newItem.size && 
          item.color === newItem.color
        );

        if (existingItemIndex >= 0) {
          // Actualizar cantidad del item existente
          existingItems[existingItemIndex].quantity += 1;
        } else {
          // Agregar nuevo item
          existingItems.push(newItem);
        }

        await updateDoc(cartRef, {
          items: existingItems,
          updatedAt: new Date(),
        });
      } else {
        // Crear nuevo carrito
        await setDoc(cartRef, {
          userId,
          items: [newItem],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Actualizar contador del carrito
      setCartItemCount(prev => prev + 1);

      Alert.alert(
        'Producto agregado',
        `${product.name} se agregó al carrito`,
        [
          { text: 'Continuar comprando', style: 'cancel' },
          { text: 'Ver carrito', onPress: () => navigation.navigate('Cart') }
        ]
      );

    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'No se pudo agregar el producto al carrito');
    }
  };

  // Función para ir al detalle del producto
  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  // Función para ir al carrito
  const handleCartPress = () => {
    navigation.navigate('Cart');
  };

  // Función para mostrar búsqueda
  const handleSearchPress = () => {
    setShowSearchModal(true);
  };

  // Función de refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    // Los datos se actualizan automáticamente por el listener
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Renderizar producto
  const renderProduct = ({ item }) => (
    <ProductCard
      product={item}
      onPress={() => handleProductPress(item)}
      showAddToCart={true}
      onAddToCart={handleAddToCart}
      style={styles.productCard}
    />
  );

  // Renderizar contenido principal
  const renderContent = () => {
    if (loading) {
      return <ProductsLoading count={6} />;
    }

    if (filteredProducts.length === 0) {
      if (searchQuery.trim()) {
        return (
          <EmptyState
            icon="search-outline"
            title="Sin resultados"
            subtitle={`No encontramos productos para "${searchQuery}"`}
            actionText="Limpiar búsqueda"
            onActionPress={() => setSearchQuery('')}
          />
        );
      }

      if (selectedCategory) {
        return (
          <EmptyState
            icon="cube-outline"
            title="Sin productos"
            subtitle="No hay productos en esta categoría"
            actionText="Ver todos"
            onActionPress={() => setSelectedCategory(null)}
          />
        );
      }

      return (
        <EmptyState
          icon="storefront-outline"
          title="Tienda vacía"
          subtitle="Aún no hay productos disponibles"
        />
      );
    }

    return (
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
          />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ShopHeader
        title="Tienda TASHIRO"
        subtitle={`${filteredProducts.length} productos disponibles`}
        cartItemCount={cartItemCount}
        onCartPress={handleCartPress}
        onSearchPress={handleSearchPress}
      />

      {/* Filtro de categorías */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Contenido principal */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Modal de búsqueda */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <SafeAreaView style={styles.searchModal}>
          <View style={styles.searchHeader}>
            <TouchableOpacity
              style={styles.searchCloseButton}
              onPress={() => setShowSearchModal(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.searchTitle}>Buscar productos</Text>
            <View style={styles.searchPlaceholder} />
          </View>

          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar por nombre, categoría..."
              autoFocus={true}
              returnKeyType="search"
              onSubmitEditing={() => setShowSearchModal(false)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.searchClearButton}
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.searchResults}>
            <Text style={styles.searchResultsText}>
              {searchQuery.trim() ? `${filteredProducts.length} resultados` : 'Escribe para buscar'}
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
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
  },
  productsList: {
    padding: 16,
    paddingBottom: 32,
  },
  productCard: {
    marginHorizontal: 4,
    marginBottom: 16,
  },

  // Search Modal
  searchModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  searchPlaceholder: {
    width: 40,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  searchClearButton: {
    marginLeft: 8,
  },
  searchResults: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchResultsText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default ShopScreen;
