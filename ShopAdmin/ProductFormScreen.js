// ProductFormScreen.js - Formulario para crear/editar productos
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  TextInput,
  Switch,
} from 'react-native';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
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

const ProductFormScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { product, mode } = route.params; // mode: 'create' | 'edit'

  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'kimonos',
    images: [],
    sizes: [],
    colors: [],
    stock: {},
    isActive: true,
  });

  // Estados para gestión de variantes
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [showSizeInput, setShowSizeInput] = useState(false);
  const [showColorInput, setShowColorInput] = useState(false);

  // Categorías disponibles
  const categories = [
    { id: 'kimonos', name: 'Kimonos' },
    { id: 'belts', name: 'Cinturones' },
    { id: 'accessories', name: 'Accesorios' },
    { id: 'apparel', name: 'Ropa' },
  ];

  // Tallas predefinidas
  const predefinedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5'];
  
  // Colores predefinidos
  const predefinedColors = ['White', 'Black', 'Blue', 'Red', 'Green', 'Yellow', 'Purple', 'Gray'];

  useEffect(() => {
    if (mode === 'edit' && product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        category: product.category || 'kimonos',
        images: product.images || [],
        sizes: product.sizes || [],
        colors: product.colors || [],
        stock: product.stock || {},
        isActive: product.isActive !== false,
      });
    }
  }, [mode, product]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre del producto es obligatorio');
      return false;
    }
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      Alert.alert('Error', 'El precio debe ser un número válido mayor a 0');
      return false;
    }
    if (formData.images.length === 0) {
      Alert.alert('Error', 'Debes agregar al menos una imagen del producto');
      return false;
    }
    return true;
  };

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets) {
        setUploadingImages(true);
        const uploadPromises = result.assets.map(uploadImage);
        const uploadedUrls = await Promise.all(uploadPromises);
        
        updateFormData('images', [...formData.images, ...uploadedUrls]);
        setUploadingImages(false);
      }
    } catch (error) {
      console.error('Error al seleccionar imágenes:', error);
      Alert.alert('Error', 'No se pudieron seleccionar las imágenes');
      setUploadingImages(false);
    }
  };

  const uploadImage = async (imageAsset) => {
    try {
      const response = await fetch(imageAsset.uri);
      const blob = await response.blob();
      
      const filename = `products/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const imageRef = ref(storage, filename);
      
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error al subir imagen:', error);
      throw error;
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateFormData('images', newImages);
  };

  const handleAddSize = (size) => {
    if (size && !formData.sizes.includes(size)) {
      const newSizes = [...formData.sizes, size];
      updateFormData('sizes', newSizes);
      updateStockForNewVariants(newSizes, formData.colors);
    }
    setNewSize('');
    setShowSizeInput(false);
  };

  const handleRemoveSize = (size) => {
    const newSizes = formData.sizes.filter(s => s !== size);
    updateFormData('sizes', newSizes);
    updateStockForNewVariants(newSizes, formData.colors);
  };

  const handleAddColor = (color) => {
    if (color && !formData.colors.includes(color)) {
      const newColors = [...formData.colors, color];
      updateFormData('colors', newColors);
      updateStockForNewVariants(formData.sizes, newColors);
    }
    setNewColor('');
    setShowColorInput(false);
  };

  const handleRemoveColor = (color) => {
    const newColors = formData.colors.filter(c => c !== color);
    updateFormData('colors', newColors);
    updateStockForNewVariants(formData.sizes, newColors);
  };

  const updateStockForNewVariants = (sizes, colors) => {
    const newStock = { ...formData.stock };
    
    // Generar todas las combinaciones posibles
    if (sizes.length === 0 && colors.length === 0) {
      newStock['default'] = newStock['default'] || 0;
    } else {
      sizes.forEach(size => {
        if (colors.length === 0) {
          newStock[size] = newStock[size] || 0;
        } else {
          colors.forEach(color => {
            const key = `${size}-${color}`;
            newStock[key] = newStock[key] || 0;
          });
        }
      });
      
      if (sizes.length === 0 && colors.length > 0) {
        colors.forEach(color => {
          newStock[color] = newStock[color] || 0;
        });
      }
    }
    
    updateFormData('stock', newStock);
  };

  const handleStockChange = (variantKey, value) => {
    const numValue = parseInt(value) || 0;
    updateFormData('stock', {
      ...formData.stock,
      [variantKey]: numValue,
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        images: formData.images,
        sizes: formData.sizes,
        colors: formData.colors,
        stock: formData.stock,
        isActive: formData.isActive,
        updatedAt: serverTimestamp(),
      };

      if (mode === 'create') {
        productData.createdAt = serverTimestamp();
        productData.createdBy = auth.currentUser?.uid;
        
        await addDoc(collection(db, 'products'), productData);
        Alert.alert('Éxito', 'Producto creado correctamente');
      } else {
        const productRef = doc(db, 'products', product.id);
        await updateDoc(productRef, productData);
        Alert.alert('Éxito', 'Producto actualizado correctamente');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      Alert.alert('Error', 'No se pudo guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  const renderImageGallery = () => (
    <AdminCard style={styles.section}>
      <Text style={styles.sectionTitle}>Imágenes del Producto</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
        {formData.images.map((imageUrl, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.productImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => handleRemoveImage(index)}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}
        
        <TouchableOpacity
          style={styles.addImageButton}
          onPress={handleImagePicker}
          disabled={uploadingImages}
        >
          {uploadingImages ? (
            <Text style={styles.addImageText}>Subiendo...</Text>
          ) : (
            <>
              <Ionicons name="camera-outline" size={32} color="#6B7280" />
              <Text style={styles.addImageText}>Agregar</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </AdminCard>
  );

  const renderBasicInfo = () => (
    <AdminCard style={styles.section}>
      <Text style={styles.sectionTitle}>Información Básica</Text>
      
      <AdminInput
        label="Nombre del Producto"
        value={formData.name}
        onChangeText={(value) => updateFormData('name', value)}
        placeholder="Ej: Kimono Tashiro Blanco"
      />

      <AdminInput
        label="Descripción"
        value={formData.description}
        onChangeText={(value) => updateFormData('description', value)}
        placeholder="Descripción detallada del producto..."
        multiline
        numberOfLines={4}
      />

      <AdminInput
        label="Precio (USD)"
        value={formData.price}
        onChangeText={(value) => updateFormData('price', value)}
        placeholder="0.00"
        keyboardType="numeric"
      />

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Categoría</Text>
        <View style={styles.categoryButtons}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                formData.category === category.id && styles.categoryButtonActive
              ]}
              onPress={() => updateFormData('category', category.id)}
            >
              <Text style={[
                styles.categoryButtonText,
                formData.category === category.id && styles.categoryButtonTextActive
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Producto activo</Text>
        <Switch
          value={formData.isActive}
          onValueChange={(value) => updateFormData('isActive', value)}
          trackColor={{ false: '#D1D5DB', true: '#10B981' }}
          thumbColor="#fff"
        />
      </View>
    </AdminCard>
  );

  const renderVariants = () => (
    <AdminCard style={styles.section}>
      <Text style={styles.sectionTitle}>Variantes y Stock</Text>
      
      {/* Tallas */}
      <View style={styles.variantSection}>
        <View style={styles.variantHeader}>
          <Text style={styles.variantTitle}>Tallas</Text>
          <TouchableOpacity
            style={styles.addVariantButton}
            onPress={() => setShowSizeInput(true)}
          >
            <Ionicons name="add" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {showSizeInput && (
          <View style={styles.addVariantForm}>
            <View style={styles.predefinedOptions}>
              {predefinedSizes.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={styles.predefinedOption}
                  onPress={() => handleAddSize(size)}
                >
                  <Text style={styles.predefinedOptionText}>{size}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customVariantInput}>
              <TextInput
                style={styles.variantInput}
                value={newSize}
                onChangeText={setNewSize}
                placeholder="Talla personalizada"
              />
              <TouchableOpacity
                style={styles.addCustomButton}
                onPress={() => handleAddSize(newSize)}
              >
                <Ionicons name="checkmark" size={20} color="#10B981" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowSizeInput(false);
                  setNewSize('');
                }}
              >
                <Ionicons name="close" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.variantTags}>
          {formData.sizes.map((size) => (
            <View key={size} style={styles.variantTag}>
              <Text style={styles.variantTagText}>{size}</Text>
              <TouchableOpacity onPress={() => handleRemoveSize(size)}>
                <Ionicons name="close" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <AdminDivider />

      {/* Colores */}
      <View style={styles.variantSection}>
        <View style={styles.variantHeader}>
          <Text style={styles.variantTitle}>Colores</Text>
          <TouchableOpacity
            style={styles.addVariantButton}
            onPress={() => setShowColorInput(true)}
          >
            <Ionicons name="add" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {showColorInput && (
          <View style={styles.addVariantForm}>
            <View style={styles.predefinedOptions}>
              {predefinedColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={styles.predefinedOption}
                  onPress={() => handleAddColor(color)}
                >
                  <Text style={styles.predefinedOptionText}>{color}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customVariantInput}>
              <TextInput
                style={styles.variantInput}
                value={newColor}
                onChangeText={setNewColor}
                placeholder="Color personalizado"
              />
              <TouchableOpacity
                style={styles.addCustomButton}
                onPress={() => handleAddColor(newColor)}
              >
                <Ionicons name="checkmark" size={20} color="#10B981" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowColorInput(false);
                  setNewColor('');
                }}
              >
                <Ionicons name="close" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.variantTags}>
          {formData.colors.map((color) => (
            <View key={color} style={styles.variantTag}>
              <Text style={styles.variantTagText}>{color}</Text>
              <TouchableOpacity onPress={() => handleRemoveColor(color)}>
                <Ionicons name="close" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <AdminDivider />

      {/* Stock por variante */}
      <View style={styles.stockSection}>
        <Text style={styles.variantTitle}>Stock por Variante</Text>
        {Object.keys(formData.stock).map((variantKey) => (
          <View key={variantKey} style={styles.stockRow}>
            <Text style={styles.stockLabel}>
              {variantKey === 'default' ? 'Stock general' : variantKey}
            </Text>
            <TextInput
              style={styles.stockInput}
              value={formData.stock[variantKey]?.toString() || '0'}
              onChangeText={(value) => handleStockChange(variantKey, value)}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
        ))}
      </View>
    </AdminCard>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader
        title={mode === 'create' ? 'Crear Producto' : 'Editar Producto'}
        subtitle={mode === 'edit' ? product?.name : 'Nuevo producto'}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderImageGallery()}
        {renderBasicInfo()}
        {renderVariants()}
      </ScrollView>

      <View style={styles.bottomSection}>
        <AdminButton
          title="Cancelar"
          variant="secondary"
          onPress={() => navigation.goBack()}
          style={styles.cancelFormButton}
        />
        <AdminButton
          title={mode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />
      </View>

      <AdminLoadingOverlay 
        visible={loading} 
        text={mode === 'create' ? 'Creando producto...' : 'Guardando cambios...'} 
      />
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

  // Image gallery
  imageGallery: {
    flexDirection: 'row',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  addImageText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },

  // Form inputs
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  categoryButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#374151',
  },

  // Variants
  variantSection: {
    marginBottom: 16,
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  variantTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  addVariantButton: {
    padding: 4,
  },
  addVariantForm: {
    marginBottom: 12,
  },
  predefinedOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  predefinedOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
  },
  predefinedOptionText: {
    fontSize: 12,
    color: '#374151',
  },
  customVariantInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  variantInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  addCustomButton: {
    padding: 8,
  },
  cancelButton: {
    padding: 8,
  },
  variantTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    gap: 4,
  },
  variantTagText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },

  // Stock
  stockSection: {
    marginTop: 16,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stockLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  stockInput: {
    width: 80,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fff',
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
  cancelFormButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});

export default ProductFormScreen;
