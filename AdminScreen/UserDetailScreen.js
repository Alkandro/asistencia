// UserDetailScreen.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; // Ajusta la ruta según tu proyecto
import { useRoute } from "@react-navigation/native";

export default function UserDetailScreen() {
  const route = useRoute();
  const { userId } = route.params;   // Recibimos el ID del usuario
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          Alert.alert("Error", "No se encontró el documento del usuario");
        }
      } catch (error) {
        Alert.alert("Error", "No se pudo obtener la información del usuario");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.center}>
        <Text>No se encontraron datos del usuario.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalle del Usuario</Text>
      <Text style={styles.text}>Username: {userData.username}</Text>
      <Text style={styles.text}>Nombre: {userData.nombre}</Text>
      <Text style={styles.text}>Apellido: {userData.apellido}</Text>
      <Text style={styles.text}>Email: {userData.email}</Text>
      <Text style={styles.text}>Teléfono: {userData.phone}</Text>
      <Text style={styles.text}>Cinturón: {userData.cinturon}</Text>
      <Text style={styles.text}>Ciudad: {userData.ciudad}</Text>
      <Text style={styles.text}>Provincia: {userData.provincia}</Text>
      <Text style={styles.text}>Peso: {userData.peso}</Text>
      <Text style={styles.text}>Altura: {userData.altura}</Text>
      <Text style={styles.text}>Edad: {userData.edad}</Text>
      <Text style={styles.text}>Género: {userData.genero}</Text>
      {/* etc... Muestra todos los campos que tengas */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
});
