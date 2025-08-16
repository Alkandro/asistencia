// // // ShopScreen.js - Diseño híbrido: filtros largos + iconos + stock corregido
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

  // ✅ CATEGORÍAS CON ICONOS Y ANCHOS VARIABLES - INCLUYE SUPLEMENTOS
  const categories = [
    { id: null, name: 'Todos', icon: 'grid-outline', width: 110 },
    { id: 'gi', name: 'Gi', icon: 'shirt-outline', width: 80 },
    { id: 'no-gi', name: 'No-Gi', icon: 'fitness-outline', width: 95 },
    { id: 'accessories', name: 'Accesorios', icon: 'bag-outline', width: 130 },
    { id: 'equipment', name: 'Equipos', icon: 'barbell-outline', width: 100 },
    { id: 'supplements', name: 'Suplementos', icon: 'nutrition-outline', width: 120 },
  ];

  // ✅ CARGAR PRODUCTOS CON VERIFICACIÓN DE DESTACADOS
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
          featured: productData.featured, // ✅ VERIFICAR CAMPO DESTACADO
          price: productData.price
        });
        productsData.push(productData);
      });

      console.log('📦 Total productos cargados:', productsData.length);
      
      // ✅ SEPARAR PRODUCTOS DESTACADOS
      const featuredProducts = productsData.filter(product => product.featured === true);
      const regularProducts = productsData.filter(product => product.featured !== true);
      
      console.log('⭐ Productos destacados:', featuredProducts.length);
      console.log('📋 Productos regulares:', regularProducts.length);
      
      // ✅ ORDENAR: DESTACADOS PRIMERO, LUEGO REGULARES
      const sortedProducts = [...featuredProducts, ...regularProducts];
      
      // Log de productos por categoría para debug
      const productsByCategory = sortedProducts.reduce((acc, product) => {
        const cat = product.category || 'sin-categoria';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
      console.log('📊 Productos por categoría:', productsByCategory);

      setProducts(sortedProducts);
      setFilteredProducts(sortedProducts);
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

  // ✅ FUNCIÓN PARA OBTENER STOCK DE UN PRODUCTO
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

  // ✅ FILTRAR PRODUCTOS CON NORMALIZACIÓN MEJORADA Y DESTACADOS PRIMERO
  const filterProducts = (categoryId) => {
    console.log('🔍 Filtrando por categoría:', categoryId);
    setSelectedCategory(categoryId);
    
    if (!categoryId || categoryId === null) {
      // Mostrar todos los productos (destacados primero)
      const featuredProducts = products.filter(product => product.featured === true);
      const regularProducts = products.filter(product => product.featured !== true);
      const allProducts = [...featuredProducts, ...regularProducts];
      
      console.log('📋 Mostrando todos los productos:', allProducts.length);
      setFilteredProducts(allProducts);
    } else {
      // ✅ FUNCIÓN DE NORMALIZACIÓN MEJORADA
      const normalizeCategory = (category) => {
        if (!category) return '';
        return category.toLowerCase()
          .replace(/[-\s]/g, '') // Remover guiones y espacios
          .replace(/[áàäâ]/g, 'a')
          .replace(/[éèëê]/g, 'e')
          .replace(/[íìïî]/g, 'i')
          .replace(/[óòöô]/g, 'o')
          .replace(/[úùüû]/g, 'u')
          .replace(/ñ/g, 'n');
      };

      const normalizedCategoryId = normalizeCategory(categoryId);
      
      const filtered = products.filter(product => {
        const normalizedProductCategory = normalizeCategory(product.category);
        const matches = normalizedProductCategory === normalizedCategoryId;
        
        console.log(`🔍 Producto "${product.name}": categoria="${product.category}" (normalizada: "${normalizedProductCategory}"), buscando="${categoryId}" (normalizada: "${normalizedCategoryId}"), coincide=${matches}`);
        return matches;
      });

      // ✅ ORDENAR FILTRADOS: DESTACADOS PRIMERO
      const featuredFiltered = filtered.filter(product => product.featured === true);
      const regularFiltered = filtered.filter(product => product.featured !== true);
      const sortedFiltered = [...featuredFiltered, ...regularFiltered];

      console.log(`📋 Productos encontrados en "${categoryId}":`, sortedFiltered.length);
      console.log('⭐ Destacados en categoría:', featuredFiltered.length);
      
      setFilteredProducts(sortedFiltered);
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

  // ✅ RENDERIZAR FILTRO DE CATEGORÍA CON ANCHO VARIABLE (DISEÑO EXACTO)
  const renderCategoryFilter = ({ item: category }) => {
    const isSelected = selectedCategory === category.id;
    const backgroundImage = categoryBackgrounds[category.id];
    const customTitle = categoryTitles[category.id] || category.name;

    // ✅ CONTAR PRODUCTOS EN ESTA CATEGORÍA CON NORMALIZACIÓN
    const categoryCount = category.id === null 
      ? products.length 
      : products.filter(p => {
          const normalizeCategory = (cat) => {
            if (!cat) return '';
            return cat.toLowerCase()
              .replace(/[-\s]/g, '')
              .replace(/[áàäâ]/g, 'a')
              .replace(/[éèëê]/g, 'e')
              .replace(/[íìïî]/g, 'i')
              .replace(/[óòöô]/g, 'o')
              .replace(/[úùüû]/g, 'u')
              .replace(/ñ/g, 'n');
          };
          const productCategory = normalizeCategory(p.category);
          const filterCategory = normalizeCategory(category.id);
          return productCategory === filterCategory;
        }).length;

    // ✅ SI HAY IMAGEN DE FONDO (SOLO PARA CATEGORÍAS NO ESTÁTICAS)
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

    // ✅ SIN IMAGEN DE FONDO (DISEÑO NORMAL)
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

  // ✅ RENDERIZAR PRODUCTO EN GRID 2x2 CON BADGE DE DESTACADO
  const renderProduct = ({ item, index }) => {
    const stock = getProductStock(item);
    
    return (
      <View style={styles.productContainer}>
        <TouchableOpacity
          style={styles.productCard}
          onPress={() => navigateToProduct(item)}
        >
          {/* ✅ IMAGEN DEL PRODUCTO */}
          <View style={styles.productImageContainer}>
            {item.images && item.images.length > 0 ? (
              <ImageBackground
                source={{ uri: item.images[0] }}
                style={styles.productImage}
                imageStyle={styles.productImageStyle}
              >
                {/* ✅ BADGE DE DESTACADO */}
                {item.featured && (
                  <View style={styles.featuredBadge}>
                    <Ionicons name="star" size={10} color="#fff" />
                    <Text style={styles.featuredBadgeText}>Destacado</Text>
                  </View>
                )}
                
                {/* ✅ BADGE DE STOCK */}
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
                
                {/* ✅ BADGE DE DESTACADO PARA PLACEHOLDER */}
                {item.featured && (
                  <View style={styles.featuredBadge}>
                    <Ionicons name="star" size={10} color="#fff" />
                    <Text style={styles.featuredBadgeText}>Destacado</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* ✅ INFORMACIÓN DEL PRODUCTO */}
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
            
            {/* ✅ VARIANTES DISPONIBLES */}
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

          {/* ✅ BOTÓN AGREGAR */}
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
        {/* ✅ FILTROS DE CATEGORÍA CON ANCHOS VARIABLES */}
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

        {/* ✅ LISTA DE PRODUCTOS EN GRID 2x2 */}
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

// ✅ ESTILOS EXACTOS DEL SEGUNDO COMPONENTE
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  
  // ✅ FILTROS CON ANCHO VARIABLE (DISEÑO EXACTO)
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
    height: 200, // ✅ ALTURA EXACTA
    borderRadius: 5, // ✅ BORDER RADIUS EXACTO
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryFilterDefault: {
    backgroundColor: '#F3F4F6', // ✅ COLOR EXACTO
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryFilterSelected: {
    backgroundColor: '#1F2937', // ✅ COLOR EXACTO
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
    borderRadius: 10, // ✅ BORDER RADIUS EXACTO
  },
  categoryFilterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // ✅ OVERLAY EXACTO
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  categoryIcon: {
    marginBottom: 8, // ✅ ESPACIADO EXACTO
  },
  categoryFilterText: {
    fontSize: 12, // ✅ TAMAÑO EXACTO
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryFilterTextSelected: {
    color: '#fff', // ✅ COLOR EXACTO
  },
  categoryFilterTextWithBackground: {
    fontSize: 12, // ✅ TAMAÑO EXACTO
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 10, // ✅ TAMAÑO EXACTO
    color: '#9CA3AF',
  },
  categoryCountSelected: {
    color: '#E5E7EB', // ✅ COLOR EXACTO
  },
  categoryCountWithBackground: {
    fontSize: 10, // ✅ TAMAÑO EXACTO
    color: '#fff',
    opacity: 0.9,
  },

  // ✅ PRODUCTOS EN GRID 2x2 (DISEÑO EXACTO)
  productsContainer: {
    padding: 16,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12, // ✅ BORDER RADIUS EXACTO
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 330,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 120, // ✅ ALTURA EXACTA
    backgroundColor: '#F3F4F6',
  },
  productImageStyle: {
    borderTopLeftRadius: 12, // ✅ BORDER RADIUS EXACTO
    borderTopRightRadius: 12,
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // ✅ BADGE DE DESTACADO (POSICIÓN EXACTA)
  featuredBadge: {
    position: 'absolute',
    top: 8, // ✅ POSICIÓN EXACTA
    left: 8,
    backgroundColor: '#F59E0B', // ✅ COLOR EXACTO
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 10,
    gap: 3,
  },
  featuredBadgeText: {
    fontSize: 9, // ✅ TAMAÑO EXACTO
    fontWeight: '600',
    color: '#fff',
  },
  
  // ✅ BADGE DE STOCK (POSICIÓN EXACTA)
  stockBadge: {
    position: 'absolute',
    bottom: 8, // ✅ POSICIÓN EXACTA
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockBadgeAvailable: {
    backgroundColor: '#10B981', // ✅ COLOR EXACTO
  },
  stockBadgeLow: {
    backgroundColor: '#F59E0B', // ✅ COLOR EXACTO
  },
  stockBadgeOut: {
    backgroundColor: '#EF4444', // ✅ COLOR EXACTO
  },
  stockBadgeText: {
    fontSize: 9, // ✅ TAMAÑO EXACTO
    fontWeight: '600',
    color: '#fff',
  },
  
  // ✅ INFORMACIÓN DEL PRODUCTO (ESPACIADO EXACTO)
  productInfo: {
    padding: 12, // ✅ PADDING EXACTO
  },
  productName: {
    fontSize: 14, // ✅ TAMAÑO EXACTO
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 18,
  },
  productCategory: {
    fontSize: 10, // ✅ TAMAÑO EXACTO
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  productPrice: {
    fontSize: 16, // ✅ TAMAÑO EXACTO
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  variantsInfo: {
    marginTop: 4,
  },
  variantsText: {
    fontSize: 10, // ✅ TAMAÑO EXACTO
    color: '#9CA3AF',
    marginBottom: 2,
  },
  
  // ✅ BOTÓN AGREGAR (POSICIÓN EXACTA)
  addButton: {
    position: 'absolute',
    bottom: 12, // ✅ POSICIÓN EXACTA
    right: 12,
    width: 32, // ✅ TAMAÑO EXACTO
    height: 32,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#D1D5DB', // ✅ COLOR EXACTO
  },
});

export default ShopScreen;
