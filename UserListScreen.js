// UserListScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { useNavigation } from "@react-navigation/native";
import ButtonGradient from "./ButtonGradient";
import { db, auth } from './firebase';

const UserListScreen = () => {
  const [users, setUsers] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const usersRef = collection(db, "users");
  
    // Suscripción en tiempo real
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const userList = [];
      snapshot.forEach((docSnap) => {
        userList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsers(userList);
    }, (error) => {
      Alert.alert("Error", "No se pudo obtener la lista de usuarios");
    });
  
    // Cancelar suscripción al desmontar el componente
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      // App.js, al ver que no hay usuario, renderizará <AuthStack />
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const renderUserItem = ({ item }) => {
    return (
      <View style={styles.userItem}>
      <Text style={styles.userText}>Usuario: {item.username || "N/A"}</Text>
      <Text style={styles.userText}>Email: {item.email || "N/A"}</Text>
      <Text style={styles.userText}>Teléfono: {item.phone || "N/A"}</Text>
      {/* Puedes seguir añadiendo Text con más campos como item.edad, item.apellido, etc. */}
    </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Usuarios</Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
      />

      <View style={styles.buttonContainer}>
        <ButtonGradient
          onPress={handleSignOut}
          title="Sign Out"
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  userItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  userText: {
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  button: {
    width: "80%",
    height: 50,
    borderRadius: 25,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default UserListScreen;
