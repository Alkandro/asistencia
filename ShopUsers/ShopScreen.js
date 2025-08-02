// // ShopScreen.js - Diseño híbrido: filtros largos + iconos + stock corregido
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
} from 'react-native';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  ProductCard,
  ShopHeader,
  EmptyState,
  ProductsLoading,
} from '../ComponentsShop/ShopComponents';

const { width: screenWidth } = Dimensions.get('window');

const ShopScreen = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [categoryBackgrounds, setCategoryBackgrounds] = useState({});
  const [categoryTitles, setCategoryTitles] = useState({});
  
  // Estados de filtros
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Categorías con iconos y anchos variables - INCLUYE SUPLEMENTOS
  const categories = [
    { id: null, name: 'Todos', icon: 'grid-outline', width: 110 },
    { id: 'gi', name: 'Gi', icon: 'shirt-outline', width: 80 },
    { id: 'no-gi', name: 'No-Gi', icon: 'fitness-outline', width: 95 },
    { id: 'accessories', name: 'Accesorios', icon: 'bag-outline', width: 130 },
    { id: 'equipment', name: 'Equipos', icon: 'barbell-outline', width: 100 },
    { id: 'supplements', name: 'Suplementos', icon: 'nutrition-outline', width: 120 }, // NUEVO
  ];

  // Cargar productos desde Firebase
  const loadProducts = async () => {
    try {
      console.log('📦 Cargando productos...');
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('active', '==', true));
      const snapshot = await getDocs(q);
      
      const productsData = [];
      snapshot.forEach((doc) => {
        const productData = { id: doc.id, ...doc.data() };
        console.log('📦 Producto cargado:', {
          id: productData.id,
          name: productData.name,
          category: productData.category,
          price: productData.price
        });
        productsData.push(productData);
      });

      console.log('📦 Total productos cargados:', productsData.length);
      
      // Log de productos por categoría para debug
      const productsByCategory = productsData.reduce((acc, product) => {
        const cat = product.category || 'sin-categoria';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
      console.log('📊 Productos por categoría:', productsByCategory);

      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error('❌ Error loading products:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    }
  };

  // Cargar fondos de categorías desde Firebase
  const loadCategoryBackgrounds = async () => {
    try {
      console.log('🎨 Cargando fondos de categorías...');
      const configRef = doc(db, 'config', 'categoryBackgrounds');
      const configSnap = await getDoc(configRef);
      
      if (configSnap.exists()) {
        const backgrounds = configSnap.data();
        console.log('✅ Fondos cargados:', backgrounds);
        setCategoryBackgrounds(backgrounds);
      }
    } catch (error) {
      console.log('❌ Error cargando fondos:', error);
    }
  };

  // Cargar títulos personalizados de categorías
  const loadCategoryTitles = async () => {
    try {
      console.log('📝 Cargando títulos de categorías...');
      const configRef = doc(db, 'config', 'categoryTitles');
      const configSnap = await getDoc(configRef);
      
      if (configSnap.exists()) {
        const titles = configSnap.data();
        console.log('✅ Títulos cargados:', titles);
        setCategoryTitles(titles);
      }
    } catch (error) {
      console.log('❌ Error cargando títulos:', error);
    }
  };

  // Función para obtener stock de un producto
  const getProductStock = (product) => {
    if (!product) return 0;
    
    if (!product.stock) {
      return 10; // Stock por defecto
    }
    
    if (typeof product.stock === 'number') {
      return product.stock;
    }
    
    if (typeof product.stock === 'object') {
      const totalStock = Object.values(product.stock).reduce((total, stock) => {
        const stockValue = typeof stock === 'number' ? stock : 0;
        return total + stockValue;
      }, 0);
      return totalStock;
    }
    
    return 0;
  };

  // Filtrar productos por categoría - CORREGIDO PARA NO-GI
  const filterProducts = (categoryId) => {
    console.log('🔍 Filtrando por categoría:', categoryId);
    setSelectedCategory(categoryId);
    
    if (!categoryId || categoryId === null) {
      console.log('📋 Mostrando todos los productos:', products.length);
      setFilteredProducts(products);
    } else {
      // CORRECCIÓN: Normalizar categorías para comparación
      const filtered = products.filter(product => {
        const productCategory = product.category;
        
        // Normalizar "no-gi" vs "No-Gi" vs "NO-GI"
        const normalizedProductCategory = productCategory?.toLowerCase().replace(/[-\s]/g, '');
        const normalizedFilterCategory = categoryId?.toLowerCase().replace(/[-\s]/g, '');
        
        const matches = normalizedProductCategory === normalizedFilterCategory;
        
        console.log(`🔍 Producto "${product.name}": categoria="${productCategory}" (normalizada: "${normalizedProductCategory}"), buscando="${categoryId}" (normalizada: "${normalizedFilterCategory}"), coincide=${matches}`);
        return matches;
      });
      
      console.log(`📋 Productos encontrados en "${categoryId}":`, filtered.length);
      setFilteredProducts(filtered);
    }
  };

  // Navegar a detalle de producto
  const navigateToProduct = (product) => {
    console.log('🔗 Navegando a producto:', {
      id: product.id,
      name: product.name,
      category: product.category
    });
    
    navigation.navigate('ProductDetail', { 
      productId: product.id,
      product: product
    });
  };

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadProducts(),
        loadCategoryBackgrounds(),
        loadCategoryTitles()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  // Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadProducts(),
      loadCategoryBackgrounds(),
      loadCategoryTitles()
    ]);
    setRefreshing(false);
  };

  // Renderizar filtro de categoría con ancho variable
  const renderCategoryFilter = ({ item: category }) => {
    const isSelected = selectedCategory === category.id;
    const backgroundImage = categoryBackgrounds[category.id];
    const customTitle = categoryTitles[category.id] || category.name;

    // Contar productos en esta categoría
    const categoryCount = category.id === null 
      ? products.length 
      : products.filter(p => {
          const productCategory = p.category?.toLowerCase().replace(/[-\s]/g, '');
          const filterCategory = category.id?.toLowerCase().replace(/[-\s]/g, '');
          return productCategory === filterCategory;
        }).length;

    // Si hay imagen de fondo (solo para categorías no estáticas)
    if (backgroundImage && category.id !== null) {
      return (
        <TouchableOpacity
          style={[
            styles.categoryFilterVariable,
            { width: category.width },
            isSelected && styles.categoryFilterSelected
          ]}
          onPress={() => filterProducts(category.id)}
        >
          <ImageBackground
            source={{ uri: backgroundImage }}
            style={styles.categoryFilterBackground}
            imageStyle={styles.categoryFilterBackgroundImage}
          >
            <View style={styles.categoryFilterOverlay}>
              <Ionicons 
                name={category.icon} 
                size={20} 
                color="#fff" 
                style={styles.categoryIcon}
              />
              <Text style={styles.categoryFilterTextWithBackground}>
                {customTitle}
              </Text>
              {categoryCount > 0 && (
                <Text style={styles.categoryCountWithBackground}>
                  ({categoryCount})
                </Text>
              )}
            </View>
          </ImageBackground>
        </TouchableOpacity>
      );
    }

    // Sin imagen de fondo (diseño normal)
    return (
      <TouchableOpacity
        style={[
          styles.categoryFilterVariable,
          { width: category.width },
          isSelected ? styles.categoryFilterSelected : styles.categoryFilterDefault
        ]}
        onPress={() => filterProducts(category.id)}
      >
        <View style={styles.categoryFilterContent}>
          <Ionicons 
            name={category.icon} 
            size={20} 
            color={isSelected ? '#fff' : '#374151'} 
            style={styles.categoryIcon}
          />
          <Text style={[
            styles.categoryFilterText,
            isSelected && styles.categoryFilterTextSelected
          ]}>
            {customTitle}
          </Text>
          {categoryCount > 0 && (
            <Text style={[
              styles.categoryCount,
              isSelected && styles.categoryCountSelected
            ]}>
              ({categoryCount})
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Renderizar producto en grid 2x2
  const renderProduct = ({ item, index }) => {
    const stock = getProductStock(item);
    
    return (
      <View style={styles.productContainer}>
        <TouchableOpacity
          style={styles.productCard}
          onPress={() => navigateToProduct(item)}
        >
          {/* Imagen del producto */}
          <View style={styles.productImageContainer}>
            {item.images && item.images.length > 0 ? (
              <ImageBackground
                source={{ uri: item.images[0] }}
                style={styles.productImage}
                imageStyle={styles.productImageStyle}
              >
                {/* Badge de stock */}
                <View style={[
                  styles.stockBadge,
                  stock === 0 ? styles.stockBadgeOut :
                  stock < 5 ? styles.stockBadgeLow : styles.stockBadgeAvailable
                ]}>
                  <Text style={styles.stockBadgeText}>
                    {stock === 0 ? 'Agotado' : stock < 5 ? 'Pocas unidades' : 'Disponible'}
                  </Text>
                </View>
              </ImageBackground>
            ) : (
              <View style={[styles.productImage, styles.placeholderImage]}>
                <Ionicons name="image-outline" size={32} color="#D1D5DB" />
              </View>
            )}
          </View>

          {/* Información del producto */}
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.productCategory}>
              {item.category?.toUpperCase() || 'PRODUCTO'}
            </Text>
            <Text style={styles.productPrice}>
              ${parseFloat(item.price || 0).toFixed(2)}
            </Text>
            
            {/* Variantes disponibles */}
            {(item.sizes || item.colors) && (
              <View style={styles.variantsInfo}>
                {item.sizes && (
                  <Text style={styles.variantsText}>
                    Tallas: {item.sizes.join(', ')}
                  </Text>
                )}
                {item.colors && (
                  <Text style={styles.variantsText}>
                    Colores: {item.colors.join(', ')}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Botón agregar */}
          <TouchableOpacity 
            style={[
              styles.addButton,
              stock === 0 && styles.addButtonDisabled
            ]}
            disabled={stock === 0}
            onPress={() => navigateToProduct(item)}
          >
            <Ionicons 
              name="add" 
              size={20} 
              color={stock === 0 ? '#9CA3AF' : '#fff'} 
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ShopHeader 
          title="Tienda TASHIRO"
          cartItemCount={cartItemCount}
          onCartPress={() => navigation.navigate('Cart')}
        />
        <ProductsLoading />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ShopHeader 
        title="Tienda TASHIRO"
        subtitle={`${filteredProducts.length} productos disponibles`}
        cartItemCount={cartItemCount}
        onCartPress={() => navigation.navigate('Cart')}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Filtros de categoría con anchos variables */}
        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollContent}
          >
            {categories.map((category) => (
              <View key={category.id || 'all'} style={styles.categoryFilterWrapper}>
                {renderCategoryFilter({ item: category })}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Lista de productos en grid 2x2 */}
        {filteredProducts.length > 0 ? (
          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            numColumns={2}
            keyExtractor={(item) => item.id}
            columnWrapperStyle={styles.productRow}
            contentContainerStyle={styles.productsContainer}
            scrollEnabled={false}
          />
        ) : (
          <EmptyState
            icon="storefront-outline"
            title={selectedCategory ? "No hay productos en esta categoría" : "No hay productos"}
            subtitle={selectedCategory ? `No se encontraron productos en "${selectedCategory}"` : "No se encontraron productos"}
            buttonText="Ver todos"
            onButtonPress={() => filterProducts(null)}
          />
        )}
      </ScrollView>
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
  
  // FILTROS CON ANCHO VARIABLE
  filtersContainer: {
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryFilterWrapper: {
    // Wrapper para mantener espaciado
  },
  categoryFilterVariable: {
    height: 200,
    borderRadius: 5,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryFilterDefault: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryFilterSelected: {
    backgroundColor: '#1F2937',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  categoryFilterContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  categoryFilterBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  categoryFilterBackgroundImage: {
    borderRadius: 10,
  },
  categoryFilterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  categoryIcon: {
    marginBottom: 8,
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  categoryFilterTextSelected: {
    color: '#fff',
  },
  categoryFilterTextWithBackground: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  categoryCount: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  categoryCountSelected: {
    color: '#D1D5DB',
  },
  categoryCountWithBackground: {
    fontSize: 10,
    color: '#fff',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // PRODUCTOS EN GRID 2x2
  productsContainer: {
    padding: 16,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productContainer: {
    width: (screenWidth - 48) / 2,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 8,
  },
  productImageStyle: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  placeholderImage: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  stockBadgeAvailable: {
    backgroundColor: '#10B981',
  },
  stockBadgeLow: {
    backgroundColor: '#F59E0B',
  },
  stockBadgeOut: {
    backgroundColor: '#EF4444',
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  variantsInfo: {
    marginTop: 4,
  },
  variantsText: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  addButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});

export default ShopScreen;

