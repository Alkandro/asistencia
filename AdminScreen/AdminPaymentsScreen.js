// // AdminPaymentsScreen.js - Panel de administración completo para pagos
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   Alert,
//   Modal,
//   TextInput,
//   ActivityIndicator,
//   SafeAreaView,
//   RefreshControl,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { 
//   collection, 
//   query, 
//   orderBy, 
//   onSnapshot, 
//   updateDoc, 
//   doc, 
//   where,
//   Timestamp 
// } from 'firebase/firestore';
// import { db } from '../firebase';

// const AdminPaymentsScreen = () => {
//   // Estados principales
//   const [payments, setPayments] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
  
//   // Estados de filtros
//   const [selectedFilter, setSelectedFilter] = useState('all');
//   const [searchQuery, setSearchQuery] = useState('');
  
//   // Estados de modales
//   const [selectedPayment, setSelectedPayment] = useState(null);
//   const [detailModalVisible, setDetailModalVisible] = useState(false);
//   const [refundModalVisible, setRefundModalVisible] = useState(false);
//   const [refundAmount, setRefundAmount] = useState('');
//   const [refundReason, setRefundReason] = useState('');
  
//   // Estados de estadísticas
//   const [stats, setStats] = useState({
//     totalPayments: 0,
//     successfulPayments: 0,
//     failedPayments: 0,
//     pendingPayments: 0,
//     totalRevenue: 0,
//     todayRevenue: 0
//   });

//   // 🔄 CARGAR PAGOS DESDE FIREBASE
//   useEffect(() => {
//     console.log('💳 Configurando listener para pagos...');
    
//     const paymentsRef = collection(db, 'orders');
//     const paymentsQuery = query(
//       paymentsRef,
//       orderBy('createdAt', 'desc')
//     );

//     const unsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
//       const paymentsList = [];
//       let totalRevenue = 0;
//       let todayRevenue = 0;
//       let successfulCount = 0;
//       let failedCount = 0;
//       let pendingCount = 0;
      
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);

//       snapshot.forEach((doc) => {
//         const data = doc.data();
//         const payment = { id: doc.id, ...data };
//         paymentsList.push(payment);

//         // Calcular estadísticas
//         const paymentDate = data.createdAt?.toDate() || new Date();
//         const amount = data.totals?.total || 0;

//         if (data.paymentStatus === 'paid' || data.paymentStatus === 'succeeded') {
//           totalRevenue += amount;
//           successfulCount++;
          
//           if (paymentDate >= today) {
//             todayRevenue += amount;
//           }
//         } else if (data.paymentStatus === 'failed' || data.paymentStatus === 'canceled') {
//           failedCount++;
//         } else {
//           pendingCount++;
//         }
//       });

//       setPayments(paymentsList);
//       setStats({
//         totalPayments: paymentsList.length,
//         successfulPayments: successfulCount,
//         failedPayments: failedCount,
//         pendingPayments: pendingCount,
//         totalRevenue: totalRevenue,
//         todayRevenue: todayRevenue
//       });
      
//       setLoading(false);
//       console.log('💳 Pagos cargados:', paymentsList.length);
//     }, (error) => {
//       console.error('❌ Error cargando pagos:', error);
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   // 🎨 OBTENER COLOR DEL ESTADO DE PAGO
//   const getPaymentStatusColor = (status) => {
//     switch (status) {
//       case 'paid':
//       case 'succeeded':
//         return '#10B981';
//       case 'pending':
//         return '#F59E0B';
//       case 'failed':
//       case 'canceled':
//         return '#EF4444';
//       case 'refunded':
//         return '#6B7280';
//       default:
//         return '#9CA3AF';
//     }
//   };

//   // 🎨 OBTENER ETIQUETA DEL ESTADO
//   const getPaymentStatusLabel = (status) => {
//     switch (status) {
//       case 'paid':
//       case 'succeeded':
//         return 'Exitoso';
//       case 'pending':
//         return 'Pendiente';
//       case 'failed':
//         return 'Fallido';
//       case 'canceled':
//         return 'Cancelado';
//       case 'refunded':
//         return 'Reembolsado';
//       default:
//         return 'Desconocido';
//     }
//   };

//   // 🎨 OBTENER ICONO DEL MÉTODO DE PAGO
//   const getPaymentMethodIcon = (method) => {
//     switch (method) {
//       case 'stripe':
//         return 'card-outline';
//       case 'cash_on_delivery':
//         return 'cash-outline';
//       case 'paypal':
//         return 'logo-paypal';
//       default:
//         return 'help-circle-outline';
//     }
//   };

//   // 🎨 OBTENER ETIQUETA DEL MÉTODO DE PAGO
//   const getPaymentMethodLabel = (method) => {
//     switch (method) {
//       case 'stripe':
//         return 'Tarjeta';
//       case 'cash_on_delivery':
//         return 'Contraentrega';
//       case 'paypal':
//         return 'PayPal';
//       default:
//         return 'Otro';
//     }
//   };

//   // 🔄 ACTUALIZAR ESTADO DE PAGO
//   const updatePaymentStatus = async (paymentId, newStatus) => {
//     try {
//       console.log('🔄 Actualizando estado de pago:', paymentId, 'a', newStatus);
      
//       await updateDoc(doc(db, 'orders', paymentId), {
//         paymentStatus: newStatus,
//         updatedAt: new Date()
//       });
      
//       Alert.alert('✅ Éxito', 'Estado de pago actualizado correctamente');
      
//     } catch (error) {
//       console.error('❌ Error actualizando estado:', error);
//       Alert.alert('Error', 'No se pudo actualizar el estado del pago');
//     }
//   };

//   // 💰 PROCESAR REEMBOLSO
//   const processRefund = async () => {
//     try {
//       if (!selectedPayment || !refundAmount) {
//         Alert.alert('Error', 'Datos de reembolso incompletos');
//         return;
//       }

//       const amount = parseFloat(refundAmount);
//       const maxAmount = selectedPayment.totals?.total || 0;

//       if (amount <= 0 || amount > maxAmount) {
//         Alert.alert('Error', `El monto debe ser entre $0.01 y $${maxAmount.toFixed(2)}`);
//         return;
//       }

//       console.log('💰 Procesando reembolso:', {
//         paymentId: selectedPayment.id,
//         amount: amount,
//         reason: refundReason
//       });

//       // En producción, aquí harías la llamada a Stripe para procesar el reembolso
//       // const refund = await stripe.refunds.create({
//       //   payment_intent: selectedPayment.paymentIntentId,
//       //   amount: Math.round(amount * 100), // Stripe usa centavos
//       //   reason: 'requested_by_customer'
//       // });

//       // Actualizar en Firebase
//       await updateDoc(doc(db, 'orders', selectedPayment.id), {
//         paymentStatus: 'refunded',
//         refundAmount: amount,
//         refundReason: refundReason,
//         refundDate: new Date(),
//         updatedAt: new Date()
//       });

//       setRefundModalVisible(false);
//       setRefundAmount('');
//       setRefundReason('');
//       setSelectedPayment(null);
      
//       Alert.alert('✅ Reembolso Procesado', `Se ha procesado un reembolso de $${amount.toFixed(2)}`);

//     } catch (error) {
//       console.error('❌ Error procesando reembolso:', error);
//       Alert.alert('Error', 'No se pudo procesar el reembolso');
//     }
//   };

//   // 🔍 FILTRAR PAGOS
//   const getFilteredPayments = () => {
//     let filtered = payments;

//     // Filtrar por estado
//     if (selectedFilter !== 'all') {
//       filtered = filtered.filter(payment => {
//         switch (selectedFilter) {
//           case 'successful':
//             return payment.paymentStatus === 'paid' || payment.paymentStatus === 'succeeded';
//           case 'pending':
//             return payment.paymentStatus === 'pending';
//           case 'failed':
//             return payment.paymentStatus === 'failed' || payment.paymentStatus === 'canceled';
//           case 'refunded':
//             return payment.paymentStatus === 'refunded';
//           default:
//             return true;
//         }
//       });
//     }

//     // Filtrar por búsqueda
//     if (searchQuery.trim()) {
//       const query = searchQuery.toLowerCase();
//       filtered = filtered.filter(payment => 
//         payment.orderNumber?.toLowerCase().includes(query) ||
//         payment.userEmail?.toLowerCase().includes(query) ||
//         payment.paymentIntentId?.toLowerCase().includes(query)
//       );
//     }

//     return filtered;
//   };

//   // 🎨 RENDERIZAR ESTADÍSTICAS
//   const renderStats = () => (
//     <View style={styles.statsContainer}>
//       <View style={styles.statsRow}>
//         <View style={[styles.statCard, styles.statCardRevenue]}>
//           <Ionicons name="trending-up" size={24} color="#10B981" />
//           <Text style={styles.statValue}>${stats.totalRevenue.toFixed(2)}</Text>
//           <Text style={styles.statLabel}>Ingresos Totales</Text>
//         </View>
        
//         <View style={[styles.statCard, styles.statCardToday]}>
//           <Ionicons name="today" size={24} color="#3B82F6" />
//           <Text style={styles.statValue}>${stats.todayRevenue.toFixed(2)}</Text>
//           <Text style={styles.statLabel}>Hoy</Text>
//         </View>
//       </View>
      
//       <View style={styles.statsRow}>
//         <View style={styles.statCardSmall}>
//           <Text style={[styles.statValueSmall, { color: '#10B981' }]}>{stats.successfulPayments}</Text>
//           <Text style={styles.statLabelSmall}>Exitosos</Text>
//         </View>
        
//         <View style={styles.statCardSmall}>
//           <Text style={[styles.statValueSmall, { color: '#F59E0B' }]}>{stats.pendingPayments}</Text>
//           <Text style={styles.statLabelSmall}>Pendientes</Text>
//         </View>
        
//         <View style={styles.statCardSmall}>
//           <Text style={[styles.statValueSmall, { color: '#EF4444' }]}>{stats.failedPayments}</Text>
//           <Text style={styles.statLabelSmall}>Fallidos</Text>
//         </View>
        
//         <View style={styles.statCardSmall}>
//           <Text style={[styles.statValueSmall, { color: '#6B7280' }]}>{stats.totalPayments}</Text>
//           <Text style={styles.statLabelSmall}>Total</Text>
//         </View>
//       </View>
//     </View>
//   );

//   // 🎨 RENDERIZAR FILTROS
//   const renderFilters = () => (
//     <View style={styles.filtersContainer}>
//       <View style={styles.filterButtons}>
//         {[
//           { key: 'all', label: 'Todos' },
//           { key: 'successful', label: 'Exitosos' },
//           { key: 'pending', label: 'Pendientes' },
//           { key: 'failed', label: 'Fallidos' },
//           { key: 'refunded', label: 'Reembolsados' }
//         ].map((filter) => (
//           <TouchableOpacity
//             key={filter.key}
//             style={[
//               styles.filterButton,
//               selectedFilter === filter.key && styles.filterButtonActive
//             ]}
//             onPress={() => setSelectedFilter(filter.key)}
//           >
//             <Text style={[
//               styles.filterButtonText,
//               selectedFilter === filter.key && styles.filterButtonTextActive
//             ]}>
//               {filter.label}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>
      
//       <View style={styles.searchContainer}>
//         <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Buscar por pedido, email o ID..."
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           placeholderTextColor="#9CA3AF"
//         />
//         {searchQuery.length > 0 && (
//           <TouchableOpacity onPress={() => setSearchQuery('')}>
//             <Ionicons name="close-circle" size={20} color="#6B7280" />
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   );

//   // 🎨 RENDERIZAR ITEM DE PAGO
//   const renderPaymentItem = ({ item }) => (
//     <TouchableOpacity
//       style={styles.paymentCard}
//       onPress={() => {
//         setSelectedPayment(item);
//         setDetailModalVisible(true);
//       }}
//     >
//       <View style={styles.paymentHeader}>
//         <View style={styles.paymentInfo}>
//           <Text style={styles.paymentOrderNumber}>{item.orderNumber}</Text>
//           <Text style={styles.paymentEmail}>{item.userEmail}</Text>
//         </View>
        
//         <View style={styles.paymentAmount}>
//           <Text style={styles.paymentAmountText}>${(item.totals?.total || 0).toFixed(2)}</Text>
//           <View style={[styles.paymentStatus, { backgroundColor: getPaymentStatusColor(item.paymentStatus) }]}>
//             <Text style={styles.paymentStatusText}>{getPaymentStatusLabel(item.paymentStatus)}</Text>
//           </View>
//         </View>
//       </View>
      
//       <View style={styles.paymentDetails}>
//         <View style={styles.paymentMethod}>
//           <Ionicons name={getPaymentMethodIcon(item.paymentMethod)} size={16} color="#6B7280" />
//           <Text style={styles.paymentMethodText}>{getPaymentMethodLabel(item.paymentMethod)}</Text>
//         </View>
        
//         <Text style={styles.paymentDate}>
//           {item.createdAt?.toDate().toLocaleDateString('es-ES', {
//             day: '2-digit',
//             month: '2-digit',
//             year: '2-digit',
//             hour: '2-digit',
//             minute: '2-digit'
//           })}
//         </Text>
//       </View>
//     </TouchableOpacity>
//   );

//   // 🎨 RENDERIZAR MODAL DE DETALLES
//   const renderDetailModal = () => (
//     <Modal
//       visible={detailModalVisible}
//       animationType="slide"
//       presentationStyle="pageSheet"
//     >
//       <SafeAreaView style={styles.modalContainer}>
//         <View style={styles.modalHeader}>
//           <Text style={styles.modalTitle}>Detalles del Pago</Text>
//           <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
//             <Ionicons name="close" size={24} color="#6B7280" />
//           </TouchableOpacity>
//         </View>
        
//         {selectedPayment && (
//           <View style={styles.modalContent}>
//             {/* Información básica */}
//             <View style={styles.detailSection}>
//               <Text style={styles.detailSectionTitle}>Información General</Text>
//               <View style={styles.detailRow}>
//                 <Text style={styles.detailLabel}>Número de Pedido:</Text>
//                 <Text style={styles.detailValue}>{selectedPayment.orderNumber}</Text>
//               </View>
//               <View style={styles.detailRow}>
//                 <Text style={styles.detailLabel}>Cliente:</Text>
//                 <Text style={styles.detailValue}>{selectedPayment.userEmail}</Text>
//               </View>
//               <View style={styles.detailRow}>
//                 <Text style={styles.detailLabel}>Fecha:</Text>
//                 <Text style={styles.detailValue}>
//                   {selectedPayment.createdAt?.toDate().toLocaleString('es-ES')}
//                 </Text>
//               </View>
//             </View>

//             {/* Información de pago */}
//             <View style={styles.detailSection}>
//               <Text style={styles.detailSectionTitle}>Información de Pago</Text>
//               <View style={styles.detailRow}>
//                 <Text style={styles.detailLabel}>Método:</Text>
//                 <Text style={styles.detailValue}>{getPaymentMethodLabel(selectedPayment.paymentMethod)}</Text>
//               </View>
//               <View style={styles.detailRow}>
//                 <Text style={styles.detailLabel}>Estado:</Text>
//                 <View style={[styles.detailStatus, { backgroundColor: getPaymentStatusColor(selectedPayment.paymentStatus) }]}>
//                   <Text style={styles.detailStatusText}>{getPaymentStatusLabel(selectedPayment.paymentStatus)}</Text>
//                 </View>
//               </View>
//               <View style={styles.detailRow}>
//                 <Text style={styles.detailLabel}>Monto Total:</Text>
//                 <Text style={[styles.detailValue, styles.detailAmount]}>
//                   ${(selectedPayment.totals?.total || 0).toFixed(2)}
//                 </Text>
//               </View>
//               {selectedPayment.paymentIntentId && (
//                 <View style={styles.detailRow}>
//                   <Text style={styles.detailLabel}>Payment Intent ID:</Text>
//                   <Text style={styles.detailValue}>{selectedPayment.paymentIntentId}</Text>
//                 </View>
//               )}
//             </View>

//             {/* Productos */}
//             <View style={styles.detailSection}>
//               <Text style={styles.detailSectionTitle}>Productos ({selectedPayment.items?.length || 0})</Text>
//               {selectedPayment.items?.map((item, index) => (
//                 <View key={index} style={styles.productRow}>
//                   <Text style={styles.productName}>{item.productName}</Text>
//                   <Text style={styles.productDetails}>
//                     ${(item.unitPrice || 0).toFixed(2)} x {item.quantity || 1}
//                   </Text>
//                   <Text style={styles.productTotal}>
//                     ${((item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)}
//                   </Text>
//                 </View>
//               ))}
//             </View>

//             {/* Acciones */}
//             <View style={styles.modalActions}>
//               {selectedPayment.paymentStatus === 'pending' && (
//                 <TouchableOpacity
//                   style={[styles.actionButton, styles.actionButtonSuccess]}
//                   onPress={() => updatePaymentStatus(selectedPayment.id, 'paid')}
//                 >
//                   <Ionicons name="checkmark" size={20} color="#fff" />
//                   <Text style={styles.actionButtonText}>Marcar como Pagado</Text>
//                 </TouchableOpacity>
//               )}
              
//               {(selectedPayment.paymentStatus === 'paid' || selectedPayment.paymentStatus === 'succeeded') && (
//                 <TouchableOpacity
//                   style={[styles.actionButton, styles.actionButtonRefund]}
//                   onPress={() => {
//                     setDetailModalVisible(false);
//                     setRefundModalVisible(true);
//                   }}
//                 >
//                   <Ionicons name="return-down-back" size={20} color="#fff" />
//                   <Text style={styles.actionButtonText}>Procesar Reembolso</Text>
//                 </TouchableOpacity>
//               )}
              
//               {selectedPayment.paymentStatus === 'pending' && (
//                 <TouchableOpacity
//                   style={[styles.actionButton, styles.actionButtonDanger]}
//                   onPress={() => updatePaymentStatus(selectedPayment.id, 'failed')}
//                 >
//                   <Ionicons name="close" size={20} color="#fff" />
//                   <Text style={styles.actionButtonText}>Marcar como Fallido</Text>
//                 </TouchableOpacity>
//               )}
//             </View>
//           </View>
//         )}
//       </SafeAreaView>
//     </Modal>
//   );

//   // 🎨 RENDERIZAR MODAL DE REEMBOLSO
//   const renderRefundModal = () => (
//     <Modal
//       visible={refundModalVisible}
//       animationType="slide"
//       transparent={true}
//     >
//       <View style={styles.refundModalOverlay}>
//         <View style={styles.refundModalContent}>
//           <Text style={styles.refundModalTitle}>Procesar Reembolso</Text>
          
//           <Text style={styles.refundModalSubtitle}>
//             Pedido: {selectedPayment?.orderNumber}
//           </Text>
//           <Text style={styles.refundModalAmount}>
//             Monto máximo: ${(selectedPayment?.totals?.total || 0).toFixed(2)}
//           </Text>
          
//           <TextInput
//             style={styles.refundInput}
//             placeholder="Monto a reembolsar"
//             value={refundAmount}
//             onChangeText={setRefundAmount}
//             keyboardType="numeric"
//           />
          
//           <TextInput
//             style={[styles.refundInput, styles.refundInputMultiline]}
//             placeholder="Razón del reembolso (opcional)"
//             value={refundReason}
//             onChangeText={setRefundReason}
//             multiline
//             numberOfLines={3}
//           />
          
//           <View style={styles.refundModalActions}>
//             <TouchableOpacity
//               style={[styles.refundButton, styles.refundButtonCancel]}
//               onPress={() => {
//                 setRefundModalVisible(false);
//                 setRefundAmount('');
//                 setRefundReason('');
//               }}
//             >
//               <Text style={styles.refundButtonText}>Cancelar</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[styles.refundButton, styles.refundButtonConfirm]}
//               onPress={processRefund}
//             >
//               <Text style={styles.refundButtonText}>Procesar Reembolso</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );

//   const onRefresh = React.useCallback(() => {
//     setRefreshing(true);
//     setTimeout(() => setRefreshing(false), 1000);
//   }, []);

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#3B82F6" />
//           <Text style={styles.loadingText}>Cargando pagos...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const filteredPayments = getFilteredPayments();

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Gestión de Pagos</Text>
//         <Text style={styles.headerSubtitle}>{filteredPayments.length} pago{filteredPayments.length !== 1 ? 's' : ''}</Text>
//       </View>

//       <FlatList
//         data={filteredPayments}
//         keyExtractor={(item) => item.id}
//         renderItem={renderPaymentItem}
//         ListHeaderComponent={() => (
//           <View>
//             {renderStats()}
//             {renderFilters()}
//           </View>
//         )}
//         contentContainerStyle={styles.listContainer}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//         ListEmptyComponent={() => (
//           <View style={styles.emptyState}>
//             <Ionicons name="card-outline" size={64} color="#D1D5DB" />
//             <Text style={styles.emptyStateTitle}>No hay pagos</Text>
//             <Text style={styles.emptyStateSubtitle}>
//               Los pagos aparecerán aquí cuando los usuarios realicen compras
//             </Text>
//           </View>
//         )}
//       />

//       {renderDetailModal()}
//       {renderRefundModal()}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
//   header: {
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#111827',
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginTop: 4,
//   },
  
//   // Estadísticas
//   statsContainer: {
//     padding: 16,
//   },
//   statsRow: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 12,
//   },
//   statCard: {
//     flex: 1,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     alignItems: 'center',
//   },
//   statCardRevenue: {
//     borderLeftWidth: 4,
//     borderLeftColor: '#10B981',
//   },
//   statCardToday: {
//     borderLeftWidth: 4,
//     borderLeftColor: '#3B82F6',
//   },
//   statValue: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#111827',
//     marginTop: 8,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#6B7280',
//     marginTop: 4,
//   },
//   statCardSmall: {
//     flex: 1,
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     padding: 12,
//     alignItems: 'center',
//   },
//   statValueSmall: {
//     fontSize: 18,
//     fontWeight: '700',
//   },
//   statLabelSmall: {
//     fontSize: 11,
//     color: '#6B7280',
//     marginTop: 2,
//   },
  
//   // Filtros
//   filtersContainer: {
//     paddingHorizontal: 16,
//     paddingBottom: 16,
//   },
//   filterButtons: {
//     flexDirection: 'row',
//     gap: 8,
//     marginBottom: 12,
//   },
//   filterButton: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//     backgroundColor: '#F3F4F6',
//   },
//   filterButtonActive: {
//     backgroundColor: '#3B82F6',
//   },
//   filterButtonText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#6B7280',
//   },
//   filterButtonTextActive: {
//     color: '#fff',
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   searchIcon: {
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     paddingVertical: 12,
//     fontSize: 14,
//     color: '#111827',
//   },
  
//   // Lista
//   listContainer: {
//     paddingBottom: 20,
//   },
//   paymentCard: {
//     backgroundColor: '#fff',
//     marginHorizontal: 16,
//     marginBottom: 12,
//     borderRadius: 12,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   paymentHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 12,
//   },
//   paymentInfo: {
//     flex: 1,
//   },
//   paymentOrderNumber: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#111827',
//     marginBottom: 4,
//   },
//   paymentEmail: {
//     fontSize: 14,
//     color: '#6B7280',
//   },
//   paymentAmount: {
//     alignItems: 'flex-end',
//   },
//   paymentAmountText: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#111827',
//     marginBottom: 4,
//   },
//   paymentStatus: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   paymentStatusText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#fff',
//   },
//   paymentDetails: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   paymentMethod: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   paymentMethodText: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginLeft: 6,
//   },
//   paymentDate: {
//     fontSize: 12,
//     color: '#9CA3AF',
//   },
  
//   // Modal de detalles
//   modalContainer: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#111827',
//   },
//   modalContent: {
//     flex: 1,
//     padding: 16,
//   },
//   detailSection: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 16,
//   },
//   detailSectionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#111827',
//     marginBottom: 12,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 8,
//   },
//   detailLabel: {
//     fontSize: 14,
//     color: '#6B7280',
//     flex: 1,
//   },
//   detailValue: {
//     fontSize: 14,
//     color: '#111827',
//     flex: 1,
//     textAlign: 'right',
//   },
//   detailAmount: {
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   detailStatus: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   detailStatusText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#fff',
//   },
//   productRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F3F4F6',
//   },
//   productName: {
//     flex: 2,
//     fontSize: 14,
//     color: '#111827',
//   },
//   productDetails: {
//     flex: 1,
//     fontSize: 12,
//     color: '#6B7280',
//     textAlign: 'center',
//   },
//   productTotal: {
//     flex: 1,
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#111827',
//     textAlign: 'right',
//   },
//   modalActions: {
//     gap: 12,
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     borderRadius: 8,
//     gap: 8,
//   },
//   actionButtonSuccess: {
//     backgroundColor: '#10B981',
//   },
//   actionButtonRefund: {
//     backgroundColor: '#F59E0B',
//   },
//   actionButtonDanger: {
//     backgroundColor: '#EF4444',
//   },
//   actionButtonText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#fff',
//   },
  
//   // Modal de reembolso
//   refundModalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   refundModalContent: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 20,
//     width: '100%',
//     maxWidth: 400,
//   },
//   refundModalTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#111827',
//     marginBottom: 8,
//   },
//   refundModalSubtitle: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginBottom: 4,
//   },
//   refundModalAmount: {
//     fontSize: 14,
//     color: '#10B981',
//     fontWeight: '600',
//     marginBottom: 16,
//   },
//   refundInput: {
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     fontSize: 14,
//     marginBottom: 12,
//   },
//   refundInputMultiline: {
//     height: 80,
//     textAlignVertical: 'top',
//   },
//   refundModalActions: {
//     flexDirection: 'row',
//     gap: 12,
//     marginTop: 8,
//   },
//   refundButton: {
//     flex: 1,
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   refundButtonCancel: {
//     backgroundColor: '#F3F4F6',
//   },
//   refundButtonConfirm: {
//     backgroundColor: '#F59E0B',
//   },
//   refundButtonText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#111827',
//   },
  
//   // Estados vacíos y carga
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     fontSize: 16,
//     color: '#6B7280',
//     marginTop: 12,
//   },
//   emptyState: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 64,
//   },
//   emptyStateTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#6B7280',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptyStateSubtitle: {
//     fontSize: 14,
//     color: '#9CA3AF',
//     textAlign: 'center',
//     paddingHorizontal: 32,
//   },
// });

// export default AdminPaymentsScreen;




// AdminPaymentsScreen_ADAPTADO.js - Panel de administración de pagos adaptado
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
  TextInput,
  RefreshControl,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  where,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';

const AdminPaymentsScreen = () => {
  // ✅ ESTADOS PRINCIPALES
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  
  // ✅ ESTADOS DE FILTROS
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // ✅ ESTADOS DE ESTADÍSTICAS
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    conversionRate: 0
  });
  
  // ✅ ESTADOS DE MODALES
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentDetail, setShowPaymentDetail] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);

  // ✅ OPCIONES DE FILTRO
  const filterOptions = [
    { id: 'all', label: 'Todos', icon: 'list-outline' },
    { id: 'paid', label: 'Pagados', icon: 'checkmark-circle-outline' },
    { id: 'pending', label: 'Pendientes', icon: 'time-outline' },
    { id: 'failed', label: 'Fallidos', icon: 'close-circle-outline' },
    { id: 'refunded', label: 'Reembolsados', icon: 'return-down-back-outline' },
    { id: 'cash', label: 'Efectivo', icon: 'cash-outline' },
    { id: 'stripe', label: 'Tarjeta', icon: 'card-outline' }
  ];

  // ✅ CARGAR DATOS INICIALES
  useEffect(() => {
    loadPayments();
  }, []);

  // ✅ FILTRAR PAGOS CUANDO CAMBIAN LOS FILTROS
  useEffect(() => {
    filterPayments();
  }, [payments, selectedFilter, searchQuery]);

  // ✅ CARGAR PAGOS DESDE FIREBASE
  const loadPayments = () => {
    try {
      console.log('💳 Cargando pagos desde Firebase...');
      
      // Escuchar cambios en la colección de pedidos (orders)
      const ordersQuery = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        const paymentsData = [];
        
        snapshot.forEach((doc) => {
          const order = { id: doc.id, ...doc.data() };
          
          // Convertir pedido a formato de pago
          const payment = {
            id: order.id,
            orderId: order.id,
            orderNumber: order.orderNumber,
            amount: order.totals?.total || 0,
            currency: 'USD',
            status: mapOrderStatusToPaymentStatus(order.status, order.paymentStatus),
            paymentMethod: order.paymentMethod || 'unknown',
            paymentIntentId: order.paymentIntentId || null,
            customerEmail: order.userEmail,
            customerName: order.shippingAddress?.name || 'Cliente',
            description: `Pedido ${order.orderNumber} - ${order.items?.length || 0} productos`,
            createdAt: order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt),
            updatedAt: order.updatedAt?.toDate ? order.updatedAt.toDate() : new Date(order.updatedAt),
            
            // Información adicional del pedido
            items: order.items || [],
            shippingAddress: order.shippingAddress,
            totals: order.totals,
            
            // Metadatos
            platform: order.platform || 'mobile',
            version: order.version || '1.0.0'
          };
          
          paymentsData.push(payment);
        });
        
        console.log(`💳 ${paymentsData.length} pagos cargados`);
        setPayments(paymentsData);
        calculateStats(paymentsData);
        setLoading(false);
        setRefreshing(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error cargando pagos:', error);
      setLoading(false);
      setRefreshing(false);
      Alert.alert('Error', 'No se pudieron cargar los pagos');
    }
  };

  // ✅ MAPEAR ESTADO DE PEDIDO A ESTADO DE PAGO
  const mapOrderStatusToPaymentStatus = (orderStatus, paymentStatus) => {
    if (paymentStatus) {
      return paymentStatus; // paid, pending, failed, refunded
    }
    
    // Mapear basado en el estado del pedido
    switch (orderStatus) {
      case 'pending':
        return 'pending';
      case 'processing':
      case 'shipped':
      case 'delivered':
        return 'paid';
      case 'cancelled':
        return 'failed';
      default:
        return 'pending';
    }
  };

  // ✅ CALCULAR ESTADÍSTICAS
  const calculateStats = (paymentsData) => {
    const totalRevenue = paymentsData
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalTransactions = paymentsData.length;
    const successfulPayments = paymentsData.filter(p => p.status === 'paid').length;
    const pendingPayments = paymentsData.filter(p => p.status === 'pending').length;
    const failedPayments = paymentsData.filter(p => p.status === 'failed').length;
    
    const conversionRate = totalTransactions > 0 
      ? (successfulPayments / totalTransactions) * 100 
      : 0;

    setStats({
      totalRevenue,
      totalTransactions,
      successfulPayments,
      pendingPayments,
      failedPayments,
      conversionRate
    });
  };

  // ✅ FILTRAR PAGOS
  const filterPayments = () => {
    let filtered = [...payments];
    
    // Filtrar por estado
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'cash') {
        filtered = filtered.filter(p => 
          p.paymentMethod === 'cash_on_delivery' || 
          p.paymentMethod === 'cash_pickup'
        );
      } else if (selectedFilter === 'stripe') {
        filtered = filtered.filter(p => 
          p.paymentMethod === 'stripe' || 
          p.paymentMethod === 'card'
        );
      } else {
        filtered = filtered.filter(p => p.status === selectedFilter);
      }
    }
    
    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.orderNumber?.toLowerCase().includes(query) ||
        p.customerEmail?.toLowerCase().includes(query) ||
        p.customerName?.toLowerCase().includes(query) ||
        p.paymentIntentId?.toLowerCase().includes(query)
      );
    }
    
    setFilteredPayments(filtered);
  };

  // ✅ REFRESCAR DATOS
  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  // ✅ PROCESAR REEMBOLSO
  const processRefund = async () => {
    if (!selectedPayment || !refundAmount) {
      Alert.alert('Error', 'Datos incompletos para el reembolso');
      return;
    }

    try {
      setProcessingRefund(true);
      
      const refundAmountNum = parseFloat(refundAmount);
      if (isNaN(refundAmountNum) || refundAmountNum <= 0 || refundAmountNum > selectedPayment.amount) {
        Alert.alert('Error', 'Monto de reembolso inválido');
        return;
      }

      // En producción, aquí harías la llamada a Stripe para procesar el reembolso
      // const refund = await stripe.refunds.create({
      //   payment_intent: selectedPayment.paymentIntentId,
      //   amount: Math.round(refundAmountNum * 100),
      //   reason: refundReason || 'requested_by_customer'
      // });

      // Actualizar el pedido en Firebase
      await updateDoc(doc(db, 'orders', selectedPayment.orderId), {
        paymentStatus: 'refunded',
        refundAmount: refundAmountNum,
        refundReason: refundReason,
        refundedAt: new Date(),
        updatedAt: new Date()
      });

      // Registrar el reembolso
      await addDoc(collection(db, 'refunds'), {
        orderId: selectedPayment.orderId,
        paymentIntentId: selectedPayment.paymentIntentId,
        amount: refundAmountNum,
        reason: refundReason,
        processedBy: 'admin', // En producción, usar el ID del admin
        processedAt: new Date(),
        status: 'completed'
      });

      Alert.alert('Éxito', 'Reembolso procesado correctamente');
      setShowRefundModal(false);
      setRefundAmount('');
      setRefundReason('');
      setSelectedPayment(null);

    } catch (error) {
      console.error('❌ Error procesando reembolso:', error);
      Alert.alert('Error', 'No se pudo procesar el reembolso');
    } finally {
      setProcessingRefund(false);
    }
  };

  // ✅ OBTENER COLOR DEL ESTADO
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      case 'refunded': return '#6B7280';
      default: return '#6B7280';
    }
  };

  // ✅ OBTENER ICONO DEL ESTADO
  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'failed': return 'close-circle';
      case 'refunded': return 'return-down-back';
      default: return 'help-circle';
    }
  };

  // ✅ OBTENER ETIQUETA DEL ESTADO
  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'pending': return 'Pendiente';
      case 'failed': return 'Fallido';
      case 'refunded': return 'Reembolsado';
      default: return 'Desconocido';
    }
  };

  // ✅ OBTENER ICONO DEL MÉTODO DE PAGO
  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'stripe':
      case 'card': return 'card';
      case 'cash_on_delivery':
      case 'cash_pickup': return 'cash';
      default: return 'help-circle';
    }
  };

  // ✅ OBTENER ETIQUETA DEL MÉTODO DE PAGO
  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'stripe':
      case 'card': return 'Tarjeta';
      case 'cash_on_delivery': return 'Contraentrega';
      case 'cash_pickup': return 'Efectivo en tienda';
      default: return 'Desconocido';
    }
  };

  // ✅ RENDERIZAR ESTADÍSTICAS
  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${stats.totalRevenue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Ingresos Totales</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalTransactions}</Text>
          <Text style={styles.statLabel}>Transacciones</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.conversionRate.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Tasa de Conversión</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pendingPayments}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
      </View>
    </View>
  );

  // ✅ RENDERIZAR FILTROS
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScroll}
      >
        {filterOptions.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              selectedFilter === filter.id && styles.filterChipActive
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Ionicons 
              name={filter.icon} 
              size={16} 
              color={selectedFilter === filter.id ? '#fff' : '#6B7280'} 
            />
            <Text style={[
              styles.filterChipText,
              selectedFilter === filter.id && styles.filterChipTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // ✅ RENDERIZAR TARJETA DE PAGO
  const renderPaymentCard = (payment) => (
    <TouchableOpacity
      key={payment.id}
      style={styles.paymentCard}
      onPress={() => {
        setSelectedPayment(payment);
        setShowPaymentDetail(true);
      }}
    >
      {/* Header del pago */}
      <View style={styles.paymentHeader}>
        <View style={styles.paymentHeaderLeft}>
          <Text style={styles.paymentOrderNumber}>#{payment.orderNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
            <Ionicons name={getStatusIcon(payment.status)} size={12} color="#fff" />
            <Text style={styles.statusBadgeText}>{getStatusLabel(payment.status)}</Text>
          </View>
        </View>
        
        <View style={styles.paymentMethodBadge}>
          <Ionicons name={getPaymentMethodIcon(payment.paymentMethod)} size={14} color="#6B7280" />
          <Text style={styles.paymentMethodText}>{getPaymentMethodLabel(payment.paymentMethod)}</Text>
        </View>
      </View>

      {/* Información del cliente */}
      <View style={styles.paymentInfo}>
        <Text style={styles.customerName}>{payment.customerName}</Text>
        <Text style={styles.customerEmail}>{payment.customerEmail}</Text>
        <Text style={styles.paymentDescription}>{payment.description}</Text>
      </View>

      {/* Total del pago */}
      <View style={styles.paymentTotalContainer}>
        <View style={styles.paymentTotalContent}>
          <Ionicons name="cash-outline" size={16} color="#10B981" />
          <Text style={styles.paymentTotalLabel}>Total:</Text>
          <Text style={styles.paymentTotalValue}>${payment.amount.toFixed(2)}</Text>
        </View>
      </View>

      {/* Footer con fecha */}
      <View style={styles.paymentFooter}>
        <Text style={styles.paymentDate}>
          {payment.createdAt.toLocaleDateString()} • {payment.createdAt.toLocaleTimeString()}
        </Text>
        
        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={() => {
            setSelectedPayment(payment);
            setShowPaymentDetail(true);
          }}
        >
          <Text style={styles.viewDetailsText}>Ver detalles</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // ✅ RENDERIZAR MODAL DE DETALLE
  const renderPaymentDetailModal = () => (
    <Modal
      visible={showPaymentDetail}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowPaymentDetail(false)}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Detalle del Pago</Text>
          <View style={{ width: 24 }} />
        </View>

        {selectedPayment && (
          <ScrollView style={styles.modalContent}>
            {/* Información básica */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Información del Pago</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Número de Pedido:</Text>
                <Text style={styles.detailValue}>{selectedPayment.orderNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estado:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedPayment.status) }]}>
                  <Ionicons name={getStatusIcon(selectedPayment.status)} size={12} color="#fff" />
                  <Text style={styles.statusBadgeText}>{getStatusLabel(selectedPayment.status)}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Método de Pago:</Text>
                <Text style={styles.detailValue}>{getPaymentMethodLabel(selectedPayment.paymentMethod)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Monto:</Text>
                <Text style={styles.detailValue}>${selectedPayment.amount.toFixed(2)}</Text>
              </View>
              {selectedPayment.paymentIntentId && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ID de Transacción:</Text>
                  <Text style={styles.detailValue}>{selectedPayment.paymentIntentId}</Text>
                </View>
              )}
            </View>

            {/* Información del cliente */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Cliente</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nombre:</Text>
                <Text style={styles.detailValue}>{selectedPayment.customerName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{selectedPayment.customerEmail}</Text>
              </View>
            </View>

            {/* Productos */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Productos ({selectedPayment.items?.length || 0})</Text>
              {selectedPayment.items?.map((item, index) => (
                <View key={index} style={styles.productItem}>
                  <Text style={styles.productName}>{item.productName}</Text>
                  <Text style={styles.productDetails}>
                    ${item.unitPrice?.toFixed(2)} x {item.quantity} = ${item.totalPrice?.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Totales */}
            {selectedPayment.totals && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Totales</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Subtotal:</Text>
                  <Text style={styles.detailValue}>${selectedPayment.totals.subtotal?.toFixed(2)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Impuestos:</Text>
                  <Text style={styles.detailValue}>${selectedPayment.totals.tax?.toFixed(2)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Envío:</Text>
                  <Text style={styles.detailValue}>
                    {selectedPayment.totals.shipping === 0 ? 'Gratis' : `$${selectedPayment.totals.shipping?.toFixed(2)}`}
                  </Text>
                </View>
                <View style={[styles.detailRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>${selectedPayment.totals.total?.toFixed(2)}</Text>
                </View>
              </View>
            )}

            {/* Acciones */}
            {selectedPayment.status === 'paid' && (
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.refundButton}
                  onPress={() => {
                    setShowPaymentDetail(false);
                    setShowRefundModal(true);
                  }}
                >
                  <Ionicons name="return-down-back-outline" size={20} color="#fff" />
                  <Text style={styles.refundButtonText}>Procesar Reembolso</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  // ✅ RENDERIZAR MODAL DE REEMBOLSO
  const renderRefundModal = () => (
    <Modal
      visible={showRefundModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.refundModalOverlay}>
        <View style={styles.refundModalContainer}>
          <View style={styles.refundModalHeader}>
            <Text style={styles.refundModalTitle}>Procesar Reembolso</Text>
            <TouchableOpacity onPress={() => setShowRefundModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.refundModalContent}>
            <Text style={styles.refundModalSubtitle}>
              Pedido: {selectedPayment?.orderNumber}
            </Text>
            <Text style={styles.refundModalAmount}>
              Monto máximo: ${selectedPayment?.amount?.toFixed(2)}
            </Text>

            <View style={styles.refundInputGroup}>
              <Text style={styles.refundInputLabel}>Monto a reembolsar *</Text>
              <TextInput
                style={styles.refundInput}
                value={refundAmount}
                onChangeText={setRefundAmount}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.refundInputGroup}>
              <Text style={styles.refundInputLabel}>Razón del reembolso</Text>
              <TextInput
                style={[styles.refundInput, styles.refundTextArea]}
                value={refundReason}
                onChangeText={setRefundReason}
                placeholder="Describe la razón del reembolso..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.refundModalActions}>
              <TouchableOpacity
                style={styles.refundCancelButton}
                onPress={() => setShowRefundModal(false)}
              >
                <Text style={styles.refundCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.refundConfirmButton}
                onPress={processRefund}
                disabled={processingRefund || !refundAmount}
              >
                {processingRefund ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.refundConfirmText}>Procesar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando pagos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Pagos</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <Ionicons name="refresh" size={20} color="#3B82F6" />
          )}
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por pedido, email o ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Estadísticas */}
      {renderStats()}

      {/* Filtros */}
      {renderFilters()}

      {/* Lista de pagos */}
      <ScrollView
        style={styles.paymentsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredPayments.length > 0 ? (
          filteredPayments.map(renderPaymentCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No hay pagos</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery || selectedFilter !== 'all' 
                ? 'No se encontraron pagos con los filtros aplicados'
                : 'Aún no se han procesado pagos'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modales */}
      {renderPaymentDetailModal()}
      {renderRefundModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  refreshButton: {
    padding: 8,
  },
  
  // Búsqueda
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  
  // Estadísticas
  statsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  // Filtros
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersScroll: {
    paddingHorizontal: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  
  // Lista de pagos
  paymentsList: {
    flex: 1,
    padding: 20,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  paymentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentOrderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  paymentMethodText: {
    fontSize: 12,
    color: '#6B7280',
  },
  paymentInfo: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  paymentTotalContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  paymentTotalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  paymentTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paymentDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  
  // Estado vacío
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  
  // Modales
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  
  // Detalles
  detailSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  productItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  productDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Acciones
  actionsContainer: {
    marginTop: 20,
  },
  refundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  refundButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Modal de reembolso
  refundModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refundModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    maxHeight: '80%',
  },
  refundModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  refundModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  refundModalContent: {
    padding: 20,
  },
  refundModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  refundModalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  refundInputGroup: {
    marginBottom: 16,
  },
  refundInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  refundInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  refundTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  refundModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  refundCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  refundCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  refundConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#EF4444',
  },
  refundConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Loading
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
});

export default AdminPaymentsScreen;


