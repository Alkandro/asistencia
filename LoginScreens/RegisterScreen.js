import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Alert,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import ButtonMinimal from "../Styles/ButtonMinimal";
import InputMinimal from "../Styles/InputMinimal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Ionicons";

// ------------- Función auxiliar para calcular edad -------------
const calcularEdad = (fecha) => {
  const hoy = new Date();
  const nacimiento = new Date(fecha);
  let edadCalculada = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edadCalculada--;
  }
  return edadCalculada.toString();
};

// ------------- Función para verificar cumpleaños -------------
const checkBirthdayAndUpdateAge = async (uid, fechaNac) => {
  if (!uid || !fechaNac) return;

  const hoy = new Date();
  const nacimiento = new Date(fechaNac);

  // Verificar si es cumpleaños (mismo día y mes)
  if (
    hoy.getDate() === nacimiento.getDate() &&
    hoy.getMonth() === nacimiento.getMonth()
  ) {
    const fechaHoy = hoy.toDateString();
    const ultimoCumple = await AsyncStorage.getItem("ultimoCumpleanos");

    // Solo mostrar alerta una vez por día
    if (ultimoCumple !== fechaHoy) {
      Alert.alert("🎉", "¡Feliz cumpleaños!");
      await AsyncStorage.setItem("ultimoCumpleanos", fechaHoy);

      // Actualizar edad en Firestore
      const nuevaEdad = calcularEdad(fechaNac);
      const userDocRef = doc(db, "users", uid);
      await updateDoc(userDocRef, { edad: nuevaEdad });
    }
  }
};

const RegisterScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState(new Date());
  const [edad, setEdad] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [provincia, setProvincia] = useState("");
  const [genero, setGenero] = useState("Masculino");
  const [cinturon, setCinturon] = useState("white");
  const [phone, setPhone] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Calcular edad automáticamente cuando cambia la fecha
  useEffect(() => {
    const edadCalculada = calcularEdad(fechaNacimiento);
    setEdad(edadCalculada);
  }, [fechaNacimiento]);

  // Función para seleccionar imagen
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert(t("Error"), t("Se requiere permiso para acceder a la galería"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Función para manejar el cambio de fecha
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || fechaNacimiento;
    setShowDatePicker(Platform.OS === 'ios');
    setFechaNacimiento(currentDate);
  };

  // Función para registrar usuario
  const handleRegister = async () => {
    // Validaciones básicas
    if (!nombre || !apellido || !username || !email || !password) {
      Alert.alert(t("Error"), t("Por favor, completa todos los campos obligatorios"));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t("Error"), t("Las contraseñas no coinciden"));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t("Error"), t("La contraseña debe tener al menos 6 caracteres"));
      return;
    }

    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 🔧 LÓGICA DE ROLES ADMIN RESTAURADA
      // Lista de correos que tendrán rol 'admin'
      const adminEmails = [
        "tashas.natura@hotmail.com",
        "ale1@a.com",
      ];

      // Determinar el rol basado en el email
      const userRole = adminEmails.includes(user.email) ? "admin" : "user";

      console.log(`📧 Email registrado: ${user.email}`);
      console.log(`👤 Rol asignado: ${userRole}`);

      // Guardar datos en Firestore
      await setDoc(doc(db, "users", user.uid), {
        nombre,
        apellido,
        username,
        email,
        fechaNacimiento: fechaNacimiento.toISOString(),
        edad,
        peso,
        altura,
        provincia,
        genero,
        cinturon,
        phone,
        ciudad,
        role: userRole, // ← AQUÍ SE ASIGNA EL ROL
        allTimeCheckIns: 0,
        createdAt: new Date(),
        imageUri: imageUri || null,
      });

      // Guardar imagen en AsyncStorage si existe
      if (imageUri) {
        await AsyncStorage.setItem("userImageUri", imageUri);
      }

      // Verificar cumpleaños
      await checkBirthdayAndUpdateAge(user.uid, fechaNacimiento);

      // Mensaje de éxito diferenciado por rol
      const successMessage = userRole === "admin" 
        ? t("Usuario administrador registrado correctamente")
        : t("Usuario registrado correctamente");

      Alert.alert(
        t("Éxito"),
        successMessage,
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      
      // Manejo específico para email ya en uso
      if (error.code === "auth/email-already-in-use") {
        Alert.alert(
          t("Error"), 
          t("Este correo electrónico ya está registrado. ¿Deseas iniciar sesión?"),
          [
            { text: t("Cancelar"), style: "cancel" },
            { 
              text: t("Iniciar Sesión"), 
              onPress: () => navigation.navigate("Login") 
            }
          ]
        );
      } else {
        Alert.alert(t("Error"), t("No se pudo registrar el usuario"));
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t("Registro de Usuario")}</Text>
          </View>

          {/* Imagen de perfil */}
          <View style={styles.imageSection}>
            <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Image
                    source={require("../assets/fotos/tashiro1.png")}
                    style={styles.logoPlaceholder}
                  />
                </View>
              )}
            </TouchableOpacity>
            <ButtonMinimal
              title={t("Seleccionar Imagen")}
              onPress={pickImage}
              variant="outline"
              style={styles.imageButton}
            />
          </View>

          {/* Formulario */}
          <View style={styles.formSection}>
            <View style={styles.row}>
              <InputMinimal
                label={t("Nombre")}
                placeholder={t("Nombre")}
                value={nombre}
                onChangeText={setNombre}
                style={styles.halfInput}
              />
              <InputMinimal
                label={t("Apellido")}
                placeholder={t("Apellido")}
                value={apellido}
                onChangeText={setApellido}
                style={styles.halfInput}
              />
            </View>

            <InputMinimal
              label={t("Usuario")}
              placeholder={t("Usuario")}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <View style={styles.row}>
              <InputMinimal
                label={t("Correo electrónico")}
                placeholder={t("correo@ejemplo.com")}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.halfInput}
              />
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>{t("Fecha de Nacimiento")}</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateButton}
                >
                  <Text style={styles.dateText}>
                    {fechaNacimiento.toLocaleDateString()}
                  </Text>
                  <Icon name="calendar-outline" size={20} color="#666666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <InputMinimal
                label={t("Edad")}
                placeholder={t("Edad")}
                value={edad}
                editable={false}
                style={styles.halfInput}
              />
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>{t("Género")}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={genero}
                    onValueChange={setGenero}
                    style={styles.picker}
                  >
                    <Picker.Item label={t("Masculino")} value="Masculino" />
                    <Picker.Item label={t("Femenino")} value="Femenino" />
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>{t("Cinturón")}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={cinturon}
                    onValueChange={setCinturon}
                    style={styles.picker}
                  >
                    <Picker.Item label={t("Blanco")} value="white" />
                    <Picker.Item label={t("Azul")} value="blue" />
                    <Picker.Item label={t("Violeta")} value="purple" />
                    <Picker.Item label={t("Marrón")} value="brown" />
                    <Picker.Item label={t("Negro")} value="black" />
                  </Picker>
                </View>
              </View>
              <InputMinimal
                label={t("Teléfono")}
                placeholder={t("Teléfono")}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={styles.halfInput}
              />
            </View>

            <View style={styles.row}>
              <InputMinimal
                label={t("Peso (kg)")}
                placeholder={t("Peso")}
                value={peso}
                onChangeText={setPeso}
                keyboardType="numeric"
                style={styles.halfInput}
              />
              <InputMinimal
                label={t("Altura (cm)")}
                placeholder={t("Altura")}
                value={altura}
                onChangeText={setAltura}
                keyboardType="numeric"
                style={styles.halfInput}
              />
            </View>

            <InputMinimal
              label={t("Provincia")}
              placeholder={t("Provincia")}
              value={provincia}
              onChangeText={setProvincia}
            />

            <InputMinimal
              label={t("Ciudad")}
              placeholder={t("Ciudad")}
              value={ciudad}
              onChangeText={setCiudad}
            />

            <View style={styles.row}>
              <InputMinimal
                label={t("Contraseña")}
                placeholder={t("Contraseña")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.halfInput}
              />
              <InputMinimal
                label={t("Confirmar Contraseña")}
                placeholder={t("Confirmar")}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={styles.halfInput}
              />
            </View>
          </View>

          {/* Información de roles admin (solo para debug) */}
          {__DEV__ && (
            <View style={styles.debugSection}>
              <Text style={styles.debugText}>
                🔧 Debug: Emails admin configurados:
              </Text>
              <Text style={styles.debugText}>
                • tashas.natura@hotmail.com
              </Text>
              <Text style={styles.debugText}>
                • ale1@a.com
              </Text>
            </View>
          )}

          {/* Botón de registro */}
          <View style={styles.buttonSection}>
            <ButtonMinimal
              title={t("Registrarse")}
              onPress={handleRegister}
              style={styles.registerButton}
            />
          </View>
        </ScrollView>

        {/* DatePicker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={fechaNacimiento}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
  },
  imageSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  imageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    opacity: 0.5,
  },
  imageButton: {
    paddingHorizontal: 24,
  },
  formSection: {
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  halfInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  dateText: {
    fontSize: 16,
    color: "#333333",
  },
  pickerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    marginTop: -20,
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 'auto',
    width: '100%',
    backgroundColor: '#fff',
    transform: [{ scale: 0.85 }],
  },
  debugSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#F0F8FF",
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  debugText: {
    fontSize: 12,
    color: "#666666",
    fontFamily: "monospace",
  },
  buttonSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  registerButton: {
    marginBottom: 20,
  },
});

export default RegisterScreen;
