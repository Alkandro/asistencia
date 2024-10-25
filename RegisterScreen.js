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
        role: email === 'ale5@hotmail.com' ? 'admin' : 'user', // Asigna "admin" si el correo coincide
      });

      Alert.alert("Registro exitoso", "Usuario creado exitosamente");
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
            `No se pudo iniciar sesión: ${signInError.message}`
          );
        }
      } else {
        Alert.alert("Error", `Error en el registro: ${error.message}`);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.text}>Nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          placeholderTextColor="gray"
          value={nombre}
          onChangeText={setNombre}
        />
        <Text style={styles.text}>Apellido</Text>
        <TextInput
          style={styles.input}
          placeholder="Apellido"
          placeholderTextColor="gray"
          value={apellido}
          onChangeText={setApellido}
        />
        <Text style={styles.text}>User Name</Text>
        <TextInput
          style={styles.input}
          placeholder="User Name"
          placeholderTextColor="gray"
          value={name}
          onChangeText={setName}
        />
        <Text style={styles.text}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="gray"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <Text style={styles.text}>Teléfono</Text>
        <TextInput
          style={styles.input}
          placeholder="Teléfono"
          placeholderTextColor="gray"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.text}>Ciudad</Text>
        <TextInput
          style={styles.input}
          placeholder="Ciudad"
          placeholderTextColor="gray"
          value={ciudad}
          onChangeText={setCiudad}
        />
        <Text style={styles.text}>Provincia</Text>
        <TextInput
          style={styles.input}
          placeholder="Provincia"
          placeholderTextColor="gray"
          value={provincia}
          onChangeText={setProvincia}
        />
        <Text style={styles.text}>Peso</Text>
        <TextInput
          style={styles.input}
          placeholder="Peso"
          placeholderTextColor="gray"
          keyboardType="decimal-pad"
          value={peso}
          onChangeText={setPeso}
        />
        <Text style={styles.text}>Altura</Text>
        <TextInput
          style={styles.input}
          placeholder="Altura"
          placeholderTextColor="gray"
          keyboardType="numeric"
          value={altura}
          onChangeText={setAltura}
        />
        <Text style={styles.text}>Edad</Text>
        <TextInput
          style={styles.input}
          placeholder="Edad"
          placeholderTextColor="gray"
          keyboardType="numeric"
          value={edad}
          onChangeText={setEdad}
        />
        <Text style={styles.text}>Genero</Text>
        <TextInput
          style={styles.input}
          placeholder="Mascculino-Femenino"
          placeholderTextColor="gray"
          value={genero}
          onChangeText={setGenero}
        />
        <Text style={styles.text}>Cinturon</Text>
        <TextInput
          style={styles.input}
          placeholder="Cinturon actual"
          placeholderTextColor="gray"
          value={cinturon}
          onChangeText={setCinturon}
        />
        <Text style={styles.text}>Contraseña</Text>
        <TextInput
          style={styles.input}
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
        <Button title="Registrarse" onPress={registerUser} />
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
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  text: {
    fontSize: 15,
    fontStyle: "italic",
    fontWeight: "bold",
  },
});

export default RegisterScreen;
