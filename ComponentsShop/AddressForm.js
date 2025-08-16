import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddressForm = ({ 
  onSubmit, 
  initialData = null,
  loading = false,
  style,
  showSaveOption = true 
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Argentina',
    phone: '',
    isDefault: false,
    saveAddress: false,
  });

  const [errors, setErrors] = useState({});
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // ✅ CARGAR DATOS INICIALES Y DIRECCIONES GUARDADAS
  useEffect(() => {
    initializeForm();
  }, [initialData]);

  const initializeForm = async () => {
    setLoadingAddresses(true);
    
    try {
      // Cargar direcciones guardadas
      await loadSavedAddresses();
      
      // Si hay datos iniciales, usarlos
      if (initialData) {
        setFormData({ ...formData, ...initialData });
      } else {
        // Si no hay datos iniciales, intentar cargar la dirección por defecto
        await loadDefaultAddress();
      }
    } catch (error) {
      console.error('Error initializing form:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // ✅ CARGAR DIRECCIONES GUARDADAS CON MANEJO DE ERRORES
  const loadSavedAddresses = async () => {
    try {
      const addresses = await AsyncStorage.getItem('savedAddresses');
      if (addresses) {
        const parsedAddresses = JSON.parse(addresses);
        // Validar que es un array
        if (Array.isArray(parsedAddresses)) {
          setSavedAddresses(parsedAddresses);
          console.log('📍 Direcciones cargadas:', parsedAddresses.length);
        }
      }
    } catch (error) {
      console.error('Error loading saved addresses:', error);
      setSavedAddresses([]);
    }
  };

  // ✅ CARGAR DIRECCIÓN POR DEFECTO
  const loadDefaultAddress = async () => {
    try {
      const addresses = await AsyncStorage.getItem('savedAddresses');
      if (addresses) {
        const parsedAddresses = JSON.parse(addresses);
        const defaultAddress = parsedAddresses.find(addr => addr.isDefault);
        
        if (defaultAddress) {
          console.log('📍 Cargando dirección por defecto');
          setFormData({ 
            ...formData, 
            ...defaultAddress,
            saveAddress: false, // No volver a guardar una dirección ya guardada
          });
        }
      }
    } catch (error) {
      console.error('Error loading default address:', error);
    }
  };

  // ✅ GUARDAR DIRECCIÓN CON VALIDACIÓN Y LÍMITES
  const saveAddress = async (addressData) => {
    try {
      const addresses = [...savedAddresses];
      
      // Crear nueva dirección con ID único
      const newAddress = {
        id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...addressData,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      };

      // Si es dirección por defecto, quitar el flag de las demás
      if (newAddress.isDefault) {
        addresses.forEach(addr => addr.isDefault = false);
      }

      // Verificar si ya existe una dirección similar
      const existingIndex = addresses.findIndex(addr => 
        addr.address1.toLowerCase() === newAddress.address1.toLowerCase() &&
        addr.city.toLowerCase() === newAddress.city.toLowerCase() &&
        addr.postalCode === newAddress.postalCode
      );

      if (existingIndex !== -1) {
        // Actualizar dirección existente
        addresses[existingIndex] = { ...addresses[existingIndex], ...newAddress };
        console.log('📍 Dirección actualizada');
      } else {
        // Agregar nueva dirección al inicio
        addresses.unshift(newAddress);
        console.log('📍 Nueva dirección guardada');
      }
      
      // Mantener solo las últimas 10 direcciones
      const limitedAddresses = addresses.slice(0, 10);
      
      await AsyncStorage.setItem('savedAddresses', JSON.stringify(limitedAddresses));
      setSavedAddresses(limitedAddresses);
      
      return true;
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'No se pudo guardar la dirección');
      return false;
    }
  };

  // ✅ ELIMINAR DIRECCIÓN
  const deleteAddress = async (addressId) => {
    try {
      const updatedAddresses = savedAddresses.filter(addr => addr.id !== addressId);
      await AsyncStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
      setSavedAddresses(updatedAddresses);
      console.log('📍 Dirección eliminada');
    } catch (error) {
      console.error('Error deleting address:', error);
      Alert.alert('Error', 'No se pudo eliminar la dirección');
    }
  };

  // ✅ VALIDACIÓN MEJORADA DEL FORMULARIO
  const validateForm = () => {
    const newErrors = {};

    // Validaciones obligatorias
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'El apellido debe tener al menos 2 caracteres';
    }

    if (!formData.address1.trim()) {
      newErrors.address1 = 'La dirección es requerida';
    } else if (formData.address1.trim().length < 5) {
      newErrors.address1 = 'La dirección debe ser más específica';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    } else if (formData.city.trim().length < 2) {
      newErrors.city = 'Nombre de ciudad inválido';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'La provincia/estado es requerida';
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'El código postal es requerido';
    } else if (!/^[0-9]{4,8}$/.test(formData.postalCode.trim())) {
      newErrors.postalCode = 'Código postal inválido (4-8 dígitos)';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Formato de teléfono inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ MANEJAR ENVÍO DEL FORMULARIO
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    const addressData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      company: formData.company.trim(),
      address1: formData.address1.trim(),
      address2: formData.address2.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      postalCode: formData.postalCode.trim(),
      country: formData.country.trim(),
      phone: formData.phone.trim(),
      isDefault: formData.isDefault,
    };

    // Guardar dirección si se solicitó
    if (showSaveOption && formData.saveAddress) {
      const saved = await saveAddress(addressData);
      if (saved) {
        Alert.alert(
          'Éxito', 
          formData.isDefault 
            ? 'Dirección guardada como predeterminada' 
            : 'Dirección guardada correctamente'
        );
      }
    }

    // Actualizar última vez usada si es una dirección existente
    if (formData.id) {
      await updateLastUsed(formData.id);
    }

    onSubmit && onSubmit(addressData);
  };

  // ✅ ACTUALIZAR ÚLTIMA VEZ USADA
  const updateLastUsed = async (addressId) => {
    try {
      const updatedAddresses = savedAddresses.map(addr => 
        addr.id === addressId 
          ? { ...addr, lastUsed: new Date().toISOString() }
          : addr
      );
      await AsyncStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
      setSavedAddresses(updatedAddresses);
    } catch (error) {
      console.error('Error updating last used:', error);
    }
  };

  // ✅ SELECCIONAR DIRECCIÓN GUARDADA
  const selectSavedAddress = (address) => {
    setFormData({
      ...formData,
      ...address,
      saveAddress: false, // No volver a guardar una dirección ya guardada
    });
    setShowSavedAddresses(false);
    setErrors({});
    
    // Actualizar última vez usada
    updateLastUsed(address.id);
  };

  // Actualizar campo del formulario
  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // ✅ RENDERIZAR CAMPO DE ENTRADA CON VALIDACIÓN VISUAL
  const renderInput = (field, label, options = {}) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}
        {options.required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          errors[field] && styles.inputError,
          formData[field] && !errors[field] && styles.inputValid,
        ]}
        value={formData[field]}
        onChangeText={(value) => updateField(field, value)}
        placeholder={options.placeholder || `Ingresa ${label.toLowerCase()}`}
        keyboardType={options.keyboardType || 'default'}
        autoCapitalize={options.autoCapitalize || 'words'}
        editable={!loading}
        multiline={options.multiline}
        numberOfLines={options.numberOfLines}
        maxLength={options.maxLength}
      />
      {errors[field] && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color="#EF4444" />
          <Text style={styles.errorText}>{errors[field]}</Text>
        </View>
      )}
    </View>
  );

  // ✅ RENDERIZAR DIRECCIONES GUARDADAS CON OPCIONES
  const renderSavedAddresses = () => (
    <View style={styles.savedAddressesContainer}>
      <Text style={styles.savedAddressesTitle}>Direcciones Guardadas</Text>
      
      {savedAddresses.map((address) => (
        <View key={address.id} style={styles.savedAddressItem}>
          <TouchableOpacity
            style={styles.savedAddressContent}
            onPress={() => selectSavedAddress(address)}
          >
            <View style={styles.savedAddressInfo}>
              <Text style={styles.savedAddressName}>
                {address.firstName} {address.lastName}
              </Text>
              <Text style={styles.savedAddressDetails}>
                {address.address1}
              </Text>
              <Text style={styles.savedAddressDetails}>
                {address.city}, {address.state} {address.postalCode}
              </Text>
              <Text style={styles.savedAddressPhone}>
                {address.phone}
              </Text>
              
              <View style={styles.savedAddressBadges}>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Por defecto</Text>
                  </View>
                )}
                <Text style={styles.lastUsedText}>
                  Usado: {new Date(address.lastUsed || address.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteAddressButton}
            onPress={() => {
              Alert.alert(
                'Eliminar Dirección',
                '¿Estás seguro de que quieres eliminar esta dirección?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive', onPress: () => deleteAddress(address.id) },
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Dirección de Envío</Text>
        
        {savedAddresses.length > 0 && (
          <TouchableOpacity
            style={styles.savedAddressesButton}
            onPress={() => setShowSavedAddresses(!showSavedAddresses)}
            disabled={loadingAddresses}
          >
            {loadingAddresses ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <>
                <Ionicons 
                  name={showSavedAddresses ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#3B82F6" 
                />
                <Text style={styles.savedAddressesText}>
                  Direcciones ({savedAddresses.length})
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* ✅ DIRECCIONES GUARDADAS */}
        {showSavedAddresses && savedAddresses.length > 0 && renderSavedAddresses()}

        {/* ✅ FORMULARIO MEJORADO */}
        <View style={styles.formContainer}>
          {/* Nombre y apellido */}
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              {renderInput('firstName', 'Nombre', { required: true, maxLength: 50 })}
            </View>
            <View style={styles.inputHalf}>
              {renderInput('lastName', 'Apellido', { required: true, maxLength: 50 })}
            </View>
          </View>

          {/* Empresa (opcional) */}
          {renderInput('company', 'Empresa', { 
            placeholder: 'Opcional',
            maxLength: 100,
          })}

          {/* Dirección */}
          {renderInput('address1', 'Dirección', { 
            required: true,
            placeholder: 'Calle y número',
            maxLength: 200,
          })}

          {renderInput('address2', 'Dirección 2', { 
            placeholder: 'Apartamento, piso, etc. (opcional)',
            maxLength: 100,
          })}

          {/* Ciudad y provincia */}
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              {renderInput('city', 'Ciudad', { required: true, maxLength: 50 })}
            </View>
            <View style={styles.inputHalf}>
              {renderInput('state', 'Provincia', { required: true, maxLength: 50 })}
            </View>
          </View>

          {/* Código postal y país */}
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              {renderInput('postalCode', 'Código Postal', { 
                required: true,
                keyboardType: 'numeric',
                maxLength: 8,
              })}
            </View>
            <View style={styles.inputHalf}>
              {renderInput('country', 'País', { required: true, maxLength: 50 })}
            </View>
          </View>

          {/* Teléfono */}
          {renderInput('phone', 'Teléfono', { 
            required: true,
            keyboardType: 'phone-pad',
            placeholder: '+54 11 1234-5678',
            maxLength: 20,
          })}

          {/* ✅ OPCIONES MEJORADAS */}
          {showSaveOption && (
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => updateField('saveAddress', !formData.saveAddress)}
              >
                <View style={[
                  styles.checkbox,
                  formData.saveAddress && styles.checkboxChecked
                ]}>
                  {formData.saveAddress && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  Guardar esta dirección para futuros pedidos
                </Text>
              </TouchableOpacity>

              {formData.saveAddress && (
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => updateField('isDefault', !formData.isDefault)}
                >
                  <View style={[
                    styles.checkbox,
                    formData.isDefault && styles.checkboxChecked
                  ]}>
                    {formData.isDefault && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    Usar como dirección por defecto
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ✅ BOTÓN DE ENVÍO MEJORADO */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="location-outline" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Confirmar Dirección</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 700,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  savedAddressesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savedAddressesText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  
  // ✅ DIRECCIONES GUARDADAS MEJORADAS
  savedAddressesContainer: {
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
  },
  savedAddressesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  savedAddressItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  savedAddressContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  savedAddressInfo: {
    flex: 1,
  },
  savedAddressName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  savedAddressDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  savedAddressPhone: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  savedAddressBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  lastUsedText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  deleteAddressButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },
  
  // ✅ FORMULARIO MEJORADO
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputValid: {
    borderColor: '#10B981',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
  },
  
  // ✅ OPCIONES
  optionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  
  // ✅ BOTÓN DE ENVÍO
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddressForm;
