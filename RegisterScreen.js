import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import ButtonGradient from "./ButtonGradient";

const RegisterScreen = ({ navigation }) => {
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

  // Función de registro
  const registerUser = async () => {
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
        role: "user",
      });
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
        role: email === "ale5@hotmail.com" ? "admin" : "user", // Asigna "admin" si el correo coincide
      });

      Alert.alert("Registro exitoso", "Usuario creado");
      navigation.navigate("CheckIn");
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
          navigation.navigate("CheckIn");
        } catch (signInError) {
          Alert.alert(
            "Error",
            `No se pudo iniciar sesión`
          );
          // Alert.alert(
          //   "Error",
          //   `No se pudo iniciar sesión: ${signInError.message}`
          // );
        }
      } else {
        Alert.alert("Error", `Error en el registro`);
        // Alert.alert("Error", `Error en el registro: ${error.message}`);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
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
        <Text style={styles.text}>Cinturon</Text>
        <TextInput
          style={styles.textIput}
          placeholder="Cinturon actual"
          placeholderTextColor="gray"
          value={cinturon}
          onChangeText={setCinturon}
        />
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

      {/* Botón fijo abajo */}
      <View style={styles.buttonContainer}>
        <ButtonGradient
          title="Registrarse"
          onPress={registerUser}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
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
});

export default RegisterScreen;
