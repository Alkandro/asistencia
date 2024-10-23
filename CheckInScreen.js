import React, { useEffect } from "react";
import { View, Text, Button, Alert } from "react-native";
import { recordCheckIn } from "./Attendance";
import { useNavigation } from "@react-navigation/native";
import { auth } from './firebase';

const CheckInScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const checkInNewUser = async () => {
      if (auth.currentUser) {
        try {
          console.log("Usuario autenticado, registrando check-in...");
          await recordCheckIn(); // Registra un check-in para el usuario
        } catch (error) {
          console.error("Error en check-in: ", error);
          Alert.alert("Error", `No se pudo registrar el check-in: ${error.message}`);
        }
      } else {
        console.log("Usuario no autenticado");
      }
    };

    checkInNewUser();
  }, []);

  const handleCheckIn = async () => {
    try {
      const checkInId = await recordCheckIn();
      Alert.alert("Check-in", `Check-in registrado correctamente con ID: ${checkInId}`);
      navigation.navigate("AttendanceHistory");
    } catch (error) {
      Alert.alert("Error", `No se pudo registrar el check-in: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut(); // Cierra la sesión del usuario
      navigation.navigate("Login"); // Redirigir al usuario a la pantalla de Login
    } catch (error) {
      Alert.alert("Error", `No se pudo cerrar la sesión: ${error.message}`);
    }
  };

  return (
    <View>
      <Text>Registrar Check-in</Text>
      <Button title="Check-in" onPress={handleCheckIn} />
      <Button title="Ver historial de asistencia" onPress={() => navigation.navigate("AttendanceHistory")} />
      <Button title="Ver Perfil" onPress={() => navigation.navigate("UserProfile")} />

      {/* Botón de Cerrar Sesión */}
      <Button title="Cerrar Sesión" onPress={handleSignOut} />
    </View>
  );
};

export default CheckInScreen;
