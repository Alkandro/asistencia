// StripeService.js - Servicio de Stripe para el frontend
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

class StripeService {
  constructor() {
    // Inicializar funciones de Firebase
    this.createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
    this.processRefund = httpsCallable(functions, 'processRefund');
    this.getPaymentStats = httpsCallable(functions, 'getPaymentStats');
  }

  // 💳 CREAR PAYMENT INTENT
  async createPaymentIntent(orderData) {
    try {
      console.log('💳 Creando Payment Intent:', orderData);
      
      const { amount, currency = 'usd', orderItems, orderNumber } = orderData;
      
      // Validar datos localmente
      if (!amount || amount <= 0) {
        throw new Error('Monto inválido');
      }
      
      // Llamar a la función de Firebase
      const result = await this.createPaymentIntent({
        amount: amount,
        currency: currency,
        orderItems: orderItems,
        orderNumber: orderNumber
      });
      
      console.log('✅ Payment Intent creado:', result.data);
      return result.data;
      
    } catch (error) {
      console.error('❌ Error creando Payment Intent:', error);
      throw new Error(error.message || 'Error creando Payment Intent');
    }
  }

  // 💰 PROCESAR REEMBOLSO (solo para admins)
  async processRefund(refundData) {
    try {
      console.log('💰 Procesando reembolso:', refundData);
      
      const { paymentIntentId, amount, reason } = refundData;
      
      // Validar datos localmente
      if (!paymentIntentId || !amount || amount <= 0) {
        throw new Error('Datos de reembolso inválidos');
      }
      
      // Llamar a la función de Firebase
      const result = await this.processRefund({
        paymentIntentId: paymentIntentId,
        amount: amount,
        reason: reason
      });
      
      console.log('✅ Reembolso procesado:', result.data);
      return result.data;
      
    } catch (error) {
      console.error('❌ Error procesando reembolso:', error);
      throw new Error(error.message || 'Error procesando reembolso');
    }
  }

  // 📊 OBTENER ESTADÍSTICAS (solo para admins)
  async getPaymentStats() {
    try {
      console.log('📊 Obteniendo estadísticas de pagos...');
      
      // Llamar a la función de Firebase
      const result = await this.getPaymentStats();
      
      console.log('✅ Estadísticas obtenidas:', result.data);
      return result.data;
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw new Error(error.message || 'Error obteniendo estadísticas');
    }
  }

  // 🔄 VERIFICAR ESTADO DE PAGO
  async checkPaymentStatus(paymentIntentId) {
    try {
      console.log('🔄 Verificando estado de pago:', paymentIntentId);
      
      // En una implementación real, esto podría ser otra función de Firebase
      // Por ahora, simulamos la verificación
      return {
        status: 'succeeded',
        amount: 0,
        currency: 'usd'
      };
      
    } catch (error) {
      console.error('❌ Error verificando estado:', error);
      throw new Error('Error verificando estado de pago');
    }
  }

  // 💳 VALIDAR DATOS DE TARJETA
  validateCardData(cardData) {
    const { number, expMonth, expYear, cvc } = cardData;
    
    // Validaciones básicas
    if (!number || number.length < 13 || number.length > 19) {
      return { valid: false, error: 'Número de tarjeta inválido' };
    }
    
    if (!expMonth || expMonth < 1 || expMonth > 12) {
      return { valid: false, error: 'Mes de expiración inválido' };
    }
    
    const currentYear = new Date().getFullYear();
    if (!expYear || expYear < currentYear || expYear > currentYear + 20) {
      return { valid: false, error: 'Año de expiración inválido' };
    }
    
    if (!cvc || cvc.length < 3 || cvc.length > 4) {
      return { valid: false, error: 'CVC inválido' };
    }
    
    return { valid: true };
  }

  // 💰 FORMATEAR MONTO
  formatAmount(amount, currency = 'USD') {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // 🎨 OBTENER ICONO DE MARCA DE TARJETA
  getCardBrandIcon(brand) {
    const icons = {
      visa: 'card',
      mastercard: 'card',
      amex: 'card',
      discover: 'card',
      diners: 'card',
      jcb: 'card',
      unionpay: 'card',
      unknown: 'card-outline'
    };
    
    return icons[brand?.toLowerCase()] || icons.unknown;
  }

  // 🎨 OBTENER COLOR DE ESTADO
  getStatusColor(status) {
    const colors = {
      succeeded: '#10B981',
      paid: '#10B981',
      pending: '#F59E0B',
      processing: '#3B82F6',
      failed: '#EF4444',
      canceled: '#6B7280',
      refunded: '#8B5CF6'
    };
    
    return colors[status] || '#9CA3AF';
  }

  // 🏷️ OBTENER ETIQUETA DE ESTADO
  getStatusLabel(status) {
    const labels = {
      succeeded: 'Exitoso',
      paid: 'Pagado',
      pending: 'Pendiente',
      processing: 'Procesando',
      failed: 'Fallido',
      canceled: 'Cancelado',
      refunded: 'Reembolsado'
    };
    
    return labels[status] || 'Desconocido';
  }

  // 🔢 CONVERTIR A CENTAVOS (para Stripe)
  toCents(amount) {
    return Math.round(amount * 100);
  }

  // 🔢 CONVERTIR DE CENTAVOS (desde Stripe)
  fromCents(cents) {
    return cents / 100;
  }

  // 📱 DETECTAR TIPO DE DISPOSITIVO PARA APPLE/GOOGLE PAY
  getAvailablePaymentMethods() {
    const methods = ['card'];
    
    // Detectar si Apple Pay está disponible
    if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
      methods.push('apple_pay');
    }
    
    // Detectar si Google Pay está disponible (simplificado)
    if (window.google && window.google.payments) {
      methods.push('google_pay');
    }
    
    return methods;
  }

  // 🔐 GENERAR ID ÚNICO PARA PEDIDOS
  generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  }

  // 📊 CALCULAR COMISIONES DE STRIPE
  calculateStripeFees(amount, currency = 'usd') {
    // Comisiones estándar de Stripe (pueden variar por región)
    const fixedFee = currency === 'usd' ? 0.30 : 0.25; // Fee fijo
    const percentageFee = 0.029; // 2.9%
    
    const fee = (amount * percentageFee) + fixedFee;
    const netAmount = amount - fee;
    
    return {
      grossAmount: amount,
      stripeFee: Number(fee.toFixed(2)),
      netAmount: Number(netAmount.toFixed(2))
    };
  }

  // 🌍 OBTENER MONEDAS SOPORTADAS
  getSupportedCurrencies() {
    return [
      { code: 'usd', name: 'Dólar Estadounidense', symbol: '$' },
      { code: 'eur', name: 'Euro', symbol: '€' },
      { code: 'gbp', name: 'Libra Esterlina', symbol: '£' },
      { code: 'mxn', name: 'Peso Mexicano', symbol: '$' },
      { code: 'cad', name: 'Dólar Canadiense', symbol: 'C$' },
      { code: 'aud', name: 'Dólar Australiano', symbol: 'A$' }
    ];
  }

  // 🔄 RETRY LOGIC PARA OPERACIONES FALLIDAS
  async retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.warn(`❌ Intento ${attempt} fallido:`, error.message);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  // 📝 LOGGING PARA DEBUGGING
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [STRIPE] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'error':
        console.error(logMessage, data);
        break;
      case 'warn':
        console.warn(logMessage, data);
        break;
      case 'info':
        console.info(logMessage, data);
        break;
      default:
        console.log(logMessage, data);
    }
  }
}

// Exportar instancia singleton
export default new StripeService();
