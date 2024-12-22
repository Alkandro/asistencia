// UserListScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from "@react-navigation/native";
import ButtonGradient from "./ButtonGradient";
import { db, auth } from './firebase';

const UserListScreen = () => {
  const [users, setUsers] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);

        const userList = [];
        snapshot.forEach((docSnap) => {
          userList.push({ id: docSnap.id, ...docSnap.data() });
        });
        setUsers(userList);
      } catch (error) {
        Alert.alert("Error", "No se pudo obtener la lista de usuarios");
      }
    };

    fetchUsers();
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
        <Text style={styles.userText}>
          {item.email} | Rol: {item.role || "N/A"}
        </Text>
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
