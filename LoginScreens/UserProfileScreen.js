// UserProfileScreen_WITH_PAYMENT_ADDRESS.js - Perfil con acceso a direcciones y métodos de pago
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  Modal,
  SafeAreaView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import ButtonMinimal from "../Styles/ButtonMinimal";
import InputMinimal from "../Styles/InputMinimal";
import CardMinimal from "../Styles/CardMinimal";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useTranslation } from "react-i18next";
import { useNavigation } from '@react-navigation/native';
import Icon from "react-native-vector-icons/Ionicons";

// Mapeo de imágenes de cinturones
const beltImages = {
  white: require("../assets/fotos/whitebelt.png"),
  blue: require("../assets/fotos/bluebelt.png"),
  purple: require("../assets/fotos/purplebelt.png"),
  brown: require("../assets/fotos/brownbelt.png"),
  black: require("../assets/fotos/blackbelt.png"),
};

const getBeltImage = (belt) =>
  beltImages[belt?.toLowerCase()] || beltImages["white"];

const getBeltColor = (belt) => {
  const beltColorMap = {
    white: "#000000",
    blue: "#4285F4",
    purple: "#AA60C8",
    brown: "#8B4513",
    black: "#000000",
  };
  return beltColorMap[belt] || "#333333";
};

const UserProfileScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newData, setNewData] = useState({});
  const [newCinturon, setNewCinturon] = useState("");
  const [imageUri, setImageUri] = useState(null);
  
  // Estados para gestión de compras
  const [addressCount, setAddressCount] = useState(0);
  const [paymentCount, setPaymentCount] = useState(0);

  // Estados para cambio de contraseña
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      const storedImageUri = await AsyncStorage.getItem("userImageUri");
      if (storedImageUri) {
        setImageUri(storedImageUri);
      }
    };
    loadImage();
    fetchUserData();
    loadManagementCounts();
  }, []);

  // Función para cargar contadores de direcciones y métodos de pago
  const loadManagementCounts = async () => {
    try {
      const savedAddresses = await AsyncStorage.getItem('savedAddresses');
      if (savedAddresses) {
        const addresses = JSON.parse(savedAddresses);
        setAddressCount(Array.isArray(addresses) ? addresses.length : 0);
      } else {
        setAddressCount(0);
      }

      const savedCards = await AsyncStorage.getItem('savedCards');
      if (savedCards) {
        const cards = JSON.parse(savedCards);
        setPaymentCount(Array.isArray(cards) ? cards.length : 0);
      } else {
        setPaymentCount(0);
      }
    } catch (error) {
      console.error('Error loading management counts:', error);
      setAddressCount(0);
      setPaymentCount(0);
    }
  };

  // Obtener datos de Firestore
  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log('📊 Datos del usuario cargados:', data); // Debug
          setUserData(data);
        }
      }
    } catch (error) {
      console.error("Error al obtener los datos del usuario:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔧 FUNCIÓN MEJORADA PARA FORMATEAR FECHA DE NACIMIENTO
  const formatBirthDate = (userData) => {
    if (!userData?.fechaNacimiento) {
      return "";
    }

    try {
      let date;
      
      // Si es un timestamp de Firebase
      if (userData.fechaNacimiento.toDate) {
        date = userData.fechaNacimiento.toDate();
      }
      // Si es un string en formato DD/MM/YYYY
      else if (typeof userData.fechaNacimiento === 'string') {
        const parts = userData.fechaNacimiento.split('/');
        if (parts.length === 3) {
          // Convertir DD/MM/YYYY a MM/DD/YYYY para Date constructor
          date = new Date(`${parts[1]}/${parts[0]}/${parts[2]}`);
        } else {
          date = new Date(userData.fechaNacimiento);
        }
      }
      // Si es un número (timestamp)
      else if (typeof userData.fechaNacimiento === 'number') {
        date = new Date(userData.fechaNacimiento);
      }
      // Si ya es un objeto Date
      else if (userData.fechaNacimiento instanceof Date) {
        date = userData.fechaNacimiento;
      }
      else {
        console.log('⚠️ Formato de fecha no reconocido:', userData.fechaNacimiento);
        return "";
      }

      // Verificar que la fecha es válida
      if (isNaN(date.getTime())) {
        console.log('⚠️ Fecha inválida:', userData.fechaNacimiento);
        return "";
      }

      // Formatear la fecha
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

    } catch (error) {
      console.error('❌ Error al formatear fecha:', error, userData.fechaNacimiento);
      return "";
    }
  };

  // Para abrir el modal de edición
  const handleEdit = () => {
    // 🔧 FORMATEAR FECHA PARA EDICIÓN
    let fechaParaEdicion = "";
    if (userData?.fechaNacimiento) {
      fechaParaEdicion = formatBirthDate(userData);
    }

    setNewData({
      nombre: userData?.nombre || '',
      apellido: userData?.apellido || '',
      telefono: userData?.telefono || '',
      direccion: userData?.direccion || '',
      ciudad: userData?.ciudad || '',
      codigoPostal: userData?.codigoPostal || '',
      pais: userData?.pais || '',
      fechaNacimiento: fechaParaEdicion, // ✅ Usar fecha formateada
      genero: userData?.genero || '',
      peso: userData?.peso || '',
      altura: userData?.altura || '',
      emergenciaContacto: userData?.emergenciaContacto || '', // ✅ Incluir datos de emergencia
      emergenciaTelefono: userData?.emergenciaTelefono || '', // ✅ Incluir datos de emergencia
      notas: userData?.notas || '',
    });
    setNewCinturon(userData?.cinturon || 'white');
    setIsEditing(true);
  };

  // 🔧 FUNCIÓN MEJORADA PARA GUARDAR CAMBIOS
  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "users", user.uid);

      // 🔧 PROCESAR FECHA DE NACIMIENTO ANTES DE GUARDAR
      let processedData = { ...newData };
      
      if (newData.fechaNacimiento) {
        // Validar formato DD/MM/YYYY
        const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        const match = newData.fechaNacimiento.match(dateRegex);
        
        if (match) {
          const [, day, month, year] = match;
          // Crear fecha válida
          const date = new Date(year, month - 1, day);
          
          // Verificar que la fecha es válida
          if (!isNaN(date.getTime())) {
            processedData.fechaNacimiento = date.toISOString();
            console.log('✅ Fecha procesada correctamente:', processedData.fechaNacimiento);
          } else {
            console.log('⚠️ Fecha inválida, no se guardará');
            delete processedData.fechaNacimiento;
          }
        } else {
          console.log('⚠️ Formato de fecha incorrecto, no se guardará');
          delete processedData.fechaNacimiento;
        }
      }

      // Si se cambió el cinturón, resetear el contador
      if (newCinturon !== userData.cinturon) {
        processedData.allTimeCheckIns = 0;
      }
      processedData.cinturon = newCinturon;

      console.log('💾 Guardando datos:', processedData); // Debug

      await updateDoc(userDocRef, processedData);
      
      // Actualizar estado local
      setUserData({ ...userData, ...processedData });
      setIsEditing(false);
      
      Alert.alert(t("Éxito"), t("Perfil actualizado correctamente"));
      
      // Recargar datos para asegurar sincronización
      fetchUserData();
      
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      Alert.alert(t("Error"), t("No se pudo actualizar el perfil"));
    }
  };

  // Función para cambiar contraseña
  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert(t("Error"), t("Por favor completa todos los campos"));
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert(t("Error"), t("Las contraseñas nuevas no coinciden"));
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert(t("Error"), t("La nueva contraseña debe tener al menos 6 caracteres"));
      return;
    }

    setPasswordLoading(true);

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error("Usuario no autenticado");
      }

      // Reautenticar al usuario con la contraseña actual
      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Cambiar la contraseña
      await updatePassword(user, passwordData.newPassword);

      // Limpiar el formulario y cerrar modal
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);

      Alert.alert(
        t("Éxito"), 
        t("Contraseña cambiada correctamente"),
        [{ text: t("OK") }]
      );

    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      
      let errorMessage = t("Error al cambiar la contraseña");
      if (error.code === 'auth/wrong-password') {
        errorMessage = t("La contraseña actual es incorrecta");
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t("La nueva contraseña es muy débil");
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = t("Por seguridad, necesitas iniciar sesión nuevamente");
      }

      Alert.alert(t("Error"), errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Funciones de navegación
  const navigateToAddresses = () => {
    navigation.navigate('AddressManagement');
  };

  const navigateToPayments = () => {
    navigation.navigate('PaymentManagement');
  };

  const openChangePasswordModal = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsChangingPassword(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>{t("Cargando perfil...")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header con imagen de perfil */}
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.profileImage} />
            ) : (
              <Image
                source={require("../assets/fotos/tashiro1.png")}
                style={styles.profileImage}
              />
            )}
          </View>
          
          <Text style={styles.userName}>
            {userData?.nombre || userData?.username || t("Usuario")}
          </Text>
          
          <Text style={styles.userEmail}>
            {userData?.email || auth.currentUser?.email}
          </Text>

          {/* Información del cinturón con imagen */}
          <View style={styles.beltContainer}>
            <Image
              source={getBeltImage(userData?.cinturon)}
              style={styles.beltImage}
            />
            <View style={styles.beltInfo}>
              <Text style={[styles.beltText, { color: getBeltColor(userData?.cinturon) }]}>
                {userData?.cinturon?.charAt(0).toUpperCase() + userData?.cinturon?.slice(1) || "White"}
              </Text>
              <Text style={styles.beltSubtext}>
                {t("Entrenamientos")}: {userData?.allTimeCheckIns || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Información completa del usuario */}
        <CardMinimal style={styles.infoCard}>
          <Text style={styles.sectionTitle}>{t("Información Personal")}</Text>
          
          {/* Información Básica */}
          <View style={styles.infoItem}>
            <Icon name="person" size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t("Nombre")}</Text>
              <Text style={styles.infoValue}>{userData?.nombre || t("No registrado")}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Icon name="person" size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t("Apellido")}</Text>
              <Text style={styles.infoValue}>{userData?.apellido || t("No registrado")}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Icon name="mail" size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t("Email")}</Text>
              <Text style={styles.infoValue}>{userData?.email || t("No registrado")}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Icon name="call" size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t("Teléfono")}</Text>
              <Text style={styles.infoValue}>{userData?.telefono || t("No registrado")}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Icon name="calendar" size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t("Fecha de Nacimiento")}</Text>
              <Text style={styles.infoValue}>{formatBirthDate(userData) || t("No registrado")}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Icon name="male-female" size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t("Género")}</Text>
              <Text style={styles.infoValue}>{userData?.genero || t("No registrado")}</Text>
            </View>
          </View>

          {/* Información Física */}
          <View style={styles.infoItem}>
            <Icon name="fitness" size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t("Peso")}</Text>
              <Text style={styles.infoValue}>
                {userData?.peso ? `${userData.peso} kg` : t("No registrado")}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Icon name="resize" size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t("Altura")}</Text>
              <Text style={styles.infoValue}>
                {userData?.altura ? `${userData.altura} cm` : t("No registrado")}
              </Text>
            </View>
          </View>

          {/* Información de Dirección */}
          <View style={styles.infoItem}>
            <Icon name="location" size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t("Dirección")}</Text>
              <Text style={styles.infoValue}>{userData?.direccion || t("No registrado")}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Icon name="business" size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t("Ciudad")}</Text>
              <Text style={styles.infoValue}>{userData?.ciudad || t("No registrado")}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Icon name="mail" size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t("Código Postal")}</Text>
              <Text style={styles.infoValue}>{userData?.codigoPostal || t("No registrado")}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Icon name="flag" size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t("País")}</Text>
              <Text style={styles.infoValue}>{userData?.pais || t("No registrado")}</Text>
            </View>
          </View>

          {/* ✅ INFORMACIÓN DE EMERGENCIA - AHORA SE MUESTRA CORRECTAMENTE */}
          <View style={styles.infoItem}>
            <Icon name="medical" size={20} color="#EF4444" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t("Contacto de Emergencia")}</Text>
              <Text style={styles.infoValue}>
                {userData?.emergenciaContacto || t("No registrado")}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Icon name="call" size={20} color="#EF4444" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t("Teléfono de Emergencia")}</Text>
              <Text style={styles.infoValue}>
                {userData?.emergenciaTelefono || t("No registrado")}
              </Text>
            </View>
          </View>

          {/* Notas */}
          <View style={styles.infoItem}>
            <Icon name="document-text" size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t("Notas")}</Text>
              <Text style={styles.infoValue}>{userData?.notas || t("No registrado")}</Text>
            </View>
          </View>
        </CardMinimal>

        {/* Sección de Gestión de Compras */}
        <CardMinimal style={styles.managementCard}>
          <View style={styles.managementHeader}>
            <Ionicons name="bag-handle" size={24} color="#3B82F6" />
            <Text style={styles.sectionTitle}>{t("Gestión de Compras")}</Text>
          </View>
          
          <Text style={styles.managementSubtitle}>
            {t("Administra tus direcciones y métodos de pago de forma segura")}
          </Text>

          {/* Direcciones de Envío */}
          <TouchableOpacity 
            style={styles.managementItem}
            onPress={navigateToAddresses}
            activeOpacity={0.7}
          >
            <View style={styles.managementItemLeft}>
              <View style={[styles.managementIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="location" size={20} color="#3B82F6" />
              </View>
              <View style={styles.managementItemContent}>
                <Text style={styles.managementItemTitle}>{t("Direcciones de Envío")}</Text>
                <Text style={styles.managementItemSubtitle}>
                  {addressCount > 0 
                    ? t("{{count}} dirección{{plural}} guardada{{plural}}", { 
                        count: addressCount, 
                        plural: addressCount !== 1 ? 'es' : '' 
                      })
                    : t("Agregar dirección de envío")
                  }
                </Text>
              </View>
            </View>
            <View style={styles.managementItemRight}>
              {addressCount > 0 && (
                <View style={[styles.badge, { backgroundColor: '#3B82F6' }]}>
                  <Text style={styles.badgeText}>{addressCount}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          {/* Métodos de Pago */}
          <TouchableOpacity 
            style={styles.managementItem}
            onPress={navigateToPayments}
            activeOpacity={0.7}
          >
            <View style={styles.managementItemLeft}>
              <View style={[styles.managementIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="card" size={20} color="#10B981" />
              </View>
              <View style={styles.managementItemContent}>
                <Text style={styles.managementItemTitle}>{t("Métodos de Pago")}</Text>
                <Text style={styles.managementItemSubtitle}>
                  {paymentCount > 0 
                    ? t("{{count}} método{{plural}} guardado{{plural}}", { 
                        count: paymentCount, 
                        plural: paymentCount !== 1 ? 's' : '' 
                      })
                    : t("Agregar método de pago")
                  }
                </Text>
              </View>
            </View>
            <View style={styles.managementItemRight}>
              {paymentCount > 0 && (
                <View style={[styles.badge, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.badgeText}>{paymentCount}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          {/* Información de seguridad */}
          <View style={styles.securityInfo}>
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text style={styles.securityText}>
              {t("Todos los datos se guardan de forma segura en tu dispositivo")}
            </Text>
          </View>
        </CardMinimal>

        {/* Sección de Cuenta */}
        <CardMinimal style={styles.accountCard}>
          <Text style={styles.sectionTitle}>{t("Cuenta")}</Text>
          
          {/* Editar Perfil */}
          <TouchableOpacity 
            style={styles.accountItem}
            onPress={handleEdit}
            activeOpacity={0.7}
          >
            <View style={styles.accountItemLeft}>
              <Ionicons name="person-circle" size={24} color="#6B7280" />
              <Text style={styles.accountItemText}>{t("Editar Perfil")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Cambiar Contraseña */}
          <TouchableOpacity 
            style={styles.accountItem}
            onPress={openChangePasswordModal}
            activeOpacity={0.7}
          >
            <View style={styles.accountItemLeft}>
              <Ionicons name="lock-closed" size={24} color="#6B7280" />
              <Text style={styles.accountItemText}>{t("Cambiar Contraseña")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </CardMinimal>

        {/* Modal de edición con todos los campos */}
        <Modal visible={isEditing} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <KeyboardAwareScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalTitle}>{t("Editar Perfil")}</Text>

                {/* Información Básica */}
                <Text style={styles.sectionSubtitle}>{t("Información Básica")}</Text>
                
                <InputMinimal
                  label={t("Nombre")}
                  value={newData.nombre || ""}
                  onChangeText={(text) => setNewData({ ...newData, nombre: text })}
                  placeholder={t("Ingresa tu nombre")}
                />

                <InputMinimal
                  label={t("Apellido")}
                  value={newData.apellido || ""}
                  onChangeText={(text) => setNewData({ ...newData, apellido: text })}
                  placeholder={t("Ingresa tu apellido")}
                />

                <InputMinimal
                  label={t("Teléfono")}
                  value={newData.telefono || ""}
                  onChangeText={(text) => setNewData({ ...newData, telefono: text })}
                  placeholder={t("Ingresa tu teléfono")}
                  keyboardType="phone-pad"
                />

                {/* 🔧 CAMPO DE FECHA MEJORADO */}
                <InputMinimal
                  label={t("Fecha de Nacimiento (DD/MM/YYYY)")}
                  value={newData.fechaNacimiento || ""}
                  onChangeText={(text) => {
                    // Formatear automáticamente mientras escribe
                    let formatted = text.replace(/\D/g, ''); // Solo números
                    if (formatted.length >= 2) {
                      formatted = formatted.substring(0, 2) + '/' + formatted.substring(2);
                    }
                    if (formatted.length >= 5) {
                      formatted = formatted.substring(0, 5) + '/' + formatted.substring(5, 9);
                    }
                    setNewData({ ...newData, fechaNacimiento: formatted });
                  }}
                  placeholder={t("DD/MM/YYYY")}
                  keyboardType="numeric"
                  maxLength={10}
                />

                <InputMinimal
                  label={t("Género")}
                  value={newData.genero || ""}
                  onChangeText={(text) => setNewData({ ...newData, genero: text })}
                  placeholder={t("Masculino/Femenino/Otro")}
                />

                {/* Información Física */}
                <Text style={styles.sectionSubtitle}>{t("Información Física")}</Text>

                <InputMinimal
                  label={t("Peso (kg)")}
                  value={newData.peso || ""}
                  onChangeText={(text) => setNewData({ ...newData, peso: text })}
                  placeholder={t("Peso en kilogramos")}
                  keyboardType="numeric"
                />

                <InputMinimal
                  label={t("Altura (cm)")}
                  value={newData.altura || ""}
                  onChangeText={(text) => setNewData({ ...newData, altura: text })}
                  placeholder={t("Altura en centímetros")}
                  keyboardType="numeric"
                />

                {/* Dirección */}
                <Text style={styles.sectionSubtitle}>{t("Dirección")}</Text>

                <InputMinimal
                  label={t("Dirección")}
                  value={newData.direccion || ""}
                  onChangeText={(text) => setNewData({ ...newData, direccion: text })}
                  placeholder={t("Calle y número")}
                />

                <InputMinimal
                  label={t("Ciudad")}
                  value={newData.ciudad || ""}
                  onChangeText={(text) => setNewData({ ...newData, ciudad: text })}
                  placeholder={t("Ciudad")}
                />

                <InputMinimal
                  label={t("Código Postal")}
                  value={newData.codigoPostal || ""}
                  onChangeText={(text) => setNewData({ ...newData, codigoPostal: text })}
                  placeholder={t("Código postal")}
                  keyboardType="numeric"
                />

                <InputMinimal
                  label={t("País")}
                  value={newData.pais || ""}
                  onChangeText={(text) => setNewData({ ...newData, pais: text })}
                  placeholder={t("País")}
                />

                {/* ✅ CONTACTO DE EMERGENCIA - ASEGURAR QUE SE GUARDE */}
                <Text style={styles.sectionSubtitle}>{t("Contacto de Emergencia")}</Text>

                <InputMinimal
                  label={t("Nombre del Contacto")}
                  value={newData.emergenciaContacto || ""}
                  onChangeText={(text) => setNewData({ ...newData, emergenciaContacto: text })}
                  placeholder={t("Nombre completo del contacto de emergencia")}
                />

                <InputMinimal
                  label={t("Teléfono de Emergencia")}
                  value={newData.emergenciaTelefono || ""}
                  onChangeText={(text) => setNewData({ ...newData, emergenciaTelefono: text })}
                  placeholder={t("Teléfono del contacto de emergencia")}
                  keyboardType="phone-pad"
                />

                {/* Notas */}
                <InputMinimal
                  label={t("Notas")}
                  value={newData.notas || ""}
                  onChangeText={(text) => setNewData({ ...newData, notas: text })}
                  placeholder={t("Información adicional")}
                  multiline={true}
                  numberOfLines={3}
                />

                {/* Cinturón */}
                <Text style={styles.pickerLabel}>{t("Cinturón")}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={newCinturon}
                    onValueChange={(itemValue) => setNewCinturon(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label={t("Blanco")} value="white" />
                    <Picker.Item label={t("Azul")} value="blue" />
                    <Picker.Item label={t("Púrpura")} value="purple" />
                    <Picker.Item label={t("Marrón")} value="brown" />
                    <Picker.Item label={t("Negro")} value="black" />
                  </Picker>
                </View>

                <View style={styles.modalButtons}>
                  <ButtonMinimal
                    title={t("Cancelar")}
                    onPress={() => setIsEditing(false)}
                    style={[styles.modalButton, styles.cancelButton]}
                    textStyle={styles.cancelButtonText}
                  />
                  <ButtonMinimal
                    title={t("Guardar")}
                    onPress={handleSave}
                    style={[styles.modalButton, styles.saveButton]}
                    textStyle={styles.saveButtonText}
                  />
                </View>
              </KeyboardAwareScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal de cambio de contraseña */}
        <Modal visible={isChangingPassword} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.passwordModalContainer}>
              <KeyboardAwareScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.passwordHeader}>
                  <Ionicons name="lock-closed" size={32} color="#3B82F6" />
                  <Text style={styles.modalTitle}>{t("Cambiar Contraseña")}</Text>
                  <Text style={styles.passwordSubtitle}>
                    {t("Por seguridad, necesitamos verificar tu contraseña actual")}
                  </Text>
                </View>

                <InputMinimal
                  label={t("Contraseña Actual")}
                  value={passwordData.currentPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                  placeholder={t("Ingresa tu contraseña actual")}
                  secureTextEntry={true}
                />

                <InputMinimal
                  label={t("Nueva Contraseña")}
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                  placeholder={t("Mínimo 6 caracteres")}
                  secureTextEntry={true}
                />

                <InputMinimal
                  label={t("Confirmar Nueva Contraseña")}
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                  placeholder={t("Repite la nueva contraseña")}
                  secureTextEntry={true}
                />

                {/* Indicadores de seguridad */}
                <View style={styles.passwordRequirements}>
                  <Text style={styles.requirementsTitle}>{t("Requisitos de la contraseña:")}</Text>
                  <View style={styles.requirement}>
                    <Ionicons 
                      name={passwordData.newPassword.length >= 6 ? "checkmark-circle" : "ellipse-outline"} 
                      size={16} 
                      color={passwordData.newPassword.length >= 6 ? "#10B981" : "#9CA3AF"} 
                    />
                    <Text style={[
                      styles.requirementText,
                      { color: passwordData.newPassword.length >= 6 ? "#10B981" : "#9CA3AF" }
                    ]}>
                      {t("Mínimo 6 caracteres")}
                    </Text>
                  </View>
                  <View style={styles.requirement}>
                    <Ionicons 
                      name={passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword.length > 0 ? "checkmark-circle" : "ellipse-outline"} 
                      size={16} 
                      color={passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword.length > 0 ? "#10B981" : "#9CA3AF"} 
                    />
                    <Text style={[
                      styles.requirementText,
                      { color: passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword.length > 0 ? "#10B981" : "#9CA3AF" }
                    ]}>
                      {t("Las contraseñas coinciden")}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <ButtonMinimal
                    title={t("Cancelar")}
                    onPress={() => setIsChangingPassword(false)}
                    style={[styles.modalButton, styles.cancelButton]}
                    textStyle={styles.cancelButtonText}
                  />
                  <ButtonMinimal
                    title={passwordLoading ? t("Cambiando...") : t("Cambiar Contraseña")}
                    onPress={handleChangePassword}
                    style={[styles.modalButton, styles.saveButton]}
                    textStyle={styles.saveButtonText}
                    disabled={passwordLoading}
                  />
                </View>
              </KeyboardAwareScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#E5E7EB",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  beltContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  beltImage: {
    width: 50,
    height: 30,
    resizeMode: "contain",
  },
  beltInfo: {
    alignItems: "center",
  },
  beltText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  beltSubtext: {
    fontSize: 12,
    color: "#6B7280",
  },
  infoCard: {
    margin: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 20,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoIcon: {
    marginRight: 12,
    width: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  // Estilos para gestión de compras
  managementCard: {
    margin: 16,
    padding: 20,
  },
  managementHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  managementSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
  },
  managementItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  managementItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  managementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  managementItemContent: {
    flex: 1,
  },
  managementItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  managementItemSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  managementItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  securityInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
    gap: 6,
  },
  securityText: {
    fontSize: 11,
    color: "#047857",
    flex: 1,
  },
  // Estilos para sección de cuenta
  accountCard: {
    margin: 16,
    padding: 20,
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  accountItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  accountItemText: {
    fontSize: 16,
    color: "#111827",
    marginLeft: 12,
    fontWeight: "500",
  },
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    margin: 20,
    maxHeight: "90%",
    width: "95%",
  },
  passwordModalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    margin: 20,
    maxHeight: "80%",
    width: "90%",
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  passwordHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  passwordSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
  passwordRequirements: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  requirement: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  requirementText: {
    fontSize: 12,
  },
  pickerLabel: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    marginTop: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#3B82F6",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

export default UserProfileScreen;
