import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Función de registro
  const registerUser = async () => {
    try {
      // Crear usuario con correo y contraseña
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Crear documento de usuario en Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        username: name,
        email: user.email,
        phone: phone,
        role: 'user', // Asigna 'user' como rol por defecto
      });

      Alert.alert('Registro exitoso', 'Usuario creado exitosamente');
      navigation.navigate('CheckIn'); // Navegar a otra pantalla después del registro
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        try {
          // Si el correo ya está registrado, intentamos iniciar sesión
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          Alert.alert('Inicio de sesión', 'Has iniciado sesión con tu cuenta existente');
          navigation.navigate('CheckIn'); // Navegar después del inicio de sesión
        } catch (signInError) {
          Alert.alert('Error', `No se pudo iniciar sesión: ${signInError.message}`);
        }
      } else {
        Alert.alert('Error', `Error en el registro: ${error.message}`);
      }
    }
  };

  return (
    <View>
      <Text>Registro de Usuario</Text>
      <TextInput
        placeholder="Nombre de usuario"
        value={name}
        onChangeText={setName}
        style={{ marginBottom: 10 }}
      />
      <TextInput
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        style={{ marginBottom: 10 }}
        autoCapitalize='none'
      />
      <TextInput
        placeholder="Teléfono"
        value={phone}
        onChangeText={setPhone}
        style={{ marginBottom: 10 }}
      />
      <TextInput
        placeholder="Contraseña"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        style={{ marginBottom: 20 }}
      />
      <Button title="Registrarse" onPress={registerUser} />
    </View>
  );
};

export default RegisterScreen;
