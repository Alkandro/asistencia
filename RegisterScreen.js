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
import RNPickerSelect from "react-native-picker-select";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import ButtonGradient from "./ButtonGradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const RegisterScreen = ({ navigation }) => {


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
  const defaultProfileImage = require("./assets/fotos/tashiro1.jpg");

  // Mapeo de imágenes de cinturones
  const beltImages = {
    white: require("./assets/fotos/whiteBelt.png"),
    blue: require("./assets/fotos/blueBelt.png"),
    purple: require("./assets/fotos/purpleBelt.png"),
    brown: require("./assets/fotos/brownBelt.png"),
    black: require("./assets/fotos/blackBelt.png"),
  };
  const getBeltImage = (belt) =>
    beltImages[belt.toLowerCase()] || beltImages["white"];

  // Función para seleccionar una imagen
  const selectImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permiso requerido", "Se necesita permiso para acceder a la galería.");
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
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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
        role: email === "ale5@hotmail.com" ? "admin" : "user",
      });
  
      // Guarda la URI de la imagen en AsyncStorage para persistencia
      await AsyncStorage.setItem("userImageUri", imageUri);
  
      Alert.alert("Registro exitoso", "Usuario creado");
      navigation.navigate("CheckIn");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
  
          Alert.alert("Inicio de sesión", "Has iniciado sesión con tu cuenta existente");
          navigation.navigate("CheckIn");
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
            <Text style={styles.imageButtonText}>Seleccionar Imagen</Text>
          </TouchableOpacity>

          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.profileImage} />
          ) : (
            <Image source={defaultProfileImage} style={styles.profileImage} />
          )}

        <Text style={styles.text}>Nombre</Text>
        <TextInput
          style={styles.textIput}
          placeholder="Nombre"
          placeholderTextColor="gray"
          value={nombre}
          onChangeText={setNombre}
        />
        <Text style={styles.text}>Apellido</Text>
        <TextInput
          style={styles.textIput}
          placeholder="Apellido"
          placeholderTextColor="gray"
          value={apellido}
          onChangeText={setApellido}
        />
        <Text style={styles.text}>User Name</Text>
        <TextInput
          style={styles.textIput}
          placeholder="User Name"
          placeholderTextColor="gray"
          value={name}
          onChangeText={setName}
        />
        <Text style={styles.text}>Correo electrónico</Text>
        <TextInput
          style={styles.textIput}
          placeholder="Correo electrónico"
          placeholderTextColor="gray"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <Text style={styles.text}>Teléfono</Text>
        <TextInput
          style={styles.textIput}
          placeholder="Teléfono"
          placeholderTextColor="gray"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.text}>Ciudad</Text>
        <TextInput
          style={styles.textIput}
          placeholder="Ciudad"
          placeholderTextColor="gray"
          value={ciudad}
          onChangeText={setCiudad}
        />
        <Text style={styles.text}>Provincia</Text>
        <TextInput
          style={styles.textIput}
          placeholder="Provincia"
          placeholderTextColor="gray"
          value={provincia}
          onChangeText={setProvincia}
        />
        <Text style={styles.text}>Peso</Text>
        <TextInput
          style={styles.textIput}
          placeholder="Peso"
          placeholderTextColor="gray"
          keyboardType="decimal-pad"
          value={peso}
          onChangeText={setPeso}
        />
        <Text style={styles.text}>Altura</Text>
        <TextInput
          style={styles.textIput}
          placeholder="Altura"
          placeholderTextColor="gray"
          keyboardType="numeric"
          value={altura}
          onChangeText={setAltura}
        />
        <Text style={styles.text}>Edad</Text>
        <TextInput
          style={styles.textIput}
          placeholder="Edad"
          placeholderTextColor="gray"
          keyboardType="numeric"
          value={edad}
          onChangeText={setEdad}
        />
        <Text style={styles.text}>Genero</Text>
        <TextInput
          style={styles.textIput}
          placeholder="Mascculino-Femenino"
          placeholderTextColor="gray"
          value={genero}
          onChangeText={setGenero}
        />
        {/* Dropdown de Cinturón */}
        <Text style={styles.text}>Cinturón</Text>
        <RNPickerSelect
          onValueChange={(value) => setCinturon(value)}
          items={[
            { label: "White", value: "white" },
            { label: "Blue", value: "blue" },
            { label: "Purple", value: "purple" },
            { label: "Brown", value: "brown" },
            { label: "Black", value: "black" },
          ]}
          style={pickerSelectStyles}
          placeholder={{ label: "Selecciona tu cinturón", value: null }}
        />

        {/* Imagen del cinturón */}
        {cinturon ? (
          <Image source={getBeltImage(cinturon)}  />
        ) : null}
        <Text style={styles.text}>Contraseña</Text>
        <TextInput
          style={styles.textIput}
          placeholder="Contraseña"
          placeholderTextColor="gray"
          keyboardType="numeric"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
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
    marginBottom:1,
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
});
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    color: "black",
    paddingRight: 30, // To ensure the text is never behind the icon
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    color: "black",
    paddingRight: 30, // To ensure the text is never behind the icon
    marginBottom: 10,
  },
});


export default RegisterScreen;
