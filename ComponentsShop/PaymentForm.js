// PaymentForm_ENHANCED.js - Componente mejorado con almacenamiento local seguro
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PaymentForm = ({ 
  onSubmit, 
  loading = false,
  style 
}) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    saveCard: false,
  });

  const [errors, setErrors] = useState({});
  const [savedCards, setSavedCards] = useState([]);
  const [showSavedCards, setShowSavedCards] = useState(false);
  const [cardType, setCardType] = useState('');
  const [loadingCards, setLoadingCards] = useState(false);

  // ✅ CARGAR DATOS INICIALES
  useEffect(() => {
    initializeForm();
  }, []);

  const initializeForm = async () => {
    setLoadingCards(true);
    
    try {
      await loadSavedCards();
      await loadSavedCardholderName();
    } catch (error) {
      console.error('Error initializing payment form:', error);
    } finally {
      setLoadingCards(false);
    }
  };

  // ✅ CARGAR TARJETAS GUARDADAS (SOLO METADATOS SEGUROS)
  const loadSavedCards = async () => {
    try {
      const cards = await AsyncStorage.getItem('savedCards');
      if (cards) {
        const parsedCards = JSON.parse(cards);
        if (Array.isArray(parsedCards)) {
          setSavedCards(parsedCards);
          console.log('💳 Tarjetas cargadas:', parsedCards.length);
        }
      }
    } catch (error) {
      console.error('Error loading saved cards:', error);
      setSavedCards([]);
    }
  };

  // ✅ CARGAR NOMBRE DEL TITULAR GUARDADO
  const loadSavedCardholderName = async () => {
    try {
      const savedName = await AsyncStorage.getItem('savedCardholderName');
      if (savedName) {
        setFormData(prev => ({ ...prev, cardholderName: savedName }));
      }
    } catch (error) {
      console.error('Error loading cardholder name:', error);
    }
  };

  // ✅ DETECTAR TIPO DE TARJETA
  const detectCardType = (number) => {
    const cleaned = number.replace(/\s/g, '');
    
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6/.test(cleaned)) return 'discover';
    
    return '';
  };

  // ✅ FORMATEAR NÚMERO DE TARJETA
  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s/g, '');
    const type = detectCardType(cleaned);
    setCardType(type);
    
    // Formato específico para American Express (4-6-5)
    if (type === 'amex') {
      const match = cleaned.match(/(\d{0,4})(\d{0,6})(\d{0,5})/);
      return match ? [match[1], match[2], match[3]].filter(Boolean).join(' ') : cleaned;
    }
    
    // Formato estándar (4-4-4-4)
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : cleaned;
  };

  // ✅ FORMATEAR FECHA DE VENCIMIENTO
  const formatExpiryDate = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      const month = cleaned.substring(0, 2);
      const year = cleaned.substring(2, 4);
      
      // Validar mes
      if (parseInt(month) > 12) {
        return '12/' + year;
      }
      
      return month + (year ? '/' + year : '');
    }
    return cleaned;
  };

  // ✅ VALIDACIÓN COMPLETA DEL FORMULARIO
  const validateForm = () => {
    const newErrors = {};

    // Validar nombre del titular
    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'El nombre del titular es requerido';
    } else if (formData.cardholderName.trim().length < 3) {
      newErrors.cardholderName = 'El nombre debe tener al menos 3 caracteres';
    }

    // Validar número de tarjeta
    const cardNumber = formData.cardNumber.replace(/\s/g, '');
    if (!cardNumber) {
      newErrors.cardNumber = 'El número de tarjeta es requerido';
    } else if (cardNumber.length < 13 || cardNumber.length > 19) {
      newErrors.cardNumber = 'Número de tarjeta inválido';
    } else if (!isValidCardNumber(cardNumber)) {
      newErrors.cardNumber = 'Número de tarjeta inválido (verificación Luhn)';
    }

    // Validar fecha de vencimiento
    if (!formData.expiryDate || formData.expiryDate.length < 5) {
      newErrors.expiryDate = 'La fecha de vencimiento es requerida';
    } else {
      const [month, year] = formData.expiryDate.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        newErrors.expiryDate = 'Mes inválido';
      } else if (parseInt(year) < currentYear || 
                (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        newErrors.expiryDate = 'La tarjeta ha expirado';
      }
    }

    // Validar CVV
    if (!formData.cvv) {
      newErrors.cvv = 'El CVV es requerido';
    } else if (cardType === 'amex' && formData.cvv.length !== 4) {
      newErrors.cvv = 'CVV debe tener 4 dígitos para American Express';
    } else if (cardType !== 'amex' && formData.cvv.length !== 3) {
      newErrors.cvv = 'CVV debe tener 3 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ ALGORITMO DE LUHN PARA VALIDAR TARJETA
  const isValidCardNumber = (number) => {
    let sum = 0;
    let shouldDouble = false;
    
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i));
      
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    return sum % 10 === 0;
  };

  // ✅ GUARDAR METADATOS DE TARJETA (SIN DATOS SENSIBLES)
  const saveCardMetadata = async (cardData) => {
    try {
      const cardMetadata = {
        id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        lastFourDigits: cardData.cardNumber.slice(-4),
        cardType: detectCardType(cardData.cardNumber),
        expiryMonth: cardData.expiryDate.split('/')[0],
        expiryYear: cardData.expiryDate.split('/')[1],
        cardholderName: cardData.cardholderName,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      };

      const cards = [...savedCards];
      
      // Verificar si ya existe una tarjeta similar
      const existingIndex = cards.findIndex(card => 
        card.lastFourDigits === cardMetadata.lastFourDigits &&
        card.expiryMonth === cardMetadata.expiryMonth &&
        card.expiryYear === cardMetadata.expiryYear
      );

      if (existingIndex !== -1) {
        // Actualizar tarjeta existente
        cards[existingIndex] = { ...cards[existingIndex], ...cardMetadata };
      } else {
        // Agregar nueva tarjeta
        cards.unshift(cardMetadata);
      }
      
      // Mantener solo las últimas 5 tarjetas
      const limitedCards = cards.slice(0, 5);
      
      await AsyncStorage.setItem('savedCards', JSON.stringify(limitedCards));
      setSavedCards(limitedCards);
      
      // Guardar nombre del titular por separado
      await AsyncStorage.setItem('savedCardholderName', cardData.cardholderName);
      
      console.log('💳 Metadatos de tarjeta guardados');
      return true;
    } catch (error) {
      console.error('Error saving card metadata:', error);
      return false;
    }
  };

  // ✅ ELIMINAR TARJETA GUARDADA
  const deleteCard = async (cardId) => {
    try {
      const updatedCards = savedCards.filter(card => card.id !== cardId);
      await AsyncStorage.setItem('savedCards', JSON.stringify(updatedCards));
      setSavedCards(updatedCards);
      console.log('💳 Tarjeta eliminada');
    } catch (error) {
      console.error('Error deleting card:', error);
      Alert.alert('Error', 'No se pudo eliminar la tarjeta');
    }
  };

  // ✅ SELECCIONAR TARJETA GUARDADA
  const selectSavedCard = (card) => {
    setFormData({
      ...formData,
      cardholderName: card.cardholderName,
      // NO cargar datos sensibles, solo el nombre
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      saveCard: false,
    });
    setShowSavedCards(false);
    setErrors({});
    
    Alert.alert(
      'Tarjeta Seleccionada',
      `Tarjeta terminada en ${card.lastFourDigits}. Por seguridad, debes ingresar nuevamente el número completo, fecha de vencimiento y CVV.`,
      [{ text: 'Entendido' }]
    );
  };

  // ✅ MANEJAR ENVÍO DEL FORMULARIO
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    const paymentData = {
      cardNumber: formData.cardNumber.replace(/\s/g, ''),
      expiryDate: formData.expiryDate,
      cvv: formData.cvv,
      cardholderName: formData.cardholderName.trim(),
      cardType: detectCardType(formData.cardNumber),
    };

    // Guardar metadatos si se solicitó
    if (formData.saveCard) {
      const saved = await saveCardMetadata(paymentData);
      if (saved) {
        Alert.alert('Éxito', 'Información de la tarjeta guardada de forma segura');
      }
    }

    onSubmit && onSubmit(paymentData);
  };

  // Actualizar campo del formulario
  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // ✅ OBTENER ICONO DE TARJETA
  const getCardIcon = (type) => {
    switch (type) {
      case 'visa': return 'card';
      case 'mastercard': return 'card';
      case 'amex': return 'card';
      case 'discover': return 'card';
      default: return 'card-outline';
    }
  };

  // ✅ RENDERIZAR TARJETAS GUARDADAS
  const renderSavedCards = () => (
    <View style={styles.savedCardsContainer}>
      <Text style={styles.savedCardsTitle}>Tarjetas Guardadas</Text>
      
      {savedCards.map((card) => (
        <View key={card.id} style={styles.savedCardItem}>
          <TouchableOpacity
            style={styles.savedCardContent}
            onPress={() => selectSavedCard(card)}
          >
            <View style={styles.savedCardIcon}>
              <Ionicons name={getCardIcon(card.cardType)} size={24} color="#3B82F6" />
            </View>
            
            <View style={styles.savedCardInfo}>
              <Text style={styles.savedCardName}>
                {card.cardholderName}
              </Text>
              <Text style={styles.savedCardNumber}>
                •••• •••• •••• {card.lastFourDigits}
              </Text>
              <Text style={styles.savedCardExpiry}>
                Vence: {card.expiryMonth}/{card.expiryYear}
              </Text>
            </View>
            
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteCardButton}
            onPress={() => {
              Alert.alert(
                'Eliminar Tarjeta',
                '¿Estás seguro de que quieres eliminar esta tarjeta guardada?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive', onPress: () => deleteCard(card.id) },
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
        <Text style={styles.title}>Información de Pago</Text>
        
        {savedCards.length > 0 && (
          <TouchableOpacity
            style={styles.savedCardsButton}
            onPress={() => setShowSavedCards(!showSavedCards)}
            disabled={loadingCards}
          >
            {loadingCards ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <>
                <Ionicons 
                  name={showSavedCards ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#3B82F6" 
                />
                <Text style={styles.savedCardsText}>
                  Tarjetas ({savedCards.length})
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* ✅ TARJETAS GUARDADAS */}
        {showSavedCards && savedCards.length > 0 && renderSavedCards()}

        {/* ✅ FORMULARIO DE PAGO */}
        <View style={styles.formContainer}>
          {/* Nombre del titular */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Titular *</Text>
            <TextInput
              style={[
                styles.input,
                errors.cardholderName && styles.inputError,
                formData.cardholderName && !errors.cardholderName && styles.inputValid,
              ]}
              value={formData.cardholderName}
              onChangeText={(text) => updateField('cardholderName', text)}
              placeholder="Nombre completo como aparece en la tarjeta"
              autoCapitalize="words"
              editable={!loading}
              maxLength={50}
            />
            {errors.cardholderName && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{errors.cardholderName}</Text>
              </View>
            )}
          </View>

          {/* Número de tarjeta */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número de Tarjeta *</Text>
            <View style={styles.cardInputContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.cardInput,
                  errors.cardNumber && styles.inputError,
                  formData.cardNumber && !errors.cardNumber && styles.inputValid,
                ]}
                value={formData.cardNumber}
                onChangeText={(text) => updateField('cardNumber', formatCardNumber(text))}
                placeholder="1234 5678 9012 3456"
                keyboardType="numeric"
                maxLength={cardType === 'amex' ? 17 : 19}
                editable={!loading}
              />
              <View style={styles.cardIcon}>
                <Ionicons 
                  name={getCardIcon(cardType)} 
                  size={20} 
                  color={cardType ? '#3B82F6' : '#6B7280'} 
                />
              </View>
            </View>
            {errors.cardNumber && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{errors.cardNumber}</Text>
              </View>
            )}
          </View>

          {/* Fecha de vencimiento y CVV */}
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.label}>Vencimiento *</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.expiryDate && styles.inputError,
                  formData.expiryDate && !errors.expiryDate && styles.inputValid,
                ]}
                value={formData.expiryDate}
                onChangeText={(text) => updateField('expiryDate', formatExpiryDate(text))}
                placeholder="MM/AA"
                keyboardType="numeric"
                maxLength={5}
                editable={!loading}
              />
              {errors.expiryDate && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.errorText}>{errors.expiryDate}</Text>
                </View>
              )}
            </View>

            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.label}>CVV *</Text>
              <View style={styles.cvvContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.cvvInput,
                    errors.cvv && styles.inputError,
                    formData.cvv && !errors.cvv && styles.inputValid,
                  ]}
                  value={formData.cvv}
                  onChangeText={(text) => updateField('cvv', text.replace(/\D/g, ''))}
                  placeholder={cardType === 'amex' ? '1234' : '123'}
                  keyboardType="numeric"
                  maxLength={cardType === 'amex' ? 4 : 3}
                  secureTextEntry
                  editable={!loading}
                />
                <TouchableOpacity style={styles.cvvHelp}>
                  <Ionicons name="help-circle-outline" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
              {errors.cvv && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.errorText}>{errors.cvv}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ✅ OPCIÓN DE GUARDAR TARJETA */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => updateField('saveCard', !formData.saveCard)}
            >
              <View style={[
                styles.checkbox,
                formData.saveCard && styles.checkboxChecked
              ]}>
                {formData.saveCard && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                Guardar información de la tarjeta de forma segura
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.securityNote}>
              Solo guardamos información no sensible (últimos 4 dígitos, nombre del titular). 
              Los datos completos de la tarjeta nunca se almacenan en el dispositivo.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ✅ BOTÓN DE ENVÍO */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="lock-closed-outline" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Procesar Pago Seguro</Text>
          </>
        )}
      </TouchableOpacity>

      {/* ✅ INFORMACIÓN DE SEGURIDAD */}
      <View style={styles.securityInfo}>
        <Ionicons name="shield-checkmark-outline" size={16} color="#10B981" />
        <Text style={styles.securityText}>
          Tu información está protegida con encriptación SSL
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
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
  savedCardsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savedCardsText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },

  // ✅ TARJETAS GUARDADAS
  savedCardsContainer: {
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
  },
  savedCardsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  savedCardItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  savedCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  savedCardIcon: {
    marginRight: 12,
  },
  savedCardInfo: {
    flex: 1,
  },
  savedCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  savedCardNumber: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  savedCardExpiry: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  deleteCardButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },

  // ✅ FORMULARIO
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
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
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
  cardInputContainer: {
    position: 'relative',
  },
  cardInput: {
    paddingRight: 48,
  },
  cardIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  cvvContainer: {
    position: 'relative',
  },
  cvvInput: {
    paddingRight: 40,
  },
  cvvHelp: {
    position: 'absolute',
    right: 12,
    top: 12,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
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
    lineHeight: 20,
  },
  securityNote: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginTop: 8,
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

  // ✅ INFORMACIÓN DE SEGURIDAD
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default PaymentForm;

