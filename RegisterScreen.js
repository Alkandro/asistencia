// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   Alert,
//   StyleSheet,
//   SafeAreaView,
//   ScrollView,
//   TouchableOpacity,
//   Image,
//   KeyboardAvoidingView,
//   Platform,
// } from "react-native";
// import * as ImagePicker from "expo-image-picker";
// import { Picker } from "@react-native-picker/picker";
// import { auth, db } from "./firebase";
// import {
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
// } from "firebase/auth";
// import { doc, setDoc, updateDoc } from "firebase/firestore";
// import ButtonGradient from "./ButtonGradient";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useTranslation } from "react-i18next";

// // ------------- Función auxiliar para calcular edad -------------
// const calcularEdad = (fecha) => {
//   const hoy = new Date();
//   const nacimiento = new Date(fecha);
//   let edadCalculada = hoy.getFullYear() - nacimiento.getFullYear();
//   const mes = hoy.getMonth() - nacimiento.getMonth();
//   if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
//     edadCalculada--;
//   }
//   return edadCalculada.toString();
// };

// // ------------- Función para verificar cumpleaños -------------
// /**
//  * - Verifica si hoy es el cumpleaños (día y mes coinciden).
//  * - Muestra alerta "Feliz cumpleaños" una sola vez al día.
//  * - Actualiza la edad en Firestore (opcional).
//  */
// const checkBirthdayAndUpdateAge = async (uid, fechaNac) => {
//   if (!uid || !fechaNac) return;

//   const hoy = new Date();
//   const nacimiento = new Date(fechaNac);

//   const diaHoy = hoy.getDate();
//   const mesHoy = hoy.getMonth();
//   const diaNac = nacimiento.getDate();
//   const mesNac = nacimiento.getMonth();

//   // 1. Calcula edad nueva
//   const nuevaEdad = calcularEdad(fechaNac);

//   // 2. Actualiza en Firestore la nueva edad (opcional)
//   try {
//     const userRef = doc(db, "users", uid);
//     await updateDoc(userRef, { edad: nuevaEdad });
//   } catch (error) {
//     console.log("Error actualizando edad:", error);
//   }

//   // 3. Verificar si hoy es el cumpleaños
//   if (diaHoy === diaNac && mesHoy === mesNac) {
//     // Para evitar mostrar la alerta varias veces el mismo día:
//     const hoyString = hoy.toDateString(); // por ej: "Tue Feb 28 2025"
//     const ultimaVezMostrado = await AsyncStorage.getItem("cumpleaniosMostrado");

//     if (ultimaVezMostrado !== hoyString) {
//       Alert.alert(
//         t("¡Feliz cumpleaños!"),
//         t("Que tengas un gran día."),
//         t("TASHIRO JIU JITSU")
//       );
//       // Guardamos la marca de que ya se mostró hoy
//       await AsyncStorage.setItem("cumpleaniosMostrado", hoyString);
//     }
//   }
// };

// const RegisterScreen = ({ navigation }) => {
//   const { t, i18n } = useTranslation(); // Hook para traducción

//   // Estados de formulario
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");

//   const [nombre, setNombre] = useState("");
//   const [apellido, setApellido] = useState("");
//   const [name, setName] = useState(""); // username

//   const [cinturon, setCinturon] = useState("");
//   const [ciudad, setCiudad] = useState("");
//   const [provincia, setProvincia] = useState("");
//   const [peso, setPeso] = useState("");
//   const [altura, setAltura] = useState("");
//   const [phone, setPhone] = useState("");
//   const [genero, setGenero] = useState("");

//   // Fecha de nacimiento: guardamos tanto Date como string para mostrar en UI
//   const [fechaNacimiento, setFechaNacimiento] = useState(null);
//   const [fechaNacimientoTexto, setFechaNacimientoTexto] = useState("");

//   // Edad calculada
//   const [edad, setEdad] = useState("");

//   // Control del DateTimePicker
//   const [showDatePicker, setShowDatePicker] = useState(false);

//   // Imagen de perfil
//   const [imageUri, setImageUri] = useState(null);
//   const defaultProfileImage = require("./assets/fotos/tashiro1.png");

//   // Mapeo de imágenes de cinturones
//   const beltImages = {
//     white: require("./assets/fotos/whitebelt.png"),
//     blue: require("./assets/fotos/bluebelt.png"),
//     purple: require("./assets/fotos/purplebelt.png"),
//     brown: require("./assets/fotos/brownbelt.png"),
//     black: require("./assets/fotos/blackbelt.png"),
//   };
//   const getBeltImage = (belt) =>
//     beltImages[belt?.toLowerCase()] || beltImages.white;

//   // ---------------- SELECCIONAR IMAGEN ----------------
//   const selectImage = async () => {
//     const permissionResult =
//       await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (permissionResult.granted === false) {
//       Alert.alert(
//         "Permiso requerido",
//         "Se necesita permiso para acceder a la galería."
//       );
//       return;
//     }
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       quality: 1,
//     });

//     if (!result.canceled && result.assets && result.assets[0]) {
//       setImageUri(result.assets[0].uri);
//     }
//   };

//   // ---------------- REGISTRAR USUARIO ----------------
//   const registerUser = async () => {
//     if (password !== confirmPassword) {
//       Alert.alert("Error", "Las contraseñas no coinciden.");
//       return;
//     }
//     try {
//       const userCredential = await createUserWithEmailAndPassword(
//         auth,
//         email,
//         password
//       );
//       const user = userCredential.user;

//       // Lista de correos que tendrán rol 'admin'
//       const adminEmails = [
//         "tashas.natura@hotmail.com",
//         "ale1@a.com",
//       ];

//       // Preparamos el objeto para guardar en Firestore
//       const userDoc = {
//         username: name,
//         email: user.email,
//         phone: phone,
//         cinturon: cinturon,
//         ciudad: ciudad,
//         provincia: provincia,
//         peso: peso,
//         altura: altura,
//         edad: edad, // la edad calculada en local
//         genero: genero,
//         nombre: nombre,
//         apellido: apellido,
//         imageUri: imageUri,
//         // Si quieres guardar la fecha de nacimiento también:
//         fechaNacimiento: fechaNacimiento ? fechaNacimiento.toISOString() : null,
//         // Verificamos si el correo está en la lista de admin
//         role: adminEmails.includes(user.email) ? "admin" : "user",
//       };

//       // Guardamos en Firestore
//       const userDocRef = doc(db, "users", user.uid);
//       await setDoc(userDocRef, userDoc);

//       // Si hay imagenUri, la guardamos en AsyncStorage (solo ejemplo de persistencia local)
//       if (imageUri) {
//         await AsyncStorage.setItem("userImageUri", imageUri);
//       } else {
//         await AsyncStorage.removeItem("userImageUri");
//       }

//       // ------------ Verificamos si es su cumpleaños y actualizamos edad ------------
//       if (fechaNacimiento) {
//         await checkBirthdayAndUpdateAge(user.uid, fechaNacimiento);
//       }

//       Alert.alert("Registro exitoso", "Usuario creado");
//     } catch (error) {
//       if (error.code === "auth/email-already-in-use") {
//         try {
//           const userCredential = await signInWithEmailAndPassword(
//             auth,
//             email,
//             password
//           );
//           Alert.alert(
//             "Inicio de sesión",
//             "Has iniciado sesión con tu cuenta existente"
//           );
//         } catch (signInError) {
//           Alert.alert("Error", "No se pudo iniciar sesión");
//         }
//       } else {
//         Alert.alert("Error", `Error en el registro: ${error.message}`);
//       }
//     }
//   };

//   // ---------------- ACTUALIZAR FECHA Y EDAD ----------------
//   const seleccionarFecha = (event, selectedDate) => {
//     if (Platform.OS === "android") {
//       if (event.type === "set" && selectedDate) {
//         actualizarFecha(selectedDate);
//       }
//       setShowDatePicker(false);
//     } else {
//       // iOS
//       if (selectedDate) {
//         actualizarFecha(selectedDate);
//       }
//       // En iOS solemos tener un botón "Confirmar" para cerrar
//     }
//   };

//   const actualizarFecha = (date) => {
//     setFechaNacimiento(date);
//     const nuevaEdad = calcularEdad(date);
//     setEdad(nuevaEdad);

//     // Formateo de la fecha para mostrar en el TextInput
//     const formato = date.toLocaleDateString(i18n.language, {
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//     });
//     setFechaNacimientoTexto(formato);
//   };

//   // Cerrar el picker en iOS
//   const confirmarFechaIOS = () => {
//     setShowDatePicker(false);
//   };

//   // ---------------- RENDER ----------------
//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//       style={styles.container}
//     >
//       <SafeAreaView style={styles.container}>
//         <ScrollView style={styles.scrollContainer}>
//           {/* BOTÓN PARA SELECCIONAR IMAGEN */}
//           <TouchableOpacity style={styles.imageButton} onPress={selectImage}>
//             <Text style={styles.imageButtonText}>
//               {t("Seleccionar Imagen")}
//             </Text>
//           </TouchableOpacity>

//           {/* IMAGEN DE PERFIL */}
//           {imageUri ? (
//             <Image source={{ uri: imageUri }} style={styles.profileImage} />
//           ) : (
//             <Image source={defaultProfileImage} style={styles.profileImage} />
//           )}

//           {/* CAMPOS DE FORMULARIO */}
//           <Text style={styles.text}>{t("Nombre")}</Text>
//           <TextInput
//             style={styles.textIput}
//             placeholder={t("Nombre")}
//             placeholderTextColor="gray"
//             value={nombre}
//             onChangeText={setNombre}
//           />

//           <Text style={styles.text}>{t("Apellido")}</Text>
//           <TextInput
//             style={styles.textIput}
//             placeholder={t("Apellido")}
//             placeholderTextColor="gray"
//             value={apellido}
//             onChangeText={setApellido}
//           />

//           <Text style={styles.text}>{t("Usuario")}</Text>
//           <TextInput
//             style={styles.textIput}
//             placeholder={t("Usuario")}
//             placeholderTextColor="gray"
//             value={name}
//             onChangeText={setName}
//           />

//           <Text style={styles.text}>{t("Correo electonico")}</Text>
//           <TextInput
//             style={styles.textIput}
//             placeholder={t("Correo electonico")}
//             placeholderTextColor="gray"
//             keyboardType="email-address"
//             value={email}
//             onChangeText={setEmail}
//             autoCapitalize="none"
//           />

//           <Text style={styles.text}>{t("Fecha de Nacimiento")}</Text>
//           {/* TextInput para mostrar la fecha + overlay para abrir el picker */}
//           <View style={{ marginBottom: 10 }}>
//             <TextInput
//               style={styles.textIput}
//               placeholder={t("Selecciona tu fecha")}
//               placeholderTextColor="gray"
//               value={fechaNacimientoTexto}
//               editable={false}
//             />
//             <TouchableOpacity
//               style={styles.datePickerOverlay}
//               onPress={() => setShowDatePicker(true)}
//             >
//               <Text style={styles.datePickerOverlayText}>Cambiar fecha</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Picker de la fecha */}
//           {showDatePicker && (
//             <View style={styles.datePickerContainer}>
//               <DateTimePicker
//                 value={fechaNacimiento || new Date()}
//                 mode="date"
//                 display={Platform.OS === "ios" ? "spinner" : "default"}
//                 maximumDate={new Date()}
//                 onChange={seleccionarFecha}
//                 style={{ flex: 1 }}
//                 // En iOS sí se respeta "locale". En Android usa el idioma del SO.
//                 locale={Platform.OS === "ios" ? i18n.language : undefined}
//               />
//               {/* Botón Confirmar en iOS */}
//               {Platform.OS === "ios" && (
//                 <TouchableOpacity
//                   style={styles.confirmButton}
//                   onPress={confirmarFechaIOS}
//                 >
//                   <Text style={styles.confirmText}>Confirmar</Text>
//                 </TouchableOpacity>
//               )}
//             </View>
//           )}

//           <Text style={styles.text}>{t("Edad")}</Text>
//           <TextInput
//             style={styles.textIput}
//             value={edad}
//             placeholder="0"
//             placeholderTextColor="gray"
//             editable={false}
//           />

//           <Text style={styles.text}>{t("Teléfono")}</Text>
//           <TextInput
//             style={styles.textIput}
//             placeholder={t("Teléfono")}
//             placeholderTextColor="gray"
//             keyboardType="phone-pad"
//             value={phone}
//             onChangeText={setPhone}
//           />

//           <Text style={styles.text}>{t("Ciudad")}</Text>
//           <TextInput
//             style={styles.textIput}
//             placeholder={t("Ciudad")}
//             placeholderTextColor="gray"
//             value={ciudad}
//             onChangeText={setCiudad}
//           />

//           <Text style={styles.text}>{t("Provincia")}</Text>
//           <TextInput
//             style={styles.textIput}
//             placeholder={t("Provincia")}
//             placeholderTextColor="gray"
//             value={provincia}
//             onChangeText={setProvincia}
//           />

//           <Text style={styles.text}>{t("Peso")}</Text>
//           <TextInput
//             style={styles.textIput}
//             placeholder={t("Peso")}
//             placeholderTextColor="gray"
//             keyboardType="decimal-pad"
//             value={peso}
//             onChangeText={setPeso}
//           />

//           <Text style={styles.text}>{t("Altura")}</Text>
//           <TextInput
//             style={styles.textIput}
//             placeholder={t("Altura")}
//             placeholderTextColor="gray"
//             keyboardType="numeric"
//             value={altura}
//             onChangeText={setAltura}
//           />

//           <Text style={styles.text}>{t("Género")}</Text>
//           <View style={styles.pickerContainer}>
//             <Picker
//               selectedValue={genero}
//               onValueChange={(value) => setGenero(value)}
//               mode={Platform.OS === "android" ? "dropdown" : undefined}
//               style={styles.picker1}
//             >
//               <Picker.Item label={t("Masculino")} value="Masculino" />
//               <Picker.Item label={t("Femenino")} value="Femenino" />
//             </Picker>
//           </View>

//           <Text style={styles.text}>{t("Cinturón")}</Text>
//           <View style={styles.pickerContainer}>
//             <Picker
//               selectedValue={cinturon}
//               onValueChange={(value) => setCinturon(value)}
//               mode={Platform.OS === "android" ? "dropdown" : undefined}
//               style={styles.picker}
//             >
//               <Picker.Item label={t("Blanco")} value="white" />
//               <Picker.Item label={t("Azul")} value="blue" />
//               <Picker.Item label={t("Violeta")} value="purple" />
//               <Picker.Item label={t("Marron")} value="brown" />
//               <Picker.Item label={t("Negro")} value="black" />
//             </Picker>
//           </View>
//           {cinturon ? (
//             <Image source={getBeltImage(cinturon)} style={styles.beltImage} />
//           ) : null}

//           <Text style={styles.text}>{t("Contraseña")}</Text>
//           <TextInput
//             style={styles.textIput}
//             placeholder={t("Contraseña")}
//             placeholderTextColor="gray"
//             keyboardType="numeric"
//             value={password}
//             secureTextEntry
//             onChangeText={setPassword}
//           />

//           <Text style={styles.text}>{t("Confirmar Contraseña")}</Text>
//           <TextInput
//             style={styles.textIput}
//             placeholder={t("Confirmar Contraseña")}
//             placeholderTextColor="gray"
//             keyboardType="numeric"
//             secureTextEntry
//             value={confirmPassword}
//             onChangeText={setConfirmPassword}
//           />
//         </ScrollView>

//         {/* BOTÓN DE REGISTRO */}
//         <View style={styles.buttonContainer}>
//           <ButtonGradient
//             title={t("Registrarse")}
//             onPress={registerUser}
//             style={styles.button}
//           />
//         </View>
//       </SafeAreaView>
//     </KeyboardAvoidingView>
//   );
// };

// // ---------------- ESTILOS ----------------
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   scrollContainer: {
//     flex: 1,
//     paddingHorizontal: 20,
//     paddingBottom: 80,
//   },
//   textIput: {
//     padding: 10,
//     paddingStart: 15,
//     width: "100%",
//     height: 50,
//     marginTop: 2,
//     borderRadius: 30,
//     backgroundColor: "#fff",
//     marginBottom: 10,
//   },
//   text: {
//     fontSize: 15,
//     fontStyle: "italic",
//     fontWeight: "bold",
//     marginBottom: 1,
//   },
//   imageButton: {
//     backgroundColor: "#ccc",
//     padding: 10,
//     borderRadius: 5,
//     alignItems: "center",
//     marginBottom: 10,
//   },
//   imageButtonText: {
//     color: "#000",
//   },
//   profileImage: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     alignSelf: "center",
//     marginVertical: 10,
//   },
//   pickerContainer: {
//     width: "100%",
//     borderWidth: 3,
//     borderColor: "gray",
//     borderRadius: 15,
//     marginTop: 5,
//     backgroundColor: "#fff",
//     marginBottom: 10,
//   },
//   picker: {
//     width: "100%",
//     height: Platform.OS === "ios" ? 200 : 60,
//     color: "#000",
//   },
//   picker1: {
//     width: "100%",
//     color: "#000",
//     ...Platform.select({
//       ios: {
//         height: 140,
//         marginTop: -40,
//         marginBottom: 40,
//       },
//       android: {
//         height: 60,
//       },
//     }),
//   },
//   beltImage: {
//     width: 90,
//     height: 55,
//     resizeMode: "contain",
//     alignSelf: "center",
//     marginVertical: 10,
//   },
//   buttonContainer: {
//     alignItems: "center",
//     backgroundColor: "transparent",
//     padding: 10,
//     borderTopWidth: 0,
//   },
//   button: {
//     marginHorizontal: "auto",
//     borderRadius: 25,
//     padding: 30,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   datePickerContainer: {
//     ...Platform.select({
//       ios: {
//         backgroundColor: "#fff",
//         marginVertical: 10,
//         borderRadius: 10,
//         padding: 10,
//       },
//     }),
//   },
//   confirmButton: {
//     backgroundColor: "#0080FF",
//     borderRadius: 8,
//     padding: 10,
//     marginTop: 10,
//     alignItems: "center",
//   },
//   confirmText: {
//     color: "#fff",
//     fontWeight: "bold",
//   },
//   datePickerOverlay: {
//     position: "absolute",
//     top: 0,
//     right: 0,
//     bottom: 0,
//     left: 0,
//   },
//   datePickerOverlayText: {
//     width: "100%",
//     height: "100%",
//     textAlign: "right",
//     textAlignVertical: "center",
//     color: "transparent",
//   },
// });

// export default RegisterScreen;
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
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import ButtonMinimal from "./ButtonMinimal";
import InputMinimal from "./InputMinimal";
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
        role: "user",
        allTimeCheckIns: 0,
        createdAt: new Date(),
      });

      // Guardar imagen en AsyncStorage si existe
      if (imageUri) {
        await AsyncStorage.setItem("userImageUri", imageUri);
      }

      // Verificar cumpleaños
      await checkBirthdayAndUpdateAge(user.uid, fechaNacimiento);

      Alert.alert(
        t("Éxito"),
        t("Usuario registrado correctamente"),
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      Alert.alert(t("Error"), t("No se pudo registrar el usuario"));
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
                    source={require("./assets/fotos/tashiro1.png")}
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
    marginTop: -8,
  },
  picker: {
    height: Platform.OS === "ios" ? 120 : 50,
    color: "#333333",
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
