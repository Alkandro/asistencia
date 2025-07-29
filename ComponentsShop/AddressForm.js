// AddressForm.js - Componente de formulario de dirección individual
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

  // Cargar datos iniciales
  useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData });
    }
    loadSavedAddresses();
  }, [initialData]);

  // Cargar direcciones guardadas
  const loadSavedAddresses = async () => {
    try {
      const addresses = await AsyncStorage.getItem('savedAddresses');
      if (addresses) {
        setSavedAddresses(JSON.parse(addresses));
      }
    } catch (error) {
      console.error('Error loading saved addresses:', error);
    }
  };

  // Guardar dirección
  const saveAddress = async (addressData) => {
    try {
      const addresses = [...savedAddresses];
      const newAddress = {
        id: Date.now().toString(),
        ...addressData,
        createdAt: new Date().toISOString(),
      };

      // Si es dirección por defecto, quitar el flag de las demás
      if (newAddress.isDefault) {
        addresses.forEach(addr => addr.isDefault = false);
      }

      addresses.unshift(newAddress);
      
      // Mantener solo las últimas 5 direcciones
      const limitedAddresses = addresses.slice(0, 5);
      
      await AsyncStorage.setItem('savedAddresses', JSON.stringify(limitedAddresses));
      setSavedAddresses(limitedAddresses);
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!formData.address1.trim()) {
      newErrors.address1 = 'La dirección es requerida';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'La provincia/estado es requerida';
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'El código postal es requerido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Formato de teléfono inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    const addressData = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      company: formData.company.trim(),
      address1: formData.address1.trim(),
      address2: formData.address2.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      postalCode: formData.postalCode.trim(),
      phone: formData.phone.trim(),
    };

    // Guardar dirección si se solicitó
    if (showSaveOption && formData.saveAddress) {
      await saveAddress(addressData);
    }

    onSubmit && onSubmit(addressData);
  };

  // Seleccionar dirección guardada
  const selectSavedAddress = (address) => {
    setFormData({
      ...formData,
      ...address,
      saveAddress: false, // No volver a guardar una dirección ya guardada
    });
    setShowSavedAddresses(false);
    setErrors({});
  };

  // Actualizar campo del formulario
  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // Renderizar campo de entrada
  const renderInput = (field, label, options = {}) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}
        {options.required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          errors[field] && styles.inputError
        ]}
        value={formData[field]}
        onChangeText={(value) => updateField(field, value)}
        placeholder={options.placeholder || `Ingresa ${label.toLowerCase()}`}
        keyboardType={options.keyboardType || 'default'}
        autoCapitalize={options.autoCapitalize || 'words'}
        editable={!loading}
        multiline={options.multiline}
        numberOfLines={options.numberOfLines}
      />
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
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
          >
            <Ionicons 
              name={showSavedAddresses ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#3B82F6" 
            />
            <Text style={styles.savedAddressesText}>
              Direcciones guardadas ({savedAddresses.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Direcciones guardadas */}
        {showSavedAddresses && savedAddresses.length > 0 && (
          <View style={styles.savedAddressesContainer}>
            {savedAddresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={styles.savedAddressItem}
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
                  {address.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Por defecto</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Formulario */}
        <View style={styles.formContainer}>
          {/* Nombre y apellido */}
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              {renderInput('firstName', 'Nombre', { required: true })}
            </View>
            <View style={styles.inputHalf}>
              {renderInput('lastName', 'Apellido', { required: true })}
            </View>
          </View>

          {/* Empresa (opcional) */}
          {renderInput('company', 'Empresa', { placeholder: 'Opcional' })}

          {/* Dirección */}
          {renderInput('address1', 'Dirección', { 
            required: true,
            placeholder: 'Calle y número'
          })}

          {renderInput('address2', 'Dirección 2', { 
            placeholder: 'Apartamento, piso, etc. (opcional)'
          })}

          {/* Ciudad y provincia */}
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              {renderInput('city', 'Ciudad', { required: true })}
            </View>
            <View style={styles.inputHalf}>
              {renderInput('state', 'Provincia', { required: true })}
            </View>
          </View>

          {/* Código postal y país */}
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              {renderInput('postalCode', 'Código Postal', { 
                required: true,
                keyboardType: 'numeric'
              })}
            </View>
            <View style={styles.inputHalf}>
              {renderInput('country', 'País', { required: true })}
            </View>
          </View>

          {/* Teléfono */}
          {renderInput('phone', 'Teléfono', { 
            required: true,
            keyboardType: 'phone-pad',
            placeholder: '+54 11 1234-5678'
          })}

          {/* Opciones */}
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

      {/* Botón de envío */}
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
    maxHeight: 600,
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
  
  // Saved Addresses
  savedAddressesContainer: {
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
  },
  savedAddressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
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
  defaultBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  
  // Form
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
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  
  // Options
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
  
  // Submit Button
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

