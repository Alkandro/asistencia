// PaymentForm.js - Componente de formulario de pago individual
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PaymentForm = ({ 
  onSubmit, 
  loading = false,
  style 
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : cleaned;
  };

  const formatExpiryDate = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const validateForm = () => {
    if (!cardholderName.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del titular');
      return false;
    }

    if (!cardNumber.replace(/\s/g, '') || cardNumber.replace(/\s/g, '').length < 13) {
      Alert.alert('Error', 'Por favor ingresa un número de tarjeta válido');
      return false;
    }

    if (!expiryDate || expiryDate.length < 5) {
      Alert.alert('Error', 'Por favor ingresa una fecha de vencimiento válida');
      return false;
    }

    if (!cvv || cvv.length < 3) {
      Alert.alert('Error', 'Por favor ingresa un CVV válido');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const paymentData = {
      cardNumber: cardNumber.replace(/\s/g, ''),
      expiryDate,
      cvv,
      cardholderName: cardholderName.trim(),
    };

    onSubmit && onSubmit(paymentData);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Información de Pago</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre del Titular</Text>
        <TextInput
          style={styles.input}
          value={cardholderName}
          onChangeText={setCardholderName}
          placeholder="Nombre completo como aparece en la tarjeta"
          autoCapitalize="words"
          editable={!loading}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Número de Tarjeta</Text>
        <View style={styles.cardInputContainer}>
          <TextInput
            style={[styles.input, styles.cardInput]}
            value={cardNumber}
            onChangeText={(text) => setCardNumber(formatCardNumber(text))}
            placeholder="1234 5678 9012 3456"
            keyboardType="numeric"
            maxLength={19}
            editable={!loading}
          />
          <View style={styles.cardIcon}>
            <Ionicons name="card-outline" size={20} color="#6B7280" />
          </View>
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, styles.inputHalf]}>
          <Text style={styles.label}>Vencimiento</Text>
          <TextInput
            style={styles.input}
            value={expiryDate}
            onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
            placeholder="MM/AA"
            keyboardType="numeric"
            maxLength={5}
            editable={!loading}
          />
        </View>

        <View style={[styles.inputGroup, styles.inputHalf]}>
          <Text style={styles.label}>CVV</Text>
          <View style={styles.cvvContainer}>
            <TextInput
              style={[styles.input, styles.cvvInput]}
              value={cvv}
              onChangeText={setCvv}
              placeholder="123"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              editable={!loading}
            />
            <TouchableOpacity style={styles.cvvHelp}>
              <Ionicons name="help-circle-outline" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

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
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
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
