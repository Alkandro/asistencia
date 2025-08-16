// AddressManagementScreen.js - Gestión completa de direcciones de envío
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import AddressForm from './AddressForm';

const AddressManagementScreen = () => {
  const navigation = useNavigation();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // ✅ CARGAR DIRECCIONES AL INICIAR
  useEffect(() => {
    loadAddresses();
  }, []);

  // ✅ CARGAR DIRECCIONES DESDE ASYNCSTORAGE
  const loadAddresses = async () => {
    try {
      setLoading(true);
      const savedAddresses = await AsyncStorage.getItem('savedAddresses');
      
      if (savedAddresses) {
        const parsedAddresses = JSON.parse(savedAddresses);
        if (Array.isArray(parsedAddresses)) {
          // Ordenar por: por defecto primero, luego por última vez usada
          const sortedAddresses = parsedAddresses.sort((a, b) => {
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;
            
            const aLastUsed = new Date(a.lastUsed || a.createdAt);
            const bLastUsed = new Date(b.lastUsed || b.createdAt);
            return bLastUsed - aLastUsed;
          });
          
          setAddresses(sortedAddresses);
          console.log('📍 Direcciones cargadas:', sortedAddresses.length);
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      Alert.alert('Error', 'No se pudieron cargar las direcciones');
    } finally {
      setLoading(false);
    }
  };

  // ✅ GUARDAR DIRECCIONES EN ASYNCSTORAGE
  const saveAddresses = async (updatedAddresses) => {
    try {
      await AsyncStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
      setAddresses(updatedAddresses);
      console.log('📍 Direcciones guardadas:', updatedAddresses.length);
    } catch (error) {
      console.error('Error saving addresses:', error);
      Alert.alert('Error', 'No se pudieron guardar las direcciones');
    }
  };

  // ✅ MANEJAR NUEVA DIRECCIÓN O EDICIÓN
  const handleAddressSubmit = async (addressData) => {
    try {
      setFormLoading(true);
      let updatedAddresses = [...addresses];

      if (editingAddress) {
        // ✅ EDITAR DIRECCIÓN EXISTENTE
        const index = updatedAddresses.findIndex(addr => addr.id === editingAddress.id);
        if (index !== -1) {
          updatedAddresses[index] = {
            ...updatedAddresses[index],
            ...addressData,
            lastUsed: new Date().toISOString(),
          };
          
          // Si se marca como por defecto, quitar el flag de las demás
          if (addressData.isDefault) {
            updatedAddresses.forEach((addr, i) => {
              if (i !== index) addr.isDefault = false;
            });
          }
        }
      } else {
        // ✅ NUEVA DIRECCIÓN
        const newAddress = {
          id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...addressData,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
        };

        // Si es por defecto, quitar el flag de las demás
        if (newAddress.isDefault) {
          updatedAddresses.forEach(addr => addr.isDefault = false);
        }

        updatedAddresses.unshift(newAddress);
        
        // Mantener solo las últimas 10 direcciones
        updatedAddresses = updatedAddresses.slice(0, 10);
      }

      await saveAddresses(updatedAddresses);
      setShowAddForm(false);
      setEditingAddress(null);
      
      Alert.alert(
        'Éxito',
        editingAddress ? 'Dirección actualizada correctamente' : 'Dirección guardada correctamente'
      );
    } catch (error) {
      console.error('Error handling address:', error);
      Alert.alert('Error', 'No se pudo procesar la dirección');
    } finally {
      setFormLoading(false);
    }
  };

  // ✅ ELIMINAR DIRECCIÓN
  const handleDeleteAddress = (addressId) => {
    Alert.alert(
      'Eliminar Dirección',
      '¿Estás seguro de que quieres eliminar esta dirección?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
              await saveAddresses(updatedAddresses);
              Alert.alert('Éxito', 'Dirección eliminada correctamente');
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'No se pudo eliminar la dirección');
            }
          },
        },
      ]
    );
  };

  // ✅ MARCAR COMO POR DEFECTO
  const handleSetDefault = async (addressId) => {
    try {
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId,
        lastUsed: addr.id === addressId ? new Date().toISOString() : addr.lastUsed,
      }));

      await saveAddresses(updatedAddresses);
      Alert.alert('Éxito', 'Dirección marcada como predeterminada');
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert('Error', 'No se pudo marcar como predeterminada');
    }
  };

  // ✅ EDITAR DIRECCIÓN
  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowAddForm(true);
  };

  // ✅ RENDERIZAR TARJETA DE DIRECCIÓN
  const renderAddressCard = (address) => (
    <View key={address.id} style={styles.addressCard}>
      {/* ✅ HEADER CON BADGES */}
      <View style={styles.addressHeader}>
        <View style={styles.addressHeaderLeft}>
          <Text style={styles.addressName}>
            {address.firstName} {address.lastName}
          </Text>
          {address.isDefault && (
            <View style={styles.defaultBadge}>
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={styles.defaultBadgeText}>Por defecto</Text>
            </View>
          )}
        </View>
        
        <View style={styles.addressActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditAddress(address)}
          >
            <Ionicons name="pencil" size={16} color="#3B82F6" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteAddress(address.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ INFORMACIÓN DE LA DIRECCIÓN */}
      <View style={styles.addressInfo}>
        {address.company && (
          <Text style={styles.addressCompany}>{address.company}</Text>
        )}
        
        <Text style={styles.addressStreet}>{address.address1}</Text>
        
        {address.address2 && (
          <Text style={styles.addressStreet}>{address.address2}</Text>
        )}
        
        <Text style={styles.addressCity}>
          {address.city}, {address.state} {address.postalCode}
        </Text>
        
        <Text style={styles.addressCountry}>{address.country}</Text>
        
        <View style={styles.addressContact}>
          <Ionicons name="call-outline" size={14} color="#6B7280" />
          <Text style={styles.addressPhone}>{address.phone}</Text>
        </View>
      </View>

      {/* ✅ ACCIONES ADICIONALES */}
      <View style={styles.addressFooter}>
        {!address.isDefault && (
          <TouchableOpacity
            style={styles.setDefaultButton}
            onPress={() => handleSetDefault(address.id)}
          >
            <Ionicons name="star-outline" size={14} color="#6B7280" />
            <Text style={styles.setDefaultText}>Marcar como predeterminada</Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.lastUsedText}>
          Última vez usada: {new Date(address.lastUsed || address.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  // ✅ RENDERIZAR ESTADO VACÍO
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="location-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No tienes direcciones guardadas</Text>
      <Text style={styles.emptyStateSubtitle}>
        Agrega una dirección para hacer tus compras más rápidas
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => setShowAddForm(true)}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.emptyStateButtonText}>Agregar Primera Dirección</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Mis Direcciones</Text>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingAddress(null);
            setShowAddForm(true);
          }}
        >
          <Ionicons name="add" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* ✅ CONTENIDO PRINCIPAL */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando direcciones...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {addresses.length > 0 ? (
            <>
              {/* ✅ INFORMACIÓN SUPERIOR */}
              <View style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Ionicons name="information-circle" size={20} color="#3B82F6" />
                  <Text style={styles.infoTitle}>Gestión de Direcciones</Text>
                </View>
                <Text style={styles.infoText}>
                  Tienes {addresses.length} direcciones guardadas. 
                  {addresses.find(addr => addr.isDefault) 
                    ? ' Una está marcada como predeterminada.' 
                    : ' Marca una como predeterminada para checkout más rápido.'}
                </Text>
              </View>

              {/* ✅ LISTA DE DIRECCIONES */}
              {addresses.map(renderAddressCard)}
            </>
          ) : (
            renderEmptyState()
          )}
        </ScrollView>
      )}

      {/* ✅ MODAL DE FORMULARIO */}
      <Modal
        visible={showAddForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowAddForm(false);
          setEditingAddress(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowAddForm(false);
                setEditingAddress(null);
              }}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>
              {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
            </Text>
            
            <View style={{ width: 24 }} />
          </View>

          <AddressForm
            initialData={editingAddress}
            onSubmit={handleAddressSubmit}
            loading={formLoading}
            showSaveOption={!editingAddress} // Solo mostrar opción de guardar para nuevas direcciones
            style={styles.addressForm}
          />
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
  
  // ✅ HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    padding: 8,
  },

  // ✅ LOADING
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },

  // ✅ SCROLL CONTAINER
  scrollContainer: {
    flex: 1,
    padding: 16,
  },

  // ✅ INFO CARD
  infoCard: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },

  // ✅ ADDRESS CARD
  addressCard: {
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
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },

  // ✅ ADDRESS INFO
  addressInfo: {
    marginBottom: 12,
  },
  addressCompany: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  addressStreet: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  addressCity: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  addressCountry: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  addressContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressPhone: {
    fontSize: 14,
    color: '#6B7280',
  },

  // ✅ ADDRESS FOOTER
  addressFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    gap: 8,
  },
  setDefaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  setDefaultText: {
    fontSize: 12,
    color: '#6B7280',
  },
  lastUsedText: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  // ✅ EMPTY STATE
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // ✅ MODAL
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  addressForm: {
    flex: 1,
    margin: 16,
  },
});

export default AddressManagementScreen;
