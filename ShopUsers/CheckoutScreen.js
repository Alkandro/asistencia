
// // // CheckoutScreen_WITH_SAVED_DATA.js - Checkout integrado con direcciones y métodos de pago guardados
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   SafeAreaView,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
//   Modal,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import AddressForm from '../ComponentsShop/AddressForm';
// import PaymentForm from '../ComponentsShop/PaymentForm';

// const CheckoutScreen = () => {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const { cartItems = [] } = route.params || {};

//   // ✅ ESTADOS PRINCIPALES
//   const [loading, setLoading] = useState(true);
//   const [step, setStep] = useState(1); // 1: Dirección, 2: Pago, 3: Confirmación
//   const [processing, setProcessing] = useState(false);

//   // ✅ ESTADOS DE DIRECCIONES
//   const [savedAddresses, setSavedAddresses] = useState([]);
//   const [selectedAddress, setSelectedAddress] = useState(null);
//   const [showAddressForm, setShowAddressForm] = useState(false);
//   const [addressFormLoading, setAddressFormLoading] = useState(false);

//   // ✅ ESTADOS DE MÉTODOS DE PAGO
//   const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
//   const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
//   const [showPaymentForm, setShowPaymentForm] = useState(false);
//   const [paymentFormLoading, setPaymentFormLoading] = useState(false);

//   // ✅ ESTADOS DE CÁLCULOS
//   const [totals, setTotals] = useState({
//     subtotal: 0,
//     tax: 0,
//     shipping: 0,
//     total: 0
//   });

//   // ✅ CARGAR DATOS INICIALES
//   useEffect(() => {
//     loadInitialData();
//   }, []);

//   // ✅ CARGAR DIRECCIONES, MÉTODOS DE PAGO Y CALCULAR TOTALES
//   const loadInitialData = async () => {
//     try {
//       setLoading(true);
      
//       // Cargar direcciones guardadas
//       const addressesData = await AsyncStorage.getItem('savedAddresses');
//       if (addressesData) {
//         const addresses = JSON.parse(addressesData);
//         if (Array.isArray(addresses)) {
//           setSavedAddresses(addresses);
          
//           // Seleccionar dirección por defecto automáticamente
//           const defaultAddress = addresses.find(addr => addr.isDefault);
//           if (defaultAddress) {
//             setSelectedAddress(defaultAddress);
//           }
//         }
//       }

//       // Cargar métodos de pago guardados
//       const paymentData = await AsyncStorage.getItem('savedCards');
//       if (paymentData) {
//         const paymentMethods = JSON.parse(paymentData);
//         if (Array.isArray(paymentMethods)) {
//           setSavedPaymentMethods(paymentMethods);
//         }
//       }

//       // Calcular totales
//       calculateTotals();
      
//     } catch (error) {
//       console.error('Error loading checkout data:', error);
//       Alert.alert('Error', 'No se pudieron cargar los datos del checkout');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ CALCULAR TOTALES CON VALIDACIONES ROBUSTAS
//   const calculateTotals = () => {
//     try {
//       // Validar que cartItems existe y es válido
//       if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
//         setTotals({ subtotal: 0, tax: 0, shipping: 0, total: 0 });
//         return;
//       }

//       let subtotal = 0;
      
//       cartItems.forEach((item, index) => {
//         let itemPrice = 0;
        
//         // ✅ EXTRAER PRECIO CON MÚLTIPLES FALLBACKS
//         if (item.totalPrice !== undefined && item.totalPrice !== null) {
//           itemPrice = parseFloat(item.totalPrice) || 0;
//         } else if (item.price !== undefined && item.price !== null) {
//           const price = parseFloat(item.price) || 0;
//           const quantity = parseInt(item.quantity) || 1;
//           itemPrice = price * quantity;
//         }
        
//         // ✅ VALIDAR QUE EL PRECIO ES UN NÚMERO VÁLIDO
//         if (isNaN(itemPrice) || !isFinite(itemPrice)) {
//           console.warn(`⚠️ Precio inválido para item ${index}:`, item);
//           itemPrice = 0;
//         }
        
//         console.log(`💰 Item ${index}: ${item.name || 'Sin nombre'} = $${itemPrice}`);
//         subtotal += itemPrice;
//       });

//       // ✅ VALIDAR SUBTOTAL
//       if (isNaN(subtotal) || !isFinite(subtotal)) {
//         console.error('❌ Subtotal inválido:', subtotal);
//         subtotal = 0;
//       }

//       // ✅ CALCULAR IMPUESTOS (10%)
//       const tax = subtotal * 0.10;
      
//       // ✅ CALCULAR ENVÍO (gratis si >$100, sino $10)
//       const shipping = subtotal >= 100 ? 0 : 10;
      
//       // ✅ CALCULAR TOTAL
//       const total = subtotal + tax + shipping;

//       const calculatedTotals = {
//         subtotal: Math.round(subtotal * 100) / 100,
//         tax: Math.round(tax * 100) / 100,
//         shipping: Math.round(shipping * 100) / 100,
//         total: Math.round(total * 100) / 100
//       };

//       console.log('📊 Totales calculados:', calculatedTotals);
//       setTotals(calculatedTotals);
      
//     } catch (error) {
//       console.error('❌ Error calculando totales:', error);
//       setTotals({ subtotal: 0, tax: 0, shipping: 0, total: 0 });
//     }
//   };

//   // ✅ MANEJAR NUEVA DIRECCIÓN
//   const handleNewAddress = async (addressData) => {
//     try {
//       setAddressFormLoading(true);
      
//       const newAddress = {
//         id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//         ...addressData,
//         createdAt: new Date().toISOString(),
//         lastUsed: new Date().toISOString(),
//       };

//       let updatedAddresses = [...savedAddresses];
      
//       // Si es por defecto, quitar el flag de las demás
//       if (newAddress.isDefault) {
//         updatedAddresses.forEach(addr => addr.isDefault = false);
//       }

//       updatedAddresses.unshift(newAddress);
//       updatedAddresses = updatedAddresses.slice(0, 10); // Mantener solo 10

//       // Guardar en AsyncStorage
//       await AsyncStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
//       setSavedAddresses(updatedAddresses);
      
//       // Seleccionar la nueva dirección automáticamente
//       setSelectedAddress(newAddress);
//       setShowAddressForm(false);
      
//       Alert.alert('Éxito', 'Dirección guardada y seleccionada');
//     } catch (error) {
//       console.error('Error saving new address:', error);
//       Alert.alert('Error', 'No se pudo guardar la dirección');
//     } finally {
//       setAddressFormLoading(false);
//     }
//   };

//   // ✅ MANEJAR NUEVO MÉTODO DE PAGO
//   const handleNewPaymentMethod = async (paymentData) => {
//     try {
//       setPaymentFormLoading(true);
      
//       // Crear metadatos seguros (sin datos sensibles)
//       const paymentMetadata = {
//         id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//         lastFourDigits: paymentData.cardNumber.slice(-4),
//         cardType: detectCardType(paymentData.cardNumber),
//         expiryMonth: paymentData.expiryDate.split('/')[0],
//         expiryYear: paymentData.expiryDate.split('/')[1],
//         cardholderName: paymentData.cardholderName,
//         createdAt: new Date().toISOString(),
//         lastUsed: new Date().toISOString(),
//       };

//       let updatedMethods = [...savedPaymentMethods];
//       updatedMethods.unshift(paymentMetadata);
//       updatedMethods = updatedMethods.slice(0, 5); // Mantener solo 5

//       // Guardar en AsyncStorage
//       await AsyncStorage.setItem('savedCards', JSON.stringify(updatedMethods));
//       setSavedPaymentMethods(updatedMethods);
      
//       // Seleccionar el nuevo método automáticamente
//       setSelectedPaymentMethod(paymentMetadata);
//       setShowPaymentForm(false);
      
//       Alert.alert('Éxito', 'Método de pago guardado y seleccionado');
//     } catch (error) {
//       console.error('Error saving new payment method:', error);
//       Alert.alert('Error', 'No se pudo guardar el método de pago');
//     } finally {
//       setPaymentFormLoading(false);
//     }
//   };

//   // ✅ DETECTAR TIPO DE TARJETA
//   const detectCardType = (number) => {
//     const cleaned = number.replace(/\s/g, '');
    
//     if (/^4/.test(cleaned)) return 'visa';
//     if (/^5[1-5]/.test(cleaned)) return 'mastercard';
//     if (/^3[47]/.test(cleaned)) return 'amex';
//     if (/^6/.test(cleaned)) return 'discover';
    
//     return 'unknown';
//   };

//   // ✅ ACTUALIZAR ÚLTIMA VEZ USADA
//   const updateLastUsed = async (type, id) => {
//     try {
//       if (type === 'address') {
//         const updatedAddresses = savedAddresses.map(addr => ({
//           ...addr,
//           lastUsed: addr.id === id ? new Date().toISOString() : addr.lastUsed
//         }));
//         await AsyncStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
//         setSavedAddresses(updatedAddresses);
//       } else if (type === 'payment') {
//         const updatedMethods = savedPaymentMethods.map(method => ({
//           ...method,
//           lastUsed: method.id === id ? new Date().toISOString() : method.lastUsed
//         }));
//         await AsyncStorage.setItem('savedCards', JSON.stringify(updatedMethods));
//         setSavedPaymentMethods(updatedMethods);
//       }
//     } catch (error) {
//       console.error('Error updating last used:', error);
//     }
//   };

//   // ✅ AVANZAR AL SIGUIENTE PASO
//   const nextStep = () => {
//     if (step === 1) {
//       if (!selectedAddress) {
//         Alert.alert('Dirección Requerida', 'Por favor selecciona una dirección de envío');
//         return;
//       }
//       updateLastUsed('address', selectedAddress.id);
//       setStep(2);
//     } else if (step === 2) {
//       if (!selectedPaymentMethod) {
//         Alert.alert('Método de Pago Requerido', 'Por favor selecciona un método de pago');
//         return;
//       }
//       updateLastUsed('payment', selectedPaymentMethod.id);
//       setStep(3);
//     }
//   };

//   // ✅ RETROCEDER AL PASO ANTERIOR
//   const previousStep = () => {
//     if (step > 1) {
//       setStep(step - 1);
//     }
//   };

//   // ✅ PROCESAR PEDIDO
//   const processOrder = async () => {
//     try {
//       setProcessing(true);
      
//       // Simular procesamiento del pedido
//       await new Promise(resolve => setTimeout(resolve, 2000));
      
//       // Limpiar carrito (esto debería hacerse en el contexto del carrito)
//       // await AsyncStorage.removeItem('cartItems');
      
//       Alert.alert(
//         'Pedido Confirmado',
//         'Tu pedido ha sido procesado exitosamente. Recibirás un email de confirmación.',
//         [
//           {
//             text: 'Ver Pedidos',
//             onPress: () => navigation.navigate('OrderHistory')
//           }
//         ]
//       );
      
//     } catch (error) {
//       console.error('Error processing order:', error);
//       Alert.alert('Error', 'No se pudo procesar el pedido. Inténtalo de nuevo.');
//     } finally {
//       setProcessing(false);
//     }
//   };

//   // ✅ RENDERIZAR PASO DE DIRECCIÓN
//   const renderAddressStep = () => (
//     <View style={styles.stepContainer}>
//       <Text style={styles.stepTitle}>Dirección de Envío</Text>
      
//       {savedAddresses.length > 0 ? (
//         <>
//           {/* ✅ DIRECCIONES GUARDADAS */}
//           <ScrollView style={styles.savedItemsContainer} showsVerticalScrollIndicator={false}>
//             {savedAddresses.map((address) => (
//               <TouchableOpacity
//                 key={address.id}
//                 style={[
//                   styles.savedItemCard,
//                   selectedAddress?.id === address.id && styles.selectedItemCard
//                 ]}
//                 onPress={() => setSelectedAddress(address)}
//               >
//                 <View style={styles.savedItemHeader}>
//                   <View style={styles.savedItemLeft}>
//                     <Ionicons 
//                       name={selectedAddress?.id === address.id ? "radio-button-on" : "radio-button-off"} 
//                       size={20} 
//                       color={selectedAddress?.id === address.id ? "#3B82F6" : "#9CA3AF"} 
//                     />
//                     <Text style={styles.savedItemName}>
//                       {address.firstName} {address.lastName}
//                     </Text>
//                     {address.isDefault && (
//                       <View style={styles.defaultBadge}>
//                         <Text style={styles.defaultBadgeText}>Por defecto</Text>
//                       </View>
//                     )}
//                   </View>
//                 </View>
                
//                 <View style={styles.savedItemInfo}>
//                   <Text style={styles.savedItemAddress}>
//                     {address.address1}
//                     {address.address2 && `, ${address.address2}`}
//                   </Text>
//                   <Text style={styles.savedItemCity}>
//                     {address.city}, {address.state} {address.postalCode}
//                   </Text>
//                   <Text style={styles.savedItemCountry}>{address.country}</Text>
//                 </View>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
          
//           {/* ✅ BOTÓN AGREGAR NUEVA DIRECCIÓN */}
//           <TouchableOpacity
//             style={styles.addNewButton}
//             onPress={() => setShowAddressForm(true)}
//           >
//             <Ionicons name="add" size={20} color="#3B82F6" />
//             <Text style={styles.addNewButtonText}>Agregar Nueva Dirección</Text>
//           </TouchableOpacity>
//         </>
//       ) : (
//         // ✅ ESTADO VACÍO
//         <View style={styles.emptyState}>
//           <Ionicons name="location-outline" size={48} color="#D1D5DB" />
//           <Text style={styles.emptyStateTitle}>No tienes direcciones guardadas</Text>
//           <Text style={styles.emptyStateSubtitle}>
//             Agrega una dirección para continuar con tu pedido
//           </Text>
//           <TouchableOpacity
//             style={styles.emptyStateButton}
//             onPress={() => setShowAddressForm(true)}
//           >
//             <Ionicons name="add" size={20} color="#fff" />
//             <Text style={styles.emptyStateButtonText}>Agregar Dirección</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );

//   // ✅ RENDERIZAR PASO DE PAGO
//   const renderPaymentStep = () => (
//     <View style={styles.stepContainer}>
//       <Text style={styles.stepTitle}>Método de Pago</Text>
      
//       {savedPaymentMethods.length > 0 ? (
//         <>
//           {/* ✅ MÉTODOS DE PAGO GUARDADOS */}
//           <ScrollView style={styles.savedItemsContainer} showsVerticalScrollIndicator={false}>
//             {savedPaymentMethods.map((method) => (
//               <TouchableOpacity
//                 key={method.id}
//                 style={[
//                   styles.savedItemCard,
//                   selectedPaymentMethod?.id === method.id && styles.selectedItemCard
//                 ]}
//                 onPress={() => setSelectedPaymentMethod(method)}
//               >
//                 <View style={styles.savedItemHeader}>
//                   <View style={styles.savedItemLeft}>
//                     <Ionicons 
//                       name={selectedPaymentMethod?.id === method.id ? "radio-button-on" : "radio-button-off"} 
//                       size={20} 
//                       color={selectedPaymentMethod?.id === method.id ? "#3B82F6" : "#9CA3AF"} 
//                     />
//                     <View style={styles.cardIcon}>
//                       <Ionicons name="card" size={20} color="#6B7280" />
//                     </View>
//                     <Text style={styles.savedItemName}>
//                       •••• •••• •••• {method.lastFourDigits}
//                     </Text>
//                   </View>
//                 </View>
                
//                 <View style={styles.savedItemInfo}>
//                   <Text style={styles.savedItemAddress}>{method.cardholderName}</Text>
//                   <Text style={styles.savedItemCity}>
//                     {method.cardType.charAt(0).toUpperCase() + method.cardType.slice(1)} • 
//                     Vence {method.expiryMonth}/{method.expiryYear}
//                   </Text>
//                 </View>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
          
//           {/* ✅ BOTÓN AGREGAR NUEVO MÉTODO */}
//           <TouchableOpacity
//             style={styles.addNewButton}
//             onPress={() => setShowPaymentForm(true)}
//           >
//             <Ionicons name="add" size={20} color="#3B82F6" />
//             <Text style={styles.addNewButtonText}>Agregar Nuevo Método</Text>
//           </TouchableOpacity>
//         </>
//       ) : (
//         // ✅ ESTADO VACÍO
//         <View style={styles.emptyState}>
//           <Ionicons name="card-outline" size={48} color="#D1D5DB" />
//           <Text style={styles.emptyStateTitle}>No tienes métodos de pago guardados</Text>
//           <Text style={styles.emptyStateSubtitle}>
//             Agrega un método de pago para continuar con tu pedido
//           </Text>
//           <TouchableOpacity
//             style={styles.emptyStateButton}
//             onPress={() => setShowPaymentForm(true)}
//           >
//             <Ionicons name="add" size={20} color="#fff" />
//             <Text style={styles.emptyStateButtonText}>Agregar Método de Pago</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );

//   // ✅ RENDERIZAR PASO DE CONFIRMACIÓN
//   const renderConfirmationStep = () => (
//     <View style={styles.stepContainer}>
//       <Text style={styles.stepTitle}>Confirmar Pedido</Text>
      
//       {/* ✅ RESUMEN DE DIRECCIÓN */}
//       <View style={styles.summaryCard}>
//         <View style={styles.summaryHeader}>
//           <Ionicons name="location" size={20} color="#3B82F6" />
//           <Text style={styles.summaryTitle}>Dirección de Envío</Text>
//         </View>
//         <Text style={styles.summaryText}>
//           {selectedAddress?.firstName} {selectedAddress?.lastName}
//         </Text>
//         <Text style={styles.summaryText}>{selectedAddress?.address1}</Text>
//         {selectedAddress?.address2 && (
//           <Text style={styles.summaryText}>{selectedAddress.address2}</Text>
//         )}
//         <Text style={styles.summaryText}>
//           {selectedAddress?.city}, {selectedAddress?.state} {selectedAddress?.postalCode}
//         </Text>
//       </View>

//       {/* ✅ RESUMEN DE PAGO */}
//       <View style={styles.summaryCard}>
//         <View style={styles.summaryHeader}>
//           <Ionicons name="card" size={20} color="#10B981" />
//           <Text style={styles.summaryTitle}>Método de Pago</Text>
//         </View>
//         <Text style={styles.summaryText}>
//           •••• •••• •••• {selectedPaymentMethod?.lastFourDigits}
//         </Text>
//         <Text style={styles.summaryText}>
//           {selectedPaymentMethod?.cardholderName}
//         </Text>
//       </View>

//       {/* ✅ RESUMEN DE PRODUCTOS */}
//       <View style={styles.summaryCard}>
//         <View style={styles.summaryHeader}>
//           <Ionicons name="bag" size={20} color="#F59E0B" />
//           <Text style={styles.summaryTitle}>Productos ({cartItems.length})</Text>
//         </View>
//         {cartItems.map((item, index) => (
//           <View key={index} style={styles.productSummaryItem}>
//             <Text style={styles.productSummaryName}>{item.name}</Text>
//             <Text style={styles.productSummaryPrice}>
//               ${parseFloat(item.price || 0).toFixed(2)} x {item.quantity}
//             </Text>
//           </View>
//         ))}
//       </View>
//     </View>
//   );

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#3B82F6" />
//           <Text style={styles.loadingText}>Cargando checkout...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* ✅ HEADER */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#111827" />
//         </TouchableOpacity>
        
//         <Text style={styles.headerTitle}>Finalizar Compra</Text>
        
//         <View style={{ width: 24 }} />
//       </View>

//       {/* ✅ INDICADOR DE PASOS */}
//       <View style={styles.stepsIndicator}>
//         {[1, 2, 3].map((stepNumber) => (
//           <View key={stepNumber} style={styles.stepIndicatorContainer}>
//             <View style={[
//               styles.stepIndicator,
//               step >= stepNumber && styles.stepIndicatorActive
//             ]}>
//               <Text style={[
//                 styles.stepIndicatorText,
//                 step >= stepNumber && styles.stepIndicatorTextActive
//               ]}>
//                 {stepNumber}
//               </Text>
//             </View>
//             <Text style={styles.stepIndicatorLabel}>
//               {stepNumber === 1 ? 'Dirección' : stepNumber === 2 ? 'Pago' : 'Confirmar'}
//             </Text>
//           </View>
//         ))}
//       </View>

//       <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
//         {/* ✅ RENDERIZAR PASO ACTUAL */}
//         {step === 1 && renderAddressStep()}
//         {step === 2 && renderPaymentStep()}
//         {step === 3 && renderConfirmationStep()}
//       </ScrollView>

//       {/* ✅ RESUMEN DE TOTALES */}
//       <View style={styles.totalsContainer}>
//         <View style={styles.totalsRow}>
//           <Text style={styles.totalsLabel}>Subtotal</Text>
//           <Text style={styles.totalsValue}>${totals.subtotal.toFixed(2)}</Text>
//         </View>
        
//         <View style={styles.totalsRow}>
//           <Text style={styles.totalsLabel}>Impuestos</Text>
//           <Text style={styles.totalsValue}>${totals.tax.toFixed(2)}</Text>
//         </View>
        
//         <View style={styles.totalsRow}>
//           <Text style={styles.totalsLabel}>Envío</Text>
//           <Text style={styles.totalsValue}>
//             {totals.shipping === 0 ? 'Gratis' : `$${totals.shipping.toFixed(2)}`}
//           </Text>
//         </View>
        
//         <View style={[styles.totalsRow, styles.totalRow]}>
//           <Text style={styles.totalLabel}>Total a Pagar</Text>
//           <Text style={styles.totalValue}>${totals.total.toFixed(2)}</Text>
//         </View>
//       </View>

//       {/* ✅ BOTONES DE ACCIÓN */}
//       <View style={styles.actionButtons}>
//         {step > 1 && (
//           <TouchableOpacity
//             style={styles.backStepButton}
//             onPress={previousStep}
//           >
//             <Text style={styles.backStepButtonText}>Atrás</Text>
//           </TouchableOpacity>
//         )}
        
//         <TouchableOpacity
//           style={[styles.nextButton, step === 1 && styles.nextButtonFull]}
//           onPress={step === 3 ? processOrder : nextStep}
//           disabled={processing}
//         >
//           {processing ? (
//             <ActivityIndicator size="small" color="#fff" />
//           ) : (
//             <>
//               <Text style={styles.nextButtonText}>
//                 {step === 3 ? 'Confirmar Pedido' : 'Continuar'}
//               </Text>
//               {step < 3 && <Ionicons name="arrow-forward" size={20} color="#fff" />}
//             </>
//           )}
//         </TouchableOpacity>
//       </View>

//       {/* ✅ MODAL DE FORMULARIO DE DIRECCIÓN */}
//       <Modal
//         visible={showAddressForm}
//         animationType="slide"
//         presentationStyle="pageSheet"
//         onRequestClose={() => setShowAddressForm(false)}
//       >
//         <SafeAreaView style={styles.modalContainer}>
//           <View style={styles.modalHeader}>
//             <TouchableOpacity
//               style={styles.modalCloseButton}
//               onPress={() => setShowAddressForm(false)}
//             >
//               <Ionicons name="close" size={24} color="#6B7280" />
//             </TouchableOpacity>
            
//             <Text style={styles.modalTitle}>Nueva Dirección</Text>
            
//             <View style={{ width: 24 }} />
//           </View>

//           <AddressForm
//             onSubmit={handleNewAddress}
//             loading={addressFormLoading}
//             showSaveOption={true}
//             style={styles.form}
//           />
//         </SafeAreaView>
//       </Modal>

//       {/* ✅ MODAL DE FORMULARIO DE PAGO */}
//       <Modal
//         visible={showPaymentForm}
//         animationType="slide"
//         presentationStyle="pageSheet"
//         onRequestClose={() => setShowPaymentForm(false)}
//       >
//         <SafeAreaView style={styles.modalContainer}>
//           <View style={styles.modalHeader}>
//             <TouchableOpacity
//               style={styles.modalCloseButton}
//               onPress={() => setShowPaymentForm(false)}
//             >
//               <Ionicons name="close" size={24} color="#6B7280" />
//             </TouchableOpacity>
            
//             <Text style={styles.modalTitle}>Nuevo Método de Pago</Text>
            
//             <View style={{ width: 24 }} />
//           </View>

//           <PaymentForm
//             onSubmit={handleNewPaymentMethod}
//             loading={paymentFormLoading}
//             style={styles.form}
//           />
//         </SafeAreaView>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
  
//   // ✅ HEADER
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#111827',
//   },

//   // ✅ LOADING
//   loadingContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 12,
//   },
//   loadingText: {
//     fontSize: 16,
//     color: '#6B7280',
//   },

//   // ✅ STEPS INDICATOR
//   stepsIndicator: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 20,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//     gap: 40,
//   },
//   stepIndicatorContainer: {
//     alignItems: 'center',
//     gap: 8,
//   },
//   stepIndicator: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#E5E7EB',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   stepIndicatorActive: {
//     backgroundColor: '#3B82F6',
//   },
//   stepIndicatorText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#9CA3AF',
//   },
//   stepIndicatorTextActive: {
//     color: '#fff',
//   },
//   stepIndicatorLabel: {
//     fontSize: 12,
//     color: '#6B7280',
//     fontWeight: '500',
//   },

//   // ✅ SCROLL CONTAINER
//   scrollContainer: {
//     flex: 1,
//   },

//   // ✅ STEP CONTAINER
//   stepContainer: {
//     padding: 16,
//   },
//   stepTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#111827',
//     marginBottom: 16,
//   },

//   // ✅ SAVED ITEMS
//   savedItemsContainer: {
//     maxHeight: 300,
//     marginBottom: 16,
//   },
//   savedItemCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//     borderWidth: 2,
//     borderColor: '#E5E7EB',
//   },
//   selectedItemCard: {
//     borderColor: '#3B82F6',
//     backgroundColor: '#EFF6FF',
//   },
//   savedItemHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   savedItemLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   savedItemName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#111827',
//   },
//   defaultBadge: {
//     backgroundColor: '#10B981',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   defaultBadgeText: {
//     fontSize: 10,
//     fontWeight: '600',
//     color: '#fff',
//   },
//   savedItemInfo: {
//     marginLeft: 32,
//   },
//   savedItemAddress: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginBottom: 2,
//   },
//   savedItemCity: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginBottom: 2,
//   },
//   savedItemCountry: {
//     fontSize: 14,
//     color: '#6B7280',
//   },
//   cardIcon: {
//     width: 32,
//     height: 20,
//     backgroundColor: '#F3F4F6',
//     borderRadius: 4,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   // ✅ ADD NEW BUTTON
//   addNewButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#EFF6FF',
//     borderWidth: 2,
//     borderColor: '#3B82F6',
//     borderStyle: 'dashed',
//     borderRadius: 12,
//     paddingVertical: 16,
//     gap: 8,
//   },
//   addNewButtonText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#3B82F6',
//   },

//   // ✅ EMPTY STATE
//   emptyState: {
//     alignItems: 'center',
//     paddingVertical: 40,
//     gap: 12,
//   },
//   emptyStateTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#111827',
//   },
//   emptyStateSubtitle: {
//     fontSize: 14,
//     color: '#6B7280',
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   emptyStateButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#3B82F6',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 8,
//     gap: 8,
//   },
//   emptyStateButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '600',
//   },

//   // ✅ SUMMARY CARDS
//   summaryCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   summaryHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//     gap: 8,
//   },
//   summaryTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#111827',
//   },
//   summaryText: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginBottom: 4,
//   },
//   productSummaryItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 4,
//   },
//   productSummaryName: {
//     fontSize: 14,
//     color: '#111827',
//     flex: 1,
//   },
//   productSummaryPrice: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#6B7280',
//   },

//   // ✅ TOTALS
//   totalsContainer: {
//     backgroundColor: '#fff',
//     padding: 16,
//     borderTopWidth: 1,
//     borderTopColor: '#E5E7EB',
//   },
//   totalsRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 8,
//   },
//   totalsLabel: {
//     fontSize: 14,
//     color: '#6B7280',
//   },
//   totalsValue: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#111827',
//   },
//   totalRow: {
//     borderTopWidth: 1,
//     borderTopColor: '#E5E7EB',
//     paddingTop: 12,
//     marginTop: 8,
//   },
//   totalLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#111827',
//   },
//   totalValue: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#111827',
//   },

//   // ✅ ACTION BUTTONS
//   actionButtons: {
//     flexDirection: 'row',
//     padding: 16,
//     backgroundColor: '#fff',
//     borderTopWidth: 1,
//     borderTopColor: '#E5E7EB',
//     gap: 12,
//   },
//   backStepButton: {
//     flex: 1,
//     backgroundColor: '#F3F4F6',
//     paddingVertical: 16,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   backStepButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#6B7280',
//   },
//   nextButton: {
//     flex: 2,
//     backgroundColor: '#3B82F6',
//     paddingVertical: 16,
//     borderRadius: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//   },
//   nextButtonFull: {
//     flex: 1,
//   },
//   nextButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#fff',
//   },

//   // ✅ MODAL
//   modalContainer: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//   },
//   modalCloseButton: {
//     padding: 8,
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#111827',
//   },
//   form: {
//     flex: 1,
//     margin: 16,
//   },
// });

// export default CheckoutScreen;

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
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, writeBatch, doc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import AddressForm from '../ComponentsShop/AddressForm';
import PaymentForm from '../ComponentsShop/PaymentForm';

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { cartItems = [] } = route.params || {};

  // ✅ ESTADOS PRINCIPALES
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Dirección, 2: Pago, 3: Confirmación
  const [processing, setProcessing] = useState(false);

  // ✅ ESTADOS DE DIRECCIONES
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressFormLoading, setAddressFormLoading] = useState(false);

  // ✅ ESTADOS DE MÉTODOS DE PAGO
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentFormLoading, setPaymentFormLoading] = useState(false);

  // ✅ ESTADOS DE CÁLCULOS
  const [totals, setTotals] = useState({
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0
  });

  // 🆕 OPCIONES DE PAGO EN EFECTIVO
  const cashPaymentOptions = [
    {
      id: 'cash_on_delivery',
      type: 'cash',
      name: 'Pago Contraentrega',
      description: 'Paga en efectivo al recibir tu pedido',
      icon: 'cash-outline',
      fee: 0,
      available: true
    },
    {
      id: 'cash_pickup',
      type: 'cash',
      name: 'Pago en Tienda',
      description: 'Paga en efectivo al recoger en tienda',
      icon: 'storefront-outline',
      fee: 0,
      available: true
    }
  ];

  // ✅ CARGAR DATOS INICIALES
  useEffect(() => {
    loadInitialData();
  }, []);

  // 🆕 RECALCULAR CUANDO CAMBIAN LOS ITEMS
  useEffect(() => {
    console.log('🔄 Recalculando totales por cambio en cartItems...');
    calculateTotals();
  }, [cartItems]);

  // ✅ CARGAR DIRECCIONES, MÉTODOS DE PAGO Y CALCULAR TOTALES
  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      console.log('📦 Cargando datos iniciales del checkout...');
      console.log('🛒 Items del carrito recibidos:', cartItems);
      
      // Cargar direcciones guardadas
      const addressesData = await AsyncStorage.getItem('savedAddresses');
      if (addressesData) {
        const addresses = JSON.parse(addressesData);
        if (Array.isArray(addresses)) {
          setSavedAddresses(addresses);
          
          // Seleccionar dirección por defecto automáticamente
          const defaultAddress = addresses.find(addr => addr.isDefault);
          if (defaultAddress) {
            setSelectedAddress(defaultAddress);
            console.log('✅ Dirección por defecto seleccionada:', defaultAddress.firstName);
          }
        }
      }

      // Cargar métodos de pago guardados
      const paymentData = await AsyncStorage.getItem('savedCards');
      if (paymentData) {
        const paymentMethods = JSON.parse(paymentData);
        if (Array.isArray(paymentMethods)) {
          setSavedPaymentMethods(paymentMethods);
          console.log('💳 Métodos de pago cargados:', paymentMethods.length);
        }
      }

      // Calcular totales inmediatamente
      calculateTotals();
      
    } catch (error) {
      console.error('❌ Error loading checkout data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del checkout');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 FUNCIÓN MEJORADA PARA CALCULAR TOTALES COMPATIBLE CON FIREBASE
  const calculateTotals = () => {
    try {
      console.log('💰 Iniciando cálculo de totales...');
      console.log('📋 Items a procesar:', cartItems);

      // Validar que cartItems existe y es válido
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        console.log('⚠️ No hay items en el carrito');
        setTotals({ subtotal: 0, tax: 0, shipping: 0, total: 0 });
        return;
      }

      let subtotal = 0;
      
      cartItems.forEach((item, index) => {
        console.log(`🔍 Procesando item ${index}:`, item);
        
        let itemPrice = 0;
        let itemQuantity = 1;
        
        // 🆕 EXTRAER PRECIO COMPATIBLE CON ESTRUCTURA DE FIREBASE
        if (item.unitPrice !== undefined && item.unitPrice !== null && item.quantity !== undefined && item.quantity !== null) {
          // Estructura de Firebase: unitPrice y quantity
          const unitPrice = parseFloat(item.unitPrice) || 0;
          itemQuantity = parseInt(item.quantity) || 1;
          itemPrice = unitPrice * itemQuantity;
          console.log(`💵 Firebase: ${unitPrice} x ${itemQuantity} = ${itemPrice}`);
        } else if (item.totalPrice !== undefined && item.totalPrice !== null) {
          // Si ya tiene totalPrice calculado
          itemPrice = parseFloat(item.totalPrice) || 0;
          console.log(`💵 Usando totalPrice: ${itemPrice}`);
        } else if (item.price !== undefined && item.price !== null) {
          // Estructura alternativa: price y quantity
          const unitPrice = parseFloat(item.price) || 0;
          itemQuantity = parseInt(item.quantity) || 1;
          itemPrice = unitPrice * itemQuantity;
          console.log(`💵 Alternativo: ${unitPrice} x ${itemQuantity} = ${itemPrice}`);
        } else {
          // Fallback: buscar en propiedades alternativas
          const altPrice = parseFloat(item.cost || item.amount || item.value || 0);
          itemQuantity = parseInt(item.qty || item.count || item.quantity || 1);
          itemPrice = altPrice * itemQuantity;
          console.log(`💵 Fallback: ${altPrice} x ${itemQuantity} = ${itemPrice}`);
        }
        
        // 🆕 VALIDACIONES ESTRICTAS
        if (isNaN(itemPrice) || !isFinite(itemPrice) || itemPrice < 0) {
          console.warn(`⚠️ Precio inválido para item ${index}:`, item);
          itemPrice = 0;
        }
        
        console.log(`✅ Item ${index} (${item.productName || item.name || 'Sin nombre'}): $${itemPrice.toFixed(2)}`);
        subtotal += itemPrice;
      });

      // 🆕 VALIDAR SUBTOTAL FINAL
      if (isNaN(subtotal) || !isFinite(subtotal) || subtotal < 0) {
        console.error('❌ Subtotal inválido calculado:', subtotal);
        subtotal = 0;
      }

      console.log(`💰 Subtotal calculado: $${subtotal.toFixed(2)}`);

      // ✅ CALCULAR IMPUESTOS (10%)
      const tax = subtotal * 0;
      
      // ✅ CALCULAR ENVÍO (gratis si >$100, sino $10)
      const shipping = subtotal >= 100 ? 0 : 10;
      
      // ✅ CALCULAR TOTAL
      const total = subtotal + tax + shipping;

      const calculatedTotals = {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        shipping: Math.round(shipping * 100) / 100,
        total: Math.round(total * 100) / 100
      };

      console.log('📊 Totales finales calculados:', calculatedTotals);
      setTotals(calculatedTotals);
      
    } catch (error) {
      console.error('❌ Error calculando totales:', error);
      setTotals({ subtotal: 0, tax: 0, shipping: 0, total: 0 });
    }
  };

  // ✅ MANEJAR NUEVA DIRECCIÓN
  const handleNewAddress = async (addressData) => {
    try {
      setAddressFormLoading(true);
      
      const newAddress = {
        id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...addressData,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      };

      let updatedAddresses = [...savedAddresses];
      
      // Si es por defecto, quitar el flag de las demás
      if (newAddress.isDefault) {
        updatedAddresses.forEach(addr => addr.isDefault = false);
      }

      updatedAddresses.unshift(newAddress);
      updatedAddresses = updatedAddresses.slice(0, 10); // Mantener solo 10

      // Guardar en AsyncStorage
      await AsyncStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
      setSavedAddresses(updatedAddresses);
      
      // Seleccionar la nueva dirección automáticamente
      setSelectedAddress(newAddress);
      setShowAddressForm(false);
      
      Alert.alert('Éxito', 'Dirección guardada y seleccionada');
    } catch (error) {
      console.error('Error saving new address:', error);
      Alert.alert('Error', 'No se pudo guardar la dirección');
    } finally {
      setAddressFormLoading(false);
    }
  };

  // ✅ MANEJAR NUEVO MÉTODO DE PAGO
  const handleNewPaymentMethod = async (paymentData) => {
    try {
      setPaymentFormLoading(true);
      
      // Crear metadatos seguros (sin datos sensibles)
      const paymentMetadata = {
        id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'card',
        lastFourDigits: paymentData.cardNumber.slice(-4),
        cardType: detectCardType(paymentData.cardNumber),
        expiryMonth: paymentData.expiryDate.split('/')[0],
        expiryYear: paymentData.expiryDate.split('/')[1],
        cardholderName: paymentData.cardholderName,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      };

      let updatedMethods = [...savedPaymentMethods];
      updatedMethods.unshift(paymentMetadata);
      updatedMethods = updatedMethods.slice(0, 5); // Mantener solo 5

      // Guardar en AsyncStorage
      await AsyncStorage.setItem('savedCards', JSON.stringify(updatedMethods));
      setSavedPaymentMethods(updatedMethods);
      
      // Seleccionar el nuevo método automáticamente
      setSelectedPaymentMethod(paymentMetadata);
      setShowPaymentForm(false);
      
      Alert.alert('Éxito', 'Método de pago guardado y seleccionado');
    } catch (error) {
      console.error('Error saving new payment method:', error);
      Alert.alert('Error', 'No se pudo guardar el método de pago');
    } finally {
      setPaymentFormLoading(false);
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

  // ✅ ACTUALIZAR ÚLTIMA VEZ USADA
  const updateLastUsed = async (type, id) => {
    try {
      if (type === 'address') {
        const updatedAddresses = savedAddresses.map(addr => ({
          ...addr,
          lastUsed: addr.id === id ? new Date().toISOString() : addr.lastUsed
        }));
        await AsyncStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
        setSavedAddresses(updatedAddresses);
      } else if (type === 'payment') {
        const updatedMethods = savedPaymentMethods.map(method => ({
          ...method,
          lastUsed: method.id === id ? new Date().toISOString() : method.lastUsed
        }));
        await AsyncStorage.setItem('savedCards', JSON.stringify(updatedMethods));
        setSavedPaymentMethods(updatedMethods);
      }
    } catch (error) {
      console.error('Error updating last used:', error);
    }
  };

  // ✅ AVANZAR AL SIGUIENTE PASO
  const nextStep = () => {
    if (step === 1) {
      if (!selectedAddress) {
        Alert.alert('Dirección Requerida', 'Por favor selecciona una dirección de envío');
        return;
      }
      updateLastUsed('address', selectedAddress.id);
      setStep(2);
    } else if (step === 2) {
      if (!selectedPaymentMethod) {
        Alert.alert('Método de Pago Requerido', 'Por favor selecciona un método de pago');
        return;
      }
      updateLastUsed('payment', selectedPaymentMethod.id);
      setStep(3);
    }
  };

  // ✅ RETROCEDER AL PASO ANTERIOR
  const previousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // 🆕 GENERAR NÚMERO DE PEDIDO ÚNICO
  const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  };

  // 🆕 LIMPIAR CARRITO DE FIREBASE
  const clearCartFromFirebase = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      console.log('🧹 Limpiando carrito de Firebase...');
      
      // Obtener todos los items del carrito del usuario
      const cartRef = collection(db, 'cart');
      const cartQuery = query(cartRef, where('userId', '==', userId));
      const cartSnapshot = await getDocs(cartQuery);

      // Crear batch para eliminar todos los items
      const batch = writeBatch(db);
      cartSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Ejecutar batch
      await batch.commit();
      console.log('✅ Carrito limpiado de Firebase');
    } catch (error) {
      console.error('❌ Error limpiando carrito de Firebase:', error);
    }
  };

  // 🆕 PROCESAR PEDIDO CON FIREBASE
  const processOrder = async () => {
    try {
      setProcessing(true);
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'Debes estar autenticado para realizar un pedido');
        return;
      }

      console.log('🚀 Procesando pedido en Firebase...');
      console.log('📦 Items:', cartItems);
      console.log('💰 Totales:', totals);
      console.log('📍 Dirección:', selectedAddress);
      console.log('💳 Pago:', selectedPaymentMethod);
      
      // 🆕 CREAR OBJETO DEL PEDIDO PARA FIREBASE
      const orderData = {
        // Información básica del pedido
        orderNumber: generateOrderNumber(),
        userId: currentUser.uid,
        userEmail: currentUser.email,
        status: 'pending', // pending, processing, shipped, delivered, cancelled
        
        // Items del pedido
        items: cartItems.map(item => ({
          productId: item.productId || item.id,
          productName: item.productName || item.name,
          productImage: item.productImage || item.image,
          unitPrice: parseFloat(item.unitPrice) || parseFloat(item.price) || 0,
          quantity: parseInt(item.quantity) || 1,
          size: item.size || null,
          color: item.color || null,
          totalPrice: (parseFloat(item.unitPrice) || parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)
        })),
        
        // Totales
        totals: {
          subtotal: totals.subtotal,
          tax: totals.tax,
          shipping: totals.shipping,
          total: totals.total,
          itemCount: cartItems.length
        },
        
        // Dirección de envío
        shippingAddress: {
          firstName: selectedAddress.firstName,
          lastName: selectedAddress.lastName,
          address1: selectedAddress.address1,
          address2: selectedAddress.address2 || '',
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: selectedAddress.postalCode,
          country: selectedAddress.country,
          phone: selectedAddress.phone || ''
        },
        
        // Método de pago
        paymentMethod: {
          type: selectedPaymentMethod.type,
          name: selectedPaymentMethod.name,
          ...(selectedPaymentMethod.type === 'card' ? {
            lastFourDigits: selectedPaymentMethod.lastFourDigits,
            cardType: selectedPaymentMethod.cardType,
            cardholderName: selectedPaymentMethod.cardholderName
          } : {
            description: selectedPaymentMethod.description
          })
        },
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // Información adicional para el admin
        adminNotes: '',
        trackingNumber: '',
        estimatedDelivery: null,
        
        // Metadatos
        platform: 'mobile',
        version: '1.0.0'
      };

      console.log('📄 Datos del pedido a guardar:', orderData);

      // 🆕 GUARDAR PEDIDO EN FIREBASE
      const ordersRef = collection(db, 'orders');
      const docRef = await addDoc(ordersRef, orderData);
      
      console.log('✅ Pedido guardado en Firebase con ID:', docRef.id);

      // 🆕 LIMPIAR CARRITO DE FIREBASE
      await clearCartFromFirebase();
      
      // Mostrar confirmación
      Alert.alert(
        'Pedido Confirmado',
        `Tu pedido #${orderData.orderNumber} ha sido procesado exitosamente. Recibirás un email de confirmación.`,
        [
          {
            text: 'Ver Mis Pedidos',
            onPress: () => {
              try {
                navigation.navigate('UserTabs', { screen: 'Orders' });
              } catch (navError) {
                console.log('⚠️ Error navegando a Orders, usando fallback');
                navigation.navigate('Shop');
              }
            }
          },
          {
            text: 'Ir a Tienda',
            onPress: () => navigation.navigate('UserTabs', { screen: 'Shop' }),
            style: 'cancel'
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Error processing order:', error);
      Alert.alert(
        'Error al Procesar Pedido', 
        'No se pudo procesar tu pedido. Por favor, inténtalo de nuevo o contacta al soporte.',
        [
          { text: 'Reintentar', onPress: () => processOrder() },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    } finally {
      setProcessing(false);
    }
  };

  // ✅ RENDERIZAR PASO DE DIRECCIÓN
  const renderAddressStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Dirección de Envío</Text>
      
      {savedAddresses.length > 0 ? (
        <>
          {/* ✅ DIRECCIONES GUARDADAS */}
          <ScrollView style={styles.savedItemsContainer} showsVerticalScrollIndicator={false}>
            {savedAddresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={[
                  styles.savedItemCard,
                  selectedAddress?.id === address.id && styles.selectedItemCard
                ]}
                onPress={() => setSelectedAddress(address)}
              >
                <View style={styles.savedItemHeader}>
                  <View style={styles.savedItemLeft}>
                    <Ionicons 
                      name={selectedAddress?.id === address.id ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={selectedAddress?.id === address.id ? "#3B82F6" : "#9CA3AF"} 
                    />
                    <Text style={styles.savedItemName}>
                      {address.firstName} {address.lastName}
                    </Text>
                    {address.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Por defecto</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.savedItemInfo}>
                  <Text style={styles.savedItemAddress}>
                    {address.address1}
                    {address.address2 && `, ${address.address2}`}
                  </Text>
                  <Text style={styles.savedItemCity}>
                    {address.city}, {address.state} {address.postalCode}
                  </Text>
                  <Text style={styles.savedItemCountry}>{address.country}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* ✅ BOTÓN AGREGAR NUEVA DIRECCIÓN */}
          <TouchableOpacity
            style={styles.addNewButton}
            onPress={() => setShowAddressForm(true)}
          >
            <Ionicons name="add" size={20} color="#3B82F6" />
            <Text style={styles.addNewButtonText}>Agregar Nueva Dirección</Text>
          </TouchableOpacity>
        </>
      ) : (
        // ✅ ESTADO VACÍO
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No tienes direcciones guardadas</Text>
          <Text style={styles.emptyStateSubtitle}>
            Agrega una dirección para continuar con tu pedido
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => setShowAddressForm(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.emptyStateButtonText}>Agregar Dirección</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // 🆕 RENDERIZAR PASO DE PAGO CON OPCIONES EN EFECTIVO
  const renderPaymentStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Método de Pago</Text>
      
      {/* 🆕 OPCIONES DE PAGO EN EFECTIVO */}
      <View style={styles.paymentSection}>
        <Text style={styles.paymentSectionTitle}>Pago en Efectivo</Text>
        {cashPaymentOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.savedItemCard,
              selectedPaymentMethod?.id === option.id && styles.selectedItemCard
            ]}
            onPress={() => setSelectedPaymentMethod(option)}
          >
            <View style={styles.savedItemHeader}>
              <View style={styles.savedItemLeft}>
                <Ionicons 
                  name={selectedPaymentMethod?.id === option.id ? "radio-button-on" : "radio-button-off"} 
                  size={20} 
                  color={selectedPaymentMethod?.id === option.id ? "#3B82F6" : "#9CA3AF"} 
                />
                <View style={styles.cardIcon}>
                  <Ionicons name={option.icon} size={20} color="#10B981" />
                </View>
                <Text style={styles.savedItemName}>{option.name}</Text>
                {option.fee === 0 && (
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>Gratis</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.savedItemInfo}>
              <Text style={styles.savedItemAddress}>{option.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ✅ MÉTODOS DE PAGO CON TARJETA */}
      {savedPaymentMethods.length > 0 && (
        <View style={styles.paymentSection}>
          <Text style={styles.paymentSectionTitle}>Tarjetas Guardadas</Text>
          <ScrollView style={styles.savedItemsContainer} showsVerticalScrollIndicator={false}>
            {savedPaymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.savedItemCard,
                  selectedPaymentMethod?.id === method.id && styles.selectedItemCard
                ]}
                onPress={() => setSelectedPaymentMethod(method)}
              >
                <View style={styles.savedItemHeader}>
                  <View style={styles.savedItemLeft}>
                    <Ionicons 
                      name={selectedPaymentMethod?.id === method.id ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={selectedPaymentMethod?.id === method.id ? "#3B82F6" : "#9CA3AF"} 
                    />
                    <View style={styles.cardIcon}>
                      <Ionicons name="card" size={20} color="#6B7280" />
                    </View>
                    <Text style={styles.savedItemName}>
                      •••• •••• •••• {method.lastFourDigits}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.savedItemInfo}>
                  <Text style={styles.savedItemAddress}>{method.cardholderName}</Text>
                  <Text style={styles.savedItemCity}>
                    {method.cardType.charAt(0).toUpperCase() + method.cardType.slice(1)} • 
                    Vence {method.expiryMonth}/{method.expiryYear}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* ✅ BOTÓN AGREGAR NUEVA TARJETA */}
      <TouchableOpacity
        style={styles.addNewButton}
        onPress={() => setShowPaymentForm(true)}
      >
        <Ionicons name="add" size={20} color="#3B82F6" />
        <Text style={styles.addNewButtonText}>Agregar Nueva Tarjeta</Text>
      </TouchableOpacity>
    </View>
  );

  // 🆕 RENDERIZAR PASO DE CONFIRMACIÓN CON VALORES CORRECTOS PARA FIREBASE
  const renderConfirmationStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Confirmar Pedido</Text>
      
      {/* ✅ RESUMEN DE DIRECCIÓN */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="location" size={20} color="#3B82F6" />
          <Text style={styles.summaryTitle}>Dirección de Envío</Text>
        </View>
        <Text style={styles.summaryText}>
          {selectedAddress?.firstName} {selectedAddress?.lastName}
        </Text>
        <Text style={styles.summaryText}>{selectedAddress?.address1}</Text>
        {selectedAddress?.address2 && (
          <Text style={styles.summaryText}>{selectedAddress.address2}</Text>
        )}
        <Text style={styles.summaryText}>
          {selectedAddress?.city}, {selectedAddress?.state} {selectedAddress?.postalCode}
        </Text>
      </View>

      {/* ✅ RESUMEN DE PAGO */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons 
            name={selectedPaymentMethod?.type === 'cash' ? selectedPaymentMethod.icon : "card"} 
            size={20} 
            color="#10B981" 
          />
          <Text style={styles.summaryTitle}>Método de Pago</Text>
        </View>
        {selectedPaymentMethod?.type === 'cash' ? (
          <>
            <Text style={styles.summaryText}>{selectedPaymentMethod.name}</Text>
            <Text style={styles.summaryText}>{selectedPaymentMethod.description}</Text>
          </>
        ) : (
          <>
            <Text style={styles.summaryText}>
              •••• •••• •••• {selectedPaymentMethod?.lastFourDigits}
            </Text>
            <Text style={styles.summaryText}>
              {selectedPaymentMethod?.cardholderName}
            </Text>
          </>
        )}
      </View>

      {/* 🆕 RESUMEN DE PRODUCTOS CON VALORES CORRECTOS PARA FIREBASE */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="bag" size={20} color="#F59E0B" />
          <Text style={styles.summaryTitle}>Productos ({cartItems.length})</Text>
        </View>
        {cartItems.map((item, index) => {
          // 🆕 CALCULAR PRECIO CORRECTO PARA MOSTRAR - COMPATIBLE CON FIREBASE
          let displayPrice = 0;
          let displayQuantity = parseInt(item.quantity) || 1;
          let displayName = item.productName || item.name || 'Producto';
          
          if (item.unitPrice !== undefined && item.unitPrice !== null) {
            // Estructura de Firebase
            const unitPrice = parseFloat(item.unitPrice) || 0;
            displayPrice = unitPrice * displayQuantity;
          } else if (item.totalPrice !== undefined && item.totalPrice !== null) {
            displayPrice = parseFloat(item.totalPrice) || 0;
          } else if (item.price !== undefined && item.price !== null) {
            const unitPrice = parseFloat(item.price) || 0;
            displayPrice = unitPrice * displayQuantity;
          }
          
          return (
            <View key={index} style={styles.productSummaryItem}>
              <View style={styles.productSummaryLeft}>
                <Text style={styles.productSummaryName}>{displayName}</Text>
                {item.size && (
                  <Text style={styles.productSummaryDetails}>Talla: {item.size}</Text>
                )}
                {item.color && (
                  <Text style={styles.productSummaryDetails}>Color: {item.color}</Text>
                )}
              </View>
              <View style={styles.productSummaryRight}>
                <Text style={styles.productSummaryPrice}>
                  ${displayPrice.toFixed(2)}
                </Text>
                <Text style={styles.productSummaryQuantity}>
                  Cantidad: {displayQuantity}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        
        <Text style={styles.headerTitle}>Finalizar Compra</Text>
        
        <View style={{ width: 24 }} />
      </View>

      {/* ✅ INDICADOR DE PASOS */}
      <View style={styles.stepsIndicator}>
        {[1, 2, 3].map((stepNumber) => (
          <View key={stepNumber} style={styles.stepIndicatorContainer}>
            <View style={[
              styles.stepIndicator,
              step >= stepNumber && styles.stepIndicatorActive
            ]}>
              <Text style={[
                styles.stepIndicatorText,
                step >= stepNumber && styles.stepIndicatorTextActive
              ]}>
                {stepNumber}
              </Text>
            </View>
            <Text style={styles.stepIndicatorLabel}>
              {stepNumber === 1 ? 'Dirección' : stepNumber === 2 ? 'Pago' : 'Confirmar'}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* ✅ RENDERIZAR PASO ACTUAL */}
        {step === 1 && renderAddressStep()}
        {step === 2 && renderPaymentStep()}
        {step === 3 && renderConfirmationStep()}
      </ScrollView>

      {/* 🆕 RESUMEN DE TOTALES CON VALORES CORRECTOS */}
      <View style={styles.totalsContainer}>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Subtotal</Text>
          <Text style={styles.totalsValue}>${totals.subtotal.toFixed(2)}</Text>
        </View>
        
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Impuestos (10%)</Text>
          <Text style={styles.totalsValue}>${totals.tax.toFixed(2)}</Text>
        </View>
        
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Envío</Text>
          <Text style={styles.totalsValue}>
            {totals.shipping === 0 ? 'Gratis' : `$${totals.shipping.toFixed(2)}`}
          </Text>
        </View>
        
        <View style={[styles.totalsRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total a Pagar</Text>
          <Text style={styles.totalValue}>${totals.total.toFixed(2)}</Text>
        </View>

        {/* 🆕 INFORMACIÓN ADICIONAL PARA PAGO EN EFECTIVO */}
        {selectedPaymentMethod?.type === 'cash' && (
          <View style={styles.cashInfoContainer}>
            <Ionicons name="information-circle" size={16} color="#F59E0B" />
            <Text style={styles.cashInfoText}>
              {selectedPaymentMethod.id === 'cash_on_delivery' 
                ? 'Pagarás en efectivo al recibir tu pedido'
                : 'Pagarás en efectivo al recoger en tienda'
              }
            </Text>
          </View>
        )}
      </View>

      {/* ✅ BOTONES DE ACCIÓN */}
      <View style={styles.actionButtons}>
        {step > 1 && (
          <TouchableOpacity
            style={styles.backStepButton}
            onPress={previousStep}
          >
            <Text style={styles.backStepButtonText}>Atrás</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.nextButton, step === 1 && styles.nextButtonFull]}
          onPress={step === 3 ? processOrder : nextStep}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {step === 3 ? 'Confirmar Pedido' : 'Continuar'}
              </Text>
              {step < 3 && <Ionicons name="arrow-forward" size={20} color="#fff" />}
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ✅ MODAL DE FORMULARIO DE DIRECCIÓN */}
      <Modal
        visible={showAddressForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddressForm(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAddressForm(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Nueva Dirección</Text>
            
            <View style={{ width: 24 }} />
          </View>

          <AddressForm
            onSubmit={handleNewAddress}
            loading={addressFormLoading}
            showSaveOption={true}
            style={styles.form}
          />
        </SafeAreaView>
      </Modal>

      {/* ✅ MODAL DE FORMULARIO DE PAGO */}
      <Modal
        visible={showPaymentForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaymentForm(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPaymentForm(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Nuevo Método de Pago</Text>
            
            <View style={{ width: 24 }} />
          </View>

          <PaymentForm
            onSubmit={handleNewPaymentMethod}
            loading={paymentFormLoading}
            style={styles.form}
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

  // ✅ STEPS INDICATOR
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 40,
  },
  stepIndicatorContainer: {
    alignItems: 'center',
    gap: 8,
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicatorActive: {
    backgroundColor: '#3B82F6',
  },
  stepIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepIndicatorTextActive: {
    color: '#fff',
  },
  stepIndicatorLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // ✅ SCROLL CONTAINER
  scrollContainer: {
    flex: 1,
  },

  // ✅ STEP CONTAINER
  stepContainer: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },

  // 🆕 ESTILOS PARA SECCIONES DE PAGO
  paymentSection: {
    marginBottom: 24,
  },
  paymentSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },

  // ✅ SAVED ITEMS
  savedItemsContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  savedItemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedItemCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  savedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  savedItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  defaultBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  // 🆕 BADGE PARA OPCIONES GRATIS
  freeBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  savedItemInfo: {
    marginLeft: 32,
  },
  savedItemAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  savedItemCity: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  savedItemCountry: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardIcon: {
    width: 32,
    height: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ✅ ADD NEW BUTTON
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  addNewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },

  // ✅ EMPTY STATE
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
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

  // ✅ SUMMARY CARDS
  summaryCard: {
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
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },

  // 🆕 ESTILOS MEJORADOS PARA PRODUCTOS
  productSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productSummaryLeft: {
    flex: 1,
    marginRight: 12,
  },
  productSummaryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productSummaryDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  productSummaryRight: {
    alignItems: 'flex-end',
  },
  productSummaryPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  productSummaryQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },

  // ✅ TOTALS
  totalsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalsValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },

  // 🆕 INFORMACIÓN PARA PAGO EN EFECTIVO
  cashInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  cashInfoText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },

  // ✅ ACTION BUTTONS
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  backStepButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  backStepButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  form: {
    flex: 1,
  },
});

export default CheckoutScreen;

