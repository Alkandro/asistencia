// AdminCategoryBackgroundsScreen.js - Configuración de fondos de categorías
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
  ImageBackground,
  TextInput,
  Modal,
} from 'react-native';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  AdminCard,
  AdminButton,
  AdminHeader,
} from './AdminComponents';

const AdminCategoryBackgroundsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categoryBackgrounds, setCategoryBackgrounds] = useState({});
  const [categoryTitles, setCategoryTitles] = useState({});
  const [uploadingCategory, setUploadingCategory] = useState(null);
  
  // Estados para modal de edición de título
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [titleModalVisible, setTitleModalVisible] = useState(false);

  // Categorías disponibles - INCLUYE SUPLEMENTOS
  const categories = [
  
    { 
      id: 'gi', 
      name: 'Gi', 
      description: 'Kimonos y uniformes tradicionales',
      defaultColor: '#3B82F6',
      width: 80,
      isStatic: false
    },
    { 
      id: 'no-gi', 
      name: 'No-Gi', 
      description: 'Ropa deportiva sin kimono',
      defaultColor: '#10B981',
      width: 95,
      isStatic: false
    },
    { 
      id: 'accessories', 
      name: 'Accesorios', 
      description: 'Cinturones, protectores y complementos',
      defaultColor: '#F59E0B',
      width: 130,
      isStatic: false
    },
    { 
      id: 'equipment', 
      name: 'Equipos', 
      description: 'Equipamiento de entrenamiento',
      defaultColor: '#EF4444',
      width: 100,
      isStatic: false
    },
    { 
      id: 'supplements', 
      name: 'Suplementos', 
      description: 'Proteínas, vitaminas y suplementos nutricionales',
      defaultColor: '#8B5CF6',
      width: 120,
      isStatic: false
    },
  ];

  // Cargar configuraciones desde Firebase
  const loadConfigurations = async () => {
    try {
      setLoading(true);
      
      // Cargar fondos
      const backgroundsRef = doc(db, 'config', 'categoryBackgrounds');
      const backgroundsSnap = await getDoc(backgroundsRef);
      
      if (backgroundsSnap.exists()) {
        setCategoryBackgrounds(backgroundsSnap.data());
        console.log('✅ Fondos cargados:', backgroundsSnap.data());
      }

      // Cargar títulos personalizados
      const titlesRef = doc(db, 'config', 'categoryTitles');
      const titlesSnap = await getDoc(titlesRef);
      
      if (titlesSnap.exists()) {
        setCategoryTitles(titlesSnap.data());
        console.log('✅ Títulos cargados:', titlesSnap.data());
      }
      
    } catch (error) {
      console.error('❌ Error cargando configuraciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las configuraciones');
    } finally {
      setLoading(false);
    }
  };

  // Seleccionar imagen para categoría (SOLO para categorías no estáticas)
  const selectImageForCategory = async (categoryId) => {
    // Verificar que no sea la categoría "Todos"
    if (categoryId === null) {
      Alert.alert('No Disponible', 'La categoría "Todos" es estática y no permite configurar fondo');
      return;
    }

    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos para acceder a la galería');
        return;
      }

      // Seleccionar imagen
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadCategoryBackground(categoryId, result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Subir imagen de fondo a Firebase Storage
  const uploadCategoryBackground = async (categoryId, imageUri) => {
    try {
      setUploadingCategory(categoryId);
      
      // Crear referencia en Storage
      const categoryKey = categoryId;
      const storageRef = ref(storage, `category-backgrounds/${categoryKey}_${Date.now()}.jpg`);
      
      // Convertir URI a blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Subir imagen
      console.log(`📤 Subiendo imagen para categoría: ${categoryKey}`);
      await uploadBytes(storageRef, blob);
      
      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(storageRef);
      console.log(`✅ Imagen subida: ${downloadURL}`);
      
      // Guardar URL en Firestore
      const configRef = doc(db, 'config', 'categoryBackgrounds');
      await updateDoc(configRef, {
        [categoryKey]: downloadURL
      }).catch(async (error) => {
        if (error.code === 'not-found') {
          await setDoc(configRef, {
            [categoryKey]: downloadURL
          });
        } else {
          throw error;
        }
      });
      
      // Actualizar estado local
      setCategoryBackgrounds(prev => ({
        ...prev,
        [categoryKey]: downloadURL
      }));
      
      Alert.alert('Éxito', 'Imagen de fondo configurada correctamente');
      
    } catch (error) {
      console.error('❌ Error subiendo imagen:', error);
      Alert.alert('Error', 'No se pudo configurar la imagen de fondo');
    } finally {
      setUploadingCategory(null);
    }
  };

  // Eliminar fondo de categoría
  const removeCategoryBackground = async (categoryId) => {
    if (categoryId === null) {
      Alert.alert('No Disponible', 'La categoría "Todos" es estática y no permite modificar fondo');
      return;
    }

    try {
      Alert.alert(
        'Confirmar',
        '¿Estás seguro de que quieres eliminar este fondo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Eliminar', 
            style: 'destructive',
            onPress: async () => {
              setSaving(true);
              
              const categoryKey = categoryId;
              
              // Eliminar de Firestore
              const configRef = doc(db, 'config', 'categoryBackgrounds');
              const updates = { [categoryKey]: null };
              await updateDoc(configRef, updates);
              
              // Actualizar estado local
              setCategoryBackgrounds(prev => {
                const updated = { ...prev };
                delete updated[categoryKey];
                return updated;
              });
              
              setSaving(false);
              Alert.alert('Éxito', 'Fondo eliminado correctamente');
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error eliminando fondo:', error);
      Alert.alert('Error', 'No se pudo eliminar el fondo');
      setSaving(false);
    }
  };

  // Abrir modal para editar título
  const openTitleEditor = (category) => {
    const categoryKey = category.id || 'all';
    const currentTitle = categoryTitles[categoryKey] || category.name;
    
    setEditingCategory(category);
    setEditingTitle(currentTitle);
    setTitleModalVisible(true);
  };

  // Guardar título personalizado
  const saveCategoryTitle = async () => {
    try {
      if (!editingCategory || !editingTitle.trim()) {
        Alert.alert('Error', 'El título no puede estar vacío');
        return;
      }

      setSaving(true);
      
      const categoryKey = editingCategory.id || 'all';
      
      // Guardar en Firestore
      const configRef = doc(db, 'config', 'categoryTitles');
      await updateDoc(configRef, {
        [categoryKey]: editingTitle.trim()
      }).catch(async (error) => {
        if (error.code === 'not-found') {
          await setDoc(configRef, {
            [categoryKey]: editingTitle.trim()
          });
        } else {
          throw error;
        }
      });
      
      // Actualizar estado local
      setCategoryTitles(prev => ({
        ...prev,
        [categoryKey]: editingTitle.trim()
      }));
      
      setTitleModalVisible(false);
      setEditingCategory(null);
      setEditingTitle('');
      setSaving(false);
      
      Alert.alert('Éxito', 'Título actualizado correctamente');
      
    } catch (error) {
      console.error('❌ Error guardando título:', error);
      Alert.alert('Error', 'No se pudo guardar el título');
      setSaving(false);
    }
  };

  // Restablecer título a default
  const resetCategoryTitle = async (category) => {
    try {
      Alert.alert(
        'Confirmar',
        `¿Restablecer el título a "${category.name}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Restablecer', 
            onPress: async () => {
              setSaving(true);
              
              const categoryKey = category.id || 'all';
              
              // Eliminar título personalizado de Firestore
              const configRef = doc(db, 'config', 'categoryTitles');
              const updates = { [categoryKey]: null };
              await updateDoc(configRef, updates);
              
              // Actualizar estado local
              setCategoryTitles(prev => {
                const updated = { ...prev };
                delete updated[categoryKey];
                return updated;
              });
              
              setSaving(false);
              Alert.alert('Éxito', 'Título restablecido correctamente');
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error restableciendo título:', error);
      Alert.alert('Error', 'No se pudo restablecer el título');
      setSaving(false);
    }
  };

  // Cargar configuraciones al iniciar
  useEffect(() => {
    loadConfigurations();
  }, []);

  // Renderizar categoría con preview
  const renderCategoryItem = (category) => {
    const categoryKey = category.id || 'all';
    const backgroundImage = categoryBackgrounds[categoryKey];
    const customTitle = categoryTitles[categoryKey] || category.name;
    const isUploading = uploadingCategory === category.id;
    const isStatic = category.isStatic;

    return (
      <AdminCard key={categoryKey} style={styles.categoryCard}>
        {/* Header con título y ancho */}
        <View style={styles.categoryHeader}>
          <View style={styles.categoryTitleContainer}>
            <View style={styles.categoryNameRow}>
              <Text style={styles.categoryName}>{category.name}</Text>
              {isStatic && (
                <View style={styles.staticBadge}>
                  <Text style={styles.staticBadgeText}>ESTÁTICO</Text>
                </View>
              )}
            </View>
            <Text style={styles.categoryDescription}>{category.description}</Text>
            <Text style={styles.categoryWidth}>Ancho: {category.width}px</Text>
          </View>
          <View style={styles.categoryActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openTitleEditor(category)}
            >
              <Ionicons name="create-outline" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Preview del botón como se verá en la tienda */}
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Preview (como se verá en la tienda):</Text>
          <View style={styles.previewWrapper}>
            <TouchableOpacity
              style={[
                styles.previewButton,
                { 
                  width: category.width,
                  backgroundColor: backgroundImage ? 'transparent' : category.defaultColor 
                }
              ]}
              disabled
            >
              {backgroundImage && !isStatic ? (
                <ImageBackground
                  source={{ uri: backgroundImage }}
                  style={styles.previewBackground}
                  imageStyle={styles.previewBackgroundImage}
                >
                  <View style={styles.previewOverlay}>
                    <Ionicons 
                      name="storefront-outline" 
                      size={20} 
                      color="#fff" 
                      style={styles.previewIcon}
                    />
                    <Text style={styles.previewTextWithBackground}>
                      {customTitle}
                    </Text>
                  </View>
                </ImageBackground>
              ) : (
                <View style={styles.previewContent}>
                  <Ionicons 
                    name="storefront-outline" 
                    size={20} 
                    color="#fff" 
                    style={styles.previewIcon}
                  />
                  <Text style={styles.previewText}>
                    {customTitle}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Título personalizado */}
        <View style={styles.titleSection}>
          <Text style={styles.sectionLabel}>Título personalizado:</Text>
          <View style={styles.titleRow}>
            <Text style={styles.currentTitle}>
              "{customTitle}"
            </Text>
            {categoryTitles[categoryKey] && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => resetCategoryTitle(category)}
              >
                <Ionicons name="refresh-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Configuración de fondo - SOLO para categorías no estáticas */}
        {!isStatic ? (
          <View style={styles.backgroundSection}>
            <Text style={styles.sectionLabel}>Imagen de fondo:</Text>
            
            {backgroundImage ? (
              <View style={styles.currentBackground}>
                <Image 
                  source={{ uri: backgroundImage }} 
                  style={styles.backgroundPreview}
                />
                <View style={styles.backgroundActions}>
                  <AdminButton
                    title="Cambiar"
                    onPress={() => selectImageForCategory(category.id)}
                    style={styles.changeButton}
                    disabled={isUploading}
                  />
                  <AdminButton
                    title="Eliminar"
                    onPress={() => removeCategoryBackground(category.id)}
                    style={styles.removeButton}
                    disabled={isUploading}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.noBackground}>
                <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                <Text style={styles.noBackgroundText}>Sin imagen de fondo</Text>
                <AdminButton
                  title={isUploading ? "Subiendo..." : "Configurar fondo"}
                  onPress={() => selectImageForCategory(category.id)}
                  disabled={isUploading}
                  icon={isUploading ? "cloud-upload-outline" : "add-outline"}
                />
              </View>
            )}
          </View>
        ) : (
          // Mensaje para categoría estática
          <View style={styles.staticSection}>
            <View style={styles.staticInfo}>
              <Ionicons name="lock-closed-outline" size={24} color="#6B7280" />
              <View style={styles.staticInfoContent}>
                <Text style={styles.staticInfoTitle}>Categoría Estática</Text>
                <Text style={styles.staticInfoText}>
                  Esta categoría mantiene su diseño original y no permite configurar imagen de fondo.
                  Solo puedes personalizar el título.
                </Text>
              </View>
            </View>
          </View>
        )}

        {isUploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.uploadingText}>Subiendo imagen...</Text>
          </View>
        )}
      </AdminCard>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AdminHeader 
          title="Configurar Categorías"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando configuraciones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader 
        title="Configurar Categorías"
        subtitle="Personaliza fondos y títulos de las categorías"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#3B82F6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Personalización de Categorías</Text>
            <Text style={styles.infoText}>
              Configura imágenes de fondo y títulos personalizados para cada categoría. 
              La categoría "Todos" es estática y solo permite cambiar el título.
              Los cambios se reflejarán inmediatamente en la tienda.
            </Text>
          </View>
        </View>

        {categories.map(renderCategoryItem)}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modal para editar título */}
      <Modal
        visible={titleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTitleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Título</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setTitleModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>
                Título para "{editingCategory?.name}":
              </Text>
              <TextInput
                style={styles.titleInput}
                value={editingTitle}
                onChangeText={setEditingTitle}
                placeholder={`Ej: ${editingCategory?.name}`}
                maxLength={20}
                autoFocus
              />
              <Text style={styles.inputHint}>
                Máximo 20 caracteres. Déjalo vacío para usar el título por defecto.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setTitleModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, saving && styles.modalSaveButtonDisabled]}
                onPress={saveCategoryTitle}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    padding: 16,
  },
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

  // Info card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },

  // Category cards
  categoryCard: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginRight: 8,
  },
  staticBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  staticBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  categoryWidth: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Preview
  previewContainer: {
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  previewWrapper: {
    alignItems: 'flex-start',
  },
  previewButton: {
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  previewBackgroundImage: {
    borderRadius: 20,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  previewContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  previewIcon: {
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  previewTextWithBackground: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Title section
  titleSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontStyle: 'italic',
    flex: 1,
  },
  resetButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },

  // Background section
  backgroundSection: {
    marginBottom: 16,
  },
  currentBackground: {
    alignItems: 'center',
  },
  backgroundPreview: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginBottom: 12,
  },
  backgroundActions: {
    flexDirection: 'row',
    gap: 12,
  },
  changeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  removeButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  noBackground: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  noBackgroundText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 16,
  },

  // Static section
  staticSection: {
    marginBottom: 16,
  },
  staticInfo: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  staticInfoContent: {
    flex: 1,
    marginLeft: 12,
  },
  staticInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  staticInfoText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },

  // Uploading overlay
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  uploadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalSaveButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },

  bottomSpacing: {
    height: 40,
  },
});

export default AdminCategoryBackgroundsScreen;
