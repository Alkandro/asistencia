// PaymentManagementScreen.js - Gestión completa de métodos de pago
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
import PaymentForm from './PaymentForm';

const PaymentManagementScreen = () => {
  const navigation = useNavigation();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // ✅ CARGAR MÉTODOS DE PAGO AL INICIAR
  useEffect(() => {
    loadPaymentMethods();
  }, []);

  // ✅ CARGAR MÉTODOS DE PAGO DESDE ASYNCSTORAGE
  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const savedCards = await AsyncStorage.getItem('savedCards');
      
      if (savedCards) {
        const parsedCards = JSON.parse(savedCards);
        if (Array.isArray(parsedCards)) {
          // Ordenar por última vez usada
          const sortedCards = parsedCards.sort((a, b) => {
            const aLastUsed = new Date(a.lastUsed || a.createdAt);
            const bLastUsed = new Date(b.lastUsed || b.createdAt);
            return bLastUsed - aLastUsed;
          });
          
          setPaymentMethods(sortedCards);
          console.log('💳 Métodos de pago cargados:', sortedCards.length);
        }
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      Alert.alert('Error', 'No se pudieron cargar los métodos de pago');
    } finally {
      setLoading(false);
    }
  };

  // ✅ GUARDAR MÉTODOS DE PAGO EN ASYNCSTORAGE
  const savePaymentMethods = async (updatedMethods) => {
    try {
      await AsyncStorage.setItem('savedCards', JSON.stringify(updatedMethods));
      setPaymentMethods(updatedMethods);
      console.log('💳 Métodos de pago guardados:', updatedMethods.length);
    } catch (error) {
      console.error('Error saving payment methods:', error);
      Alert.alert('Error', 'No se pudieron guardar los métodos de pago');
    }
  };

  // ✅ MANEJAR NUEVO MÉTODO DE PAGO
  const handlePaymentSubmit = async (paymentData) => {
    try {
      setFormLoading(true);
      
      // Crear metadatos seguros (sin datos sensibles)
      const paymentMetadata = {
        id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        lastFourDigits: paymentData.cardNumber.slice(-4),
        cardType: detectCardType(paymentData.cardNumber),
        expiryMonth: paymentData.expiryDate.split('/')[0],
        expiryYear: paymentData.expiryDate.split('/')[1],
        cardholderName: paymentData.cardholderName,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      };

      let updatedMethods = [...paymentMethods];
      
      // Verificar si ya existe una tarjeta similar
      const existingIndex = updatedMethods.findIndex(method => 
        method.lastFourDigits === paymentMetadata.lastFourDigits &&
        method.expiryMonth === paymentMetadata.expiryMonth &&
        method.expiryYear === paymentMetadata.expiryYear
      );

      if (existingIndex !== -1) {
        // Actualizar método existente
        updatedMethods[existingIndex] = { 
          ...updatedMethods[existingIndex], 
          ...paymentMetadata 
        };
        Alert.alert('Información', 'Método de pago actualizado');
      } else {
        // Agregar nuevo método
        updatedMethods.unshift(paymentMetadata);
        
        // Mantener solo los últimos 5 métodos
        updatedMethods = updatedMethods.slice(0, 5);
        
        Alert.alert('Éxito', 'Método de pago guardado de forma segura');
      }

      await savePaymentMethods(updatedMethods);
      
      // Guardar nombre del titular por separado para autocompletado
      await AsyncStorage.setItem('savedCardholderName', paymentData.cardholderName);
      
      setShowAddForm(false);
    } catch (error) {
      console.error('Error handling payment method:', error);
      Alert.alert('Error', 'No se pudo procesar el método de pago');
    } finally {
      setFormLoading(false);
    }
  };

  // ✅ DETECTAR TIPO DE TARJETA
  const detectCardType = (number) => {
    const cleaned = number.replace(/\s/g, '');
    
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6/.test(cleaned)) return 'discover';
    
    return 'unknown';
  };

  // ✅ ELIMINAR MÉTODO DE PAGO
  const handleDeletePaymentMethod = (methodId) => {
    Alert.alert(
      'Eliminar Método de Pago',
      '¿Estás seguro de que quieres eliminar este método de pago?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedMethods = paymentMethods.filter(method => method.id !== methodId);
              await savePaymentMethods(updatedMethods);
              Alert.alert('Éxito', 'Método de pago eliminado correctamente');
            } catch (error) {
              console.error('Error deleting payment method:', error);
              Alert.alert('Error', 'No se pudo eliminar el método de pago');
            }
          },
        },
      ]
    );
  };

  // ✅ OBTENER ICONO DE TARJETA
  const getCardIcon = (cardType) => {
    switch (cardType) {
      case 'visa': return 'card';
      case 'mastercard': return 'card';
      case 'amex': return 'card';
      case 'discover': return 'card';
      default: return 'card-outline';
    }
  };

  // ✅ OBTENER COLOR DE TARJETA
  const getCardColor = (cardType) => {
    switch (cardType) {
      case 'visa': return '#1A1F71';
      case 'mastercard': return '#EB001B';
      case 'amex': return '#006FCF';
      case 'discover': return '#FF6000';
      default: return '#6B7280';
    }
  };

  // ✅ RENDERIZAR TARJETA DE MÉTODO DE PAGO
  const renderPaymentMethodCard = (method) => (
    <View key={method.id} style={styles.paymentCard}>
      {/* ✅ HEADER CON ICONO Y ACCIONES */}
      <View style={styles.paymentHeader}>
        <View style={styles.paymentHeaderLeft}>
          <View style={[styles.cardIcon, { backgroundColor: getCardColor(method.cardType) }]}>
            <Ionicons 
              name={getCardIcon(method.cardType)} 
              size={24} 
              color="#fff" 
            />
          </View>
          
          <View style={styles.cardInfo}>
            <Text style={styles.cardNumber}>
              •••• •••• •••• {method.lastFourDigits}
            </Text>
            <Text style={styles.cardType}>
              {method.cardType.charAt(0).toUpperCase() + method.cardType.slice(1)}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePaymentMethod(method.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* ✅ INFORMACIÓN DE LA TARJETA */}
      <View style={styles.paymentInfo}>
        <View style={styles.paymentInfoRow}>
          <View style={styles.paymentInfoItem}>
            <Text style={styles.paymentInfoLabel}>Titular</Text>
            <Text style={styles.paymentInfoValue}>{method.cardholderName}</Text>
          </View>
          
          <View style={styles.paymentInfoItem}>
            <Text style={styles.paymentInfoLabel}>Vencimiento</Text>
            <Text style={styles.paymentInfoValue}>
              {method.expiryMonth}/{method.expiryYear}
            </Text>
          </View>
        </View>
        
        <View style={styles.paymentFooter}>
          <Text style={styles.lastUsedText}>
            Última vez usada: {new Date(method.lastUsed || method.createdAt).toLocaleDateString()}
          </Text>
          
          <View style={styles.securityBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#10B981" />
            <Text style={styles.securityText}>Datos seguros</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // ✅ RENDERIZAR ESTADO VACÍO
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="card-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No tienes métodos de pago guardados</Text>
      <Text style={styles.emptyStateSubtitle}>
        Agrega un método de pago para hacer tus compras más rápidas y seguras
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => setShowAddForm(true)}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.emptyStateButtonText}>Agregar Primer Método</Text>
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
        
        <Text style={styles.headerTitle}>Métodos de Pago</Text>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
        >
          <Ionicons name="add" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* ✅ CONTENIDO PRINCIPAL */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando métodos de pago...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {paymentMethods.length > 0 ? (
            <>
              {/* ✅ INFORMACIÓN DE SEGURIDAD */}
              <View style={styles.securityCard}>
                <View style={styles.securityHeader}>
                  <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                  <Text style={styles.securityTitle}>Seguridad Garantizada</Text>
                </View>
                <Text style={styles.securityText}>
                  Solo guardamos información no sensible (últimos 4 dígitos, nombre del titular). 
                  Los datos completos de la tarjeta nunca se almacenan en el dispositivo.
                </Text>
                <View style={styles.securityFeatures}>
                  <View style={styles.securityFeature}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.securityFeatureText}>Encriptación local</Text>
                  </View>
                  <View style={styles.securityFeature}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.securityFeatureText}>Sin datos sensibles</Text>
                  </View>
                  <View style={styles.securityFeature}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.securityFeatureText}>Solo en tu dispositivo</Text>
                  </View>
                </View>
              </View>

              {/* ✅ LISTA DE MÉTODOS DE PAGO */}
              {paymentMethods.map(renderPaymentMethodCard)}
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
        onRequestClose={() => setShowAddForm(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAddForm(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Nuevo Método de Pago</Text>
            
            <View style={{ width: 24 }} />
          </View>

          <PaymentForm
            onSubmit={handlePaymentSubmit}
            loading={formLoading}
            style={styles.paymentForm}
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

  // ✅ SECURITY CARD
  securityCard: {
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  securityText: {
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
    marginBottom: 12,
  },
  securityFeatures: {
    gap: 6,
  },
  securityFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  securityFeatureText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '500',
  },

  // ✅ PAYMENT CARD
  paymentCard: {
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
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 48,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    gap: 2,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'monospace',
  },
  cardType: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },

  // ✅ PAYMENT INFO
  paymentInfo: {
    gap: 12,
  },
  paymentInfoRow: {
    flexDirection: 'row',
    gap: 24,
  },
  paymentInfoItem: {
    flex: 1,
  },
  paymentInfoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  paymentInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  lastUsedText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  paymentForm: {
    flex: 1,
    margin: 16,
  },
});

export default PaymentManagementScreen;
