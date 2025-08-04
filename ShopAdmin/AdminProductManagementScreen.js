// AdminProductManagementScreen.js - Pantalla completa para gestión de productos
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
  Modal,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  AdminCard,
  AdminButton,
  AdminHeader,
  AdminInput,
  AdminDivider,
  AdminLoadingOverlay,
} from '../AdminScreen/AdminComponents';

const AdminProductManagementScreen = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'gi',
    colors: ['Negro'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: { S: 0, M: 0, L: 0, XL: 0 },
    images: [],
    active: true,
    featured: false,
    discount: 0,
  });

  const [selectedImages, setSelectedImages] = useState([]);

  // Categorías disponibles
  const categories = [
    { id: 'gi', name: 'Gi' },
    { id: 'nogi', name: 'No-Gi' },
    { id: 'accessories', name: 'Accesorios' },
    { id: 'equipment', name: 'Equipamiento' },
    { id: 'supplements', name: 'Suplementos' },
  ];

  // Colores disponibles
  const availableColors = [
    'Negro', 'Blanco', 'Azul', 'Rojo', 'Verde', 
    'Amarillo', 'Morado', 'Rosa', 'Gris', 'Naranja'
  ];

  // Tallas disponibles
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

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

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      category: 'gi',
      colors: ['Negro'],
      sizes: ['S', 'M', 'L', 'XL'],
      stock: { S: 0, M: 0, L: 0, XL: 0 },
      images: [],
      active: true,
      featured: false,
      discount: 0,
    });
    setSelectedImages([]);
    setEditingProduct(null);
  };

  // Abrir modal para agregar producto
  const handleAddProduct = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Abrir modal para editar producto
  const handleEditProduct = (product) => {
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      originalPrice: product.originalPrice?.toString() || '',
      category: product.category || 'gi',
      colors: product.colors || ['Negro'],
      sizes: product.sizes || ['S', 'M', 'L', 'XL'],
      stock: product.stock || { S: 0, M: 0, L: 0, XL: 0 },
      images: product.images || [],
      active: product.active !== false,
      featured: product.featured || false,
      discount: product.discount || 0,
    });
    setSelectedImages([]);
    setEditingProduct(product);
    setShowAddModal(true);
  };

  // Seleccionar imágenes
  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [1, 1],
      });

      if (!result.canceled) {
        setSelectedImages(result.assets);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'No se pudieron seleccionar las imágenes');
    }
  };

  // Subir imágenes a Firebase Storage
  const uploadImages = async () => {
    if (selectedImages.length === 0) return formData.images;

    setUploading(true);
    const uploadedUrls = [...formData.images];

    try {
      for (const image of selectedImages) {
        const response = await fetch(image.uri);
        const blob = await response.blob();
        
        const filename = `products/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        const storageRef = ref(storage, filename);
        
        await uploadBytes(storageRef, blob);
        const downloadUrl = await getDownloadURL(storageRef);
        uploadedUrls.push(downloadUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      Alert.alert('Error', 'No se pudieron subir las imágenes');
      return formData.images;
    } finally {
      setUploading(false);
    }
  };

  // Validar formulario
  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre del producto es requerido');
      return false;
    }

    if (!formData.price || isNaN(parseFloat(formData.price))) {
      Alert.alert('Error', 'El precio debe ser un número válido');
      return false;
    }

    if (formData.originalPrice && isNaN(parseFloat(formData.originalPrice))) {
      Alert.alert('Error', 'El precio original debe ser un número válido');
      return false;
    }

    if (formData.colors.length === 0) {
      Alert.alert('Error', 'Debe seleccionar al menos un color');
      return false;
    }

    if (formData.sizes.length === 0) {
      Alert.alert('Error', 'Debe seleccionar al menos una talla');
      return false;
    }

    return true;
  };

  // Guardar producto
  const handleSaveProduct = async () => {
    if (!validateForm()) return;

    try {
      setUploading(true);

      // Subir imágenes
      const imageUrls = await uploadImages();

      // Preparar datos del producto
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        category: formData.category,
        colors: formData.colors,
        sizes: formData.sizes,
        stock: formData.stock,
        images: imageUrls,
        active: formData.active,
        featured: formData.featured,
        discount: formData.discount,
        updatedAt: new Date(),
      };

      if (editingProduct) {
        // Actualizar producto existente
        const productRef = doc(db, 'products', editingProduct.id);
        await updateDoc(productRef, productData);
        Alert.alert('Éxito', 'Producto actualizado correctamente');
      } else {
        // Crear nuevo producto
        const productRef = doc(collection(db, 'products'));
        await setDoc(productRef, {
          ...productData,
          createdAt: new Date(),
        });
        Alert.alert('Éxito', 'Producto creado correctamente');
      }

      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'No se pudo guardar el producto');
    } finally {
      setUploading(false);
    }
  };

  // Eliminar producto
  const handleDeleteProduct = (product) => {
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

  // Cambiar estado activo del producto
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

  // Función de refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Formatear precio
  const formatPrice = (price) => `$${price.toFixed(2)}`;

  // Actualizar stock por talla
  const updateStock = (size, quantity) => {
    const newStock = { ...formData.stock };
    newStock[size] = Math.max(0, parseInt(quantity) || 0);
    setFormData({ ...formData, stock: newStock });
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
              Stock: {Object.values(item.stock || {}).reduce((sum, qty) => sum + qty, 0)}
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
          style={styles.actionButton}
          onPress={() => handleEditProduct(item)}
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
          onPress={() => handleDeleteProduct(item)}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
            Eliminar
          </Text>
        </TouchableOpacity>
      </View>
    </AdminCard>
  );

  // Renderizar modal de producto
  const renderProductModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAddModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowAddModal(false)}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
          </Text>
          <View style={styles.modalPlaceholder} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Información básica */}
          <AdminCard>
            <AdminHeader title="Información Básica" />
            
            <AdminInput
              label="Nombre del Producto"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Ej: Kimono BJJ Premium"
              required
            />

            <AdminInput
              label="Descripción"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Descripción detallada del producto"
              multiline
              numberOfLines={3}
            />

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <AdminInput
                  label="Precio"
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  placeholder="0.00"
                  keyboardType="numeric"
                  required
                />
              </View>
              <View style={styles.inputHalf}>
                <AdminInput
                  label="Precio Original"
                  value={formData.originalPrice}
                  onChangeText={(text) => setFormData({ ...formData, originalPrice: text })}
                  placeholder="0.00 (opcional)"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    formData.category === category.id && styles.categoryChipSelected
                  ]}
                  onPress={() => setFormData({ ...formData, category: category.id })}
                >
                  <Text style={[
                    styles.categoryChipText,
                    formData.category === category.id && styles.categoryChipTextSelected
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </AdminCard>

          {/* Imágenes */}
          <AdminCard>
            <AdminHeader title="Imágenes del Producto" />
            
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImages}>
              <Ionicons name="camera-outline" size={24} color="#3B82F6" />
              <Text style={styles.imagePickerText}>
                {selectedImages.length > 0 
                  ? `${selectedImages.length} imagen${selectedImages.length !== 1 ? 'es' : ''} seleccionada${selectedImages.length !== 1 ? 's' : ''}`
                  : 'Seleccionar Imágenes'
                }
              </Text>
            </TouchableOpacity>

            {/* Mostrar imágenes existentes */}
            {formData.images.length > 0 && (
              <View style={styles.existingImages}>
                <Text style={styles.sectionSubtitle}>Imágenes actuales:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {formData.images.map((imageUrl, index) => (
                    <Image key={index} source={{ uri: imageUrl }} style={styles.existingImage} />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Mostrar imágenes seleccionadas */}
            {selectedImages.length > 0 && (
              <View style={styles.selectedImages}>
                <Text style={styles.sectionSubtitle}>Nuevas imágenes:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedImages.map((image, index) => (
                    <Image key={index} source={{ uri: image.uri }} style={styles.selectedImage} />
                  ))}
                </ScrollView>
              </View>
            )}
          </AdminCard>

          {/* Variantes */}
          <AdminCard>
            <AdminHeader title="Variantes y Stock" />
            
            <Text style={styles.inputLabel}>Colores Disponibles</Text>
            <View style={styles.colorGrid}>
              {availableColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorChip,
                    formData.colors.includes(color) && styles.colorChipSelected
                  ]}
                  onPress={() => {
                    const newColors = formData.colors.includes(color)
                      ? formData.colors.filter(c => c !== color)
                      : [...formData.colors, color];
                    setFormData({ ...formData, colors: newColors });
                  }}
                >
                  <Text style={[
                    styles.colorChipText,
                    formData.colors.includes(color) && styles.colorChipTextSelected
                  ]}>
                    {color}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Tallas y Stock</Text>
            <View style={styles.sizeStockContainer}>
              {availableSizes.map((size) => (
                <View key={size} style={styles.sizeStockRow}>
                  <TouchableOpacity
                    style={[
                      styles.sizeToggle,
                      formData.sizes.includes(size) && styles.sizeToggleSelected
                    ]}
                    onPress={() => {
                      const newSizes = formData.sizes.includes(size)
                        ? formData.sizes.filter(s => s !== size)
                        : [...formData.sizes, size];
                      
                      const newStock = { ...formData.stock };
                      if (!newSizes.includes(size)) {
                        delete newStock[size];
                      } else if (!newStock[size]) {
                        newStock[size] = 0;
                      }
                      
                      setFormData({ ...formData, sizes: newSizes, stock: newStock });
                    }}
                  >
                    <Text style={[
                      styles.sizeToggleText,
                      formData.sizes.includes(size) && styles.sizeToggleTextSelected
                    ]}>
                      {size}
                    </Text>
                  </TouchableOpacity>

                  {formData.sizes.includes(size) && (
                    <TextInput
                      style={styles.stockInput}
                      value={(formData.stock[size] || 0).toString()}
                      onChangeText={(text) => updateStock(size, text)}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  )}
                </View>
              ))}
            </View>
          </AdminCard>

          {/* Configuración */}
          <AdminCard>
            <AdminHeader title="Configuración" />
            
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Producto Activo</Text>
              <TouchableOpacity
                style={[
                  styles.toggle,
                  formData.active && styles.toggleActive
                ]}
                onPress={() => setFormData({ ...formData, active: !formData.active })}
              >
                <View style={[
                  styles.toggleThumb,
                  formData.active && styles.toggleThumbActive
                ]} />
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Producto Destacado</Text>
              <TouchableOpacity
                style={[
                  styles.toggle,
                  formData.featured && styles.toggleActive
                ]}
                onPress={() => setFormData({ ...formData, featured: !formData.featured })}
              >
                <View style={[
                  styles.toggleThumb,
                  formData.featured && styles.toggleThumbActive
                ]} />
              </TouchableOpacity>
            </View>

            <AdminInput
              label="Descuento (%)"
              value={formData.discount.toString()}
              onChangeText={(text) => setFormData({ ...formData, discount: parseInt(text) || 0 })}
              placeholder="0"
              keyboardType="numeric"
            />
          </AdminCard>
        </ScrollView>

        {/* Botones de acción */}
        <View style={styles.modalActions}>
          <AdminButton
            title="Cancelar"
            variant="secondary"
            onPress={() => setShowAddModal(false)}
            style={styles.modalActionButton}
          />
          <AdminButton
            title={uploading ? 'Guardando...' : 'Guardar Producto'}
            onPress={handleSaveProduct}
            disabled={uploading}
            style={styles.modalActionButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader
        title="Gestión de Productos"
        subtitle={`${products.length} productos registrados`}
        rightComponent={
          <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={products}
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
        ListEmptyComponent={
          !loading && (
            <AdminCard style={styles.emptyCard}>
              <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Sin productos</Text>
              <Text style={styles.emptySubtitle}>
                Comienza agregando tu primer producto
              </Text>
              <AdminButton
                title="Agregar Producto"
                onPress={handleAddProduct}
                style={styles.emptyButton}
              />
            </AdminCard>
          )
        }
      />

      {renderProductModal()}
      
      {loading && <AdminLoadingOverlay />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 11,
    fontWeight: '500',
    color: '#3B82F6',
  },
  
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalPlaceholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
  },
  
  // Form Elements
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  
  // Images
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  imagePickerText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  existingImages: {
    marginBottom: 16,
  },
  existingImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  selectedImages: {
    marginBottom: 16,
  },
  selectedImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  
  // Colors and Sizes
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  colorChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  colorChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  colorChipText: {
    fontSize: 12,
    color: '#6B7280',
  },
  colorChipTextSelected: {
    color: '#fff',
  },
  sizeStockContainer: {
    gap: 8,
  },
  sizeStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sizeToggle: {
    width: 60,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sizeToggleSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  sizeToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  sizeToggleTextSelected: {
    color: '#fff',
  },
  stockInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Toggles
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#3B82F6',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
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
});

export default AdminProductManagementScreen;
