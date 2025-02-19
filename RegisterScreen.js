import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
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
import { doc, setDoc } from "firebase/firestore";
import ButtonGradient from "./ButtonGradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

const RegisterScreen = ({ navigation }) => {
  const { t } = useTranslation(); // Hook para traducción

  // Estados para los campos de entrada
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [cinturon, setCinturon] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [provincia, setProvincia] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [edad, setEdad] = useState("");
  const [genero, setGenero] = useState("");
  const [phone, setPhone] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const defaultProfileImage = require("./assets/fotos/tashiro1.png");

  // Mapeo de imágenes de cinturones
  const beltImages = {
    white: require("./assets/fotos/whitebelt.png"),
    blue: require("./assets/fotos/bluebelt.png"),
    purple: require("./assets/fotos/purplebelt.png"),
    brown: require("./assets/fotos/brownbelt.png"),
    black: require("./assets/fotos/blackbelt.png"),
  };
  const getBeltImage = (belt) =>
    beltImages[belt.toLowerCase()] || beltImages["white"];

  // Función para seleccionar una imagen
  const selectImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permiso requerido",
        "Se necesita permiso para acceder a la galería."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setImageUri(result.assets[0].uri); // Actualiza el estado global de la imagen
    }
  };

  // Función de registro
  const registerUser = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        username: name,
        email: user.email,
        phone: phone,
        cinturon: cinturon,
        ciudad: ciudad,
        provincia: provincia,
        peso: peso,
        altura: altura,
        edad: edad,
        genero: genero,
        nombre: nombre,
        apellido: apellido,
        imageUri: imageUri, // Guarda la URI de la imagen en Firestore
        role: email === "tashas.natura@hotmail.com" ? "admin" : "user",
      });

      // Guarda la URI de la imagen en AsyncStorage para persistencia
      await AsyncStorage.setItem("userImageUri", imageUri);

      Alert.alert("Registro exitoso", "Usuario creado");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
          );
          const user = userCredential.user;

          Alert.alert(
            "Inicio de sesión",
            "Has iniciado sesión con tu cuenta existente"
          );
        } catch (signInError) {
          Alert.alert("Error", "No se pudo iniciar sesión");
        }
      } else {
        Alert.alert("Error", `Error en el registro: ${error.message}`);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollContainer}>
          {/* Mostrar la imagen seleccionada o la por defecto */}
          <TouchableOpacity style={styles.imageButton} onPress={selectImage}>
            <Text style={styles.imageButtonText}>{t("Seleccionar Imagen")}</Text>
          </TouchableOpacity>

          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.profileImage} />
          ) : (
            <Image source={defaultProfileImage} style={styles.profileImage} />
          )}

          <Text style={styles.text}>{t("Nombre")}</Text>
          <TextInput
            style={styles.textIput}
            placeholder={t("Nombre")}
            placeholderTextColor="gray"
            value={nombre}
            onChangeText={setNombre}
          />
          <Text style={styles.text}>{t("Apellido")}</Text>
          <TextInput
            style={styles.textIput}
            placeholder={t("Apellido")}
            placeholderTextColor="gray"
            value={apellido}
            onChangeText={setApellido}
          />
          <Text style={styles.text}>{t("Usuario")}</Text>
          <TextInput
            style={styles.textIput}
            placeholder="User Name"
            placeholderTextColor="gray"
            value={name}
            onChangeText={setName}
          />
          <Text style={styles.text}>{t("Correo electonico")}</Text>
          <TextInput
            style={styles.textIput}
            placeholder="Correo electrónico"
            placeholderTextColor="gray"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <Text style={styles.text}>{t("Teléfono")}</Text>
          <TextInput
            style={styles.textIput}
            placeholder="Teléfono"
            placeholderTextColor="gray"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.text}>{t("Ciudad")}</Text>
          <TextInput
            style={styles.textIput}
            placeholder="Ciudad"
            placeholderTextColor="gray"
            value={ciudad}
            onChangeText={setCiudad}
          />
          <Text style={styles.text}>{t("Provincia")}</Text>
          <TextInput
            style={styles.textIput}
            placeholder="Provincia"
            placeholderTextColor="gray"
            value={provincia}
            onChangeText={setProvincia}
          />
          <Text style={styles.text}>{t("Peso")}</Text>
          <TextInput
            style={styles.textIput}
            placeholder="Peso"
            placeholderTextColor="gray"
            keyboardType="decimal-pad"
            value={peso}
            onChangeText={setPeso}
          />
          <Text style={styles.text}>{t("Altura")}</Text>
          <TextInput
            style={styles.textIput}
            placeholder="Altura"
            placeholderTextColor="gray"
            keyboardType="numeric"
            value={altura}
            onChangeText={setAltura}
          />
          <Text style={styles.text}>{t("Edad")}</Text>
          <TextInput
            style={styles.textIput}
            placeholder="Edad"
            placeholderTextColor="gray"
            keyboardType="numeric"
            value={edad}
            onChangeText={setEdad}
          />
          <Text style={styles.text}>{t("Género")}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={genero}
              onValueChange={(value) => setGenero(value)}
              mode={Platform.OS === "android" ? "dropdown" : undefined}
              style={styles.picker1} // O style={styles.picker} si prefieres
            >
              <Picker.Item label={t("Masculino")} value="Masculino" />
              <Picker.Item label={t("Femenino")} value="Femenino" />
            </Picker>
          </View>
          {/* Dropdown de Cinturón */}
          <Text style={styles.text}>Cinturón</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={cinturon}
              onValueChange={(value) => setCinturon(value)}
              mode={Platform.OS === "android" ? "dropdown" : undefined}
              style={styles.picker} // Asegúrate de tener tus estilos
            >
              <Picker.Item label={t("Blanco")} value="white" />
              <Picker.Item label={t("Azul")} value="blue" />
              <Picker.Item label={t("Violeta")} value="purple" />
              <Picker.Item label={t("Marron")} value="brown" />
              <Picker.Item label={t("Negro")} value="black" />
            </Picker>
          </View>

          {/* Imagen del cinturón */}
          {cinturon ? (
            <Image source={getBeltImage(cinturon)} style={styles.beltImage} />
          ) : null}
          <Text style={styles.text}>{t("Contraseña")}</Text>
          <TextInput
            style={styles.textIput}
            placeholder="Contraseña"
            placeholderTextColor="gray"
            keyboardType="numeric"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
          />
          <Text style={styles.text}>{t("Confirmar Contraseña")}</Text>
          <TextInput
            style={styles.textIput}
            placeholder="Confirmar Contraseña"
            placeholderTextColor="gray"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </ScrollView>
        <View style={styles.buttonContainer}>
          <ButtonGradient
            title="Registrarse"
            onPress={registerUser}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  textIput: {
    padding: 10,
    paddingStart: 15,
    width: "100%",
    height: 50,
    marginTop: 2,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  buttonContainer: {
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: "transparent",
    padding: 10,
    borderTopWidth: 0,
  },
  text: {
    fontSize: 15,
    fontStyle: "italic",
    fontWeight: "bold",
    marginBottom: 1,
  },
  button: {
    marginHorizontal: "auto",
    borderRadius: 25,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  imageButton: {
    backgroundColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  imageButtonText: {
    color: "#000",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginVertical: 10,
  },
  pickerContainer: {
    width: "100%",
    borderWidth: 3,
    borderColor: "gray",
    borderRadius: 15,
    marginTop: 5,
    backgroundColor: "#fff",
  },
  picker: {
    width: "100%",
    height: Platform.OS === "ios" ? 200 : 60,
    color: "#000",
  },
  beltImage: {
    width: 90,
    height: 55,
    resizeMode: "contain",
    alignSelf: "center",
    marginVertical: 10,
  },
  picker1: {
    width: "100%",
    color: "#000",
    ...Platform.select({
      ios: {
        height: 140,
        marginTop: -40,
        marginBottom: 40,
      },
      android: {
        height: 60,
      },
    }),
  },
});

export default RegisterScreen;
