// stripe-webhook-handler.js - Manejador de webhooks de Stripe para Firebase Functions
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret_key);

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// 🔐 VERIFICAR WEBHOOK DE STRIPE
const verifyStripeWebhook = (rawBody, signature) => {
  const endpointSecret = functions.config().stripe.webhook_secret;
  
  try {
    return stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
  } catch (err) {
    console.error('❌ Error verificando webhook:', err.message);
    throw new functions.https.HttpsError('invalid-argument', 'Invalid webhook signature');
  }
};

// 🔄 ACTUALIZAR ESTADO DE PAGO EN FIREBASE
const updatePaymentStatus = async (paymentIntentId, status, metadata = {}) => {
  try {
    console.log('🔄 Actualizando estado de pago:', paymentIntentId, 'a', status);
    
    // Buscar el pedido por paymentIntentId
    const ordersRef = db.collection('orders');
    const query = ordersRef.where('paymentIntentId', '==', paymentIntentId);
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.warn('⚠️ No se encontró pedido con paymentIntentId:', paymentIntentId);
      return;
    }
    
    // Actualizar todos los documentos encontrados (debería ser solo uno)
    const batch = db.batch();
    
    snapshot.forEach((doc) => {
      batch.update(doc.ref, {
        paymentStatus: status,
        stripeMetadata: metadata,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastWebhookEvent: {
          type: metadata.eventType || 'unknown',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          processed: true
        }
      });
    });
    
    await batch.commit();
    console.log('✅ Estado de pago actualizado exitosamente');
    
  } catch (error) {
    console.error('❌ Error actualizando estado de pago:', error);
    throw error;
  }
};

// 🔄 MANEJAR REEMBOLSO EN FIREBASE
const handleRefund = async (paymentIntentId, refundData) => {
  try {
    console.log('💰 Procesando reembolso:', paymentIntentId, refundData);
    
    const ordersRef = db.collection('orders');
    const query = ordersRef.where('paymentIntentId', '==', paymentIntentId);
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.warn('⚠️ No se encontró pedido para reembolso:', paymentIntentId);
      return;
    }
    
    const batch = db.batch();
    
    snapshot.forEach((doc) => {
      batch.update(doc.ref, {
        paymentStatus: 'refunded',
        refundData: {
          id: refundData.id,
          amount: refundData.amount / 100, // Convertir de centavos a dólares
          currency: refundData.currency,
          reason: refundData.reason,
          status: refundData.status,
          created: new Date(refundData.created * 1000)
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log('✅ Reembolso procesado exitosamente');
    
  } catch (error) {
    console.error('❌ Error procesando reembolso:', error);
    throw error;
  }
};

// 📧 ENVIAR NOTIFICACIÓN AL USUARIO
const sendPaymentNotification = async (userId, orderNumber, status, amount) => {
  try {
    console.log('📧 Enviando notificación de pago:', userId, orderNumber, status);
    
    // Obtener token FCM del usuario
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData || !userData.fcmToken) {
      console.log('ℹ️ Usuario sin token FCM, saltando notificación');
      return;
    }
    
    let title, body;
    
    switch (status) {
      case 'succeeded':
        title = '✅ Pago Confirmado';
        body = `Tu pago de $${amount.toFixed(2)} para el pedido ${orderNumber} ha sido procesado exitosamente.`;
        break;
      case 'failed':
        title = '❌ Pago Fallido';
        body = `El pago para el pedido ${orderNumber} no pudo ser procesado. Intenta nuevamente.`;
        break;
      case 'refunded':
        title = '💰 Reembolso Procesado';
        body = `Se ha procesado un reembolso de $${amount.toFixed(2)} para el pedido ${orderNumber}.`;
        break;
      default:
        return; // No enviar notificación para otros estados
    }
    
    const message = {
      token: userData.fcmToken,
      notification: { title, body },
      data: {
        type: 'payment_update',
        orderNumber: orderNumber,
        status: status,
        amount: amount.toString()
      }
    };
    
    await admin.messaging().send(message);
    console.log('✅ Notificación enviada exitosamente');
    
  } catch (error) {
    console.error('❌ Error enviando notificación:', error);
    // No lanzar error para no fallar el webhook
  }
};

// 🎯 FUNCIÓN PRINCIPAL DEL WEBHOOK
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  console.log('🔔 Webhook de Stripe recibido:', req.headers['stripe-signature']);
  
  try {
    // Verificar que sea un POST request
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }
    
    // Obtener el cuerpo raw del request
    const signature = req.headers['stripe-signature'];
    const rawBody = req.rawBody || req.body;
    
    // Verificar el webhook
    const event = verifyStripeWebhook(rawBody, signature);
    console.log('✅ Webhook verificado:', event.type);
    
    // Procesar según el tipo de evento
    switch (event.type) {
      
      // 💳 PAGO EXITOSO
      case 'payment_intent.succeeded':
        {
          const paymentIntent = event.data.object;
          console.log('💳 Pago exitoso:', paymentIntent.id);
          
          await updatePaymentStatus(paymentIntent.id, 'succeeded', {
            eventType: event.type,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            paymentMethod: paymentIntent.payment_method
          });
          
          // Enviar notificación al usuario
          if (paymentIntent.metadata && paymentIntent.metadata.userId) {
            await sendPaymentNotification(
              paymentIntent.metadata.userId,
              paymentIntent.metadata.orderNumber || 'N/A',
              'succeeded',
              paymentIntent.amount / 100
            );
          }
        }
        break;
      
      // ❌ PAGO FALLIDO
      case 'payment_intent.payment_failed':
        {
          const paymentIntent = event.data.object;
          console.log('❌ Pago fallido:', paymentIntent.id);
          
          await updatePaymentStatus(paymentIntent.id, 'failed', {
            eventType: event.type,
            failureCode: paymentIntent.last_payment_error?.code,
            failureMessage: paymentIntent.last_payment_error?.message
          });
          
          // Enviar notificación al usuario
          if (paymentIntent.metadata && paymentIntent.metadata.userId) {
            await sendPaymentNotification(
              paymentIntent.metadata.userId,
              paymentIntent.metadata.orderNumber || 'N/A',
              'failed',
              paymentIntent.amount / 100
            );
          }
        }
        break;
      
      // 🔄 PAGO EN PROCESAMIENTO
      case 'payment_intent.processing':
        {
          const paymentIntent = event.data.object;
          console.log('🔄 Pago en procesamiento:', paymentIntent.id);
          
          await updatePaymentStatus(paymentIntent.id, 'processing', {
            eventType: event.type
          });
        }
        break;
      
      // ❌ PAGO CANCELADO
      case 'payment_intent.canceled':
        {
          const paymentIntent = event.data.object;
          console.log('❌ Pago cancelado:', paymentIntent.id);
          
          await updatePaymentStatus(paymentIntent.id, 'canceled', {
            eventType: event.type,
            cancellationReason: paymentIntent.cancellation_reason
          });
        }
        break;
      
      // 💰 REEMBOLSO CREADO
      case 'charge.dispute.created':
      case 'refund.created':
        {
          const refund = event.data.object;
          console.log('💰 Reembolso creado:', refund.id);
          
          // Para refunds, el payment_intent está en refund.payment_intent
          // Para disputes, está en charge.payment_intent
          const paymentIntentId = refund.payment_intent || refund.charge?.payment_intent;
          
          if (paymentIntentId) {
            await handleRefund(paymentIntentId, refund);
            
            // Buscar el pedido para obtener información del usuario
            const ordersRef = db.collection('orders');
            const query = ordersRef.where('paymentIntentId', '==', paymentIntentId);
            const snapshot = await query.get();
            
            if (!snapshot.empty) {
              const orderData = snapshot.docs[0].data();
              await sendPaymentNotification(
                orderData.userId,
                orderData.orderNumber,
                'refunded',
                refund.amount / 100
              );
            }
          }
        }
        break;
      
      // 🔄 MÉTODO DE PAGO ADJUNTADO
      case 'payment_method.attached':
        {
          const paymentMethod = event.data.object;
          console.log('🔄 Método de pago adjuntado:', paymentMethod.id);
          
          // Opcional: Guardar información del método de pago para uso futuro
          if (paymentMethod.customer) {
            // Aquí podrías guardar el método de pago en Firebase para el usuario
            console.log('💳 Método de pago guardado para customer:', paymentMethod.customer);
          }
        }
        break;
      
      // 📊 OTROS EVENTOS (para logging)
      default:
        console.log('ℹ️ Evento no manejado:', event.type);
        break;
    }
    
    // Responder exitosamente
    res.status(200).json({ received: true, eventType: event.type });
    
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    res.status(400).json({ 
      error: 'Webhook processing failed', 
      message: error.message 
    });
  }
});

// 💳 CREAR PAYMENT INTENT (función auxiliar para el frontend)
exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticación
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }
    
    const { amount, currency = 'usd', orderItems, orderNumber } = data;
    
    // Validar datos
    if (!amount || amount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Monto inválido');
    }
    
    console.log('💳 Creando Payment Intent:', { amount, currency, orderNumber });
    
    // Crear Payment Intent en Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convertir a centavos
      currency: currency,
      metadata: {
        userId: context.auth.uid,
        orderNumber: orderNumber || `ORD-${Date.now()}`,
        orderItems: JSON.stringify(orderItems || [])
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    console.log('✅ Payment Intent creado:', paymentIntent.id);
    
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
    
  } catch (error) {
    console.error('❌ Error creando Payment Intent:', error);
    throw new functions.https.HttpsError('internal', 'Error creando Payment Intent');
  }
});

// 💰 PROCESAR REEMBOLSO (función auxiliar para el admin)
exports.processRefund = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticación y permisos de admin
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }
    
    // Verificar que el usuario sea admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();
    
    if (!userData || userData.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Permisos insuficientes');
    }
    
    const { paymentIntentId, amount, reason } = data;
    
    // Validar datos
    if (!paymentIntentId || !amount || amount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Datos de reembolso inválidos');
    }
    
    console.log('💰 Procesando reembolso:', { paymentIntentId, amount, reason });
    
    // Crear reembolso en Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(amount * 100), // Convertir a centavos
      reason: reason || 'requested_by_customer',
      metadata: {
        processedBy: context.auth.uid,
        processedAt: new Date().toISOString()
      }
    });
    
    console.log('✅ Reembolso creado en Stripe:', refund.id);
    
    return {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100
    };
    
  } catch (error) {
    console.error('❌ Error procesando reembolso:', error);
    throw new functions.https.HttpsError('internal', 'Error procesando reembolso');
  }
});

// 📊 OBTENER ESTADÍSTICAS DE PAGOS
exports.getPaymentStats = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticación y permisos de admin
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }
    
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();
    
    if (!userData || userData.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Permisos insuficientes');
    }
    
    console.log('📊 Obteniendo estadísticas de pagos...');
    
    // Obtener estadísticas de Stripe
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
    
    // Obtener balance de Stripe
    const balance = await stripe.balance.retrieve();
    
    // Obtener transacciones recientes
    const charges = await stripe.charges.list({
      created: { gte: thirtyDaysAgo },
      limit: 100
    });
    
    // Calcular estadísticas
    let totalRevenue = 0;
    let successfulPayments = 0;
    let failedPayments = 0;
    let refundedAmount = 0;
    
    charges.data.forEach(charge => {
      if (charge.paid) {
        totalRevenue += charge.amount / 100;
        successfulPayments++;
      } else {
        failedPayments++;
      }
      
      if (charge.refunded) {
        refundedAmount += charge.amount_refunded / 100;
      }
    });
    
    const stats = {
      availableBalance: balance.available[0]?.amount / 100 || 0,
      pendingBalance: balance.pending[0]?.amount / 100 || 0,
      totalRevenue: totalRevenue,
      successfulPayments: successfulPayments,
      failedPayments: failedPayments,
      refundedAmount: refundedAmount,
      totalTransactions: charges.data.length,
      period: '30 días'
    };
    
    console.log('✅ Estadísticas obtenidas:', stats);
    return stats;
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    throw new functions.https.HttpsError('internal', 'Error obteniendo estadísticas');
  }
});
