import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Alert, 
  TouchableOpacity 
} from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { useNavigation } from "@react-navigation/native";
import ButtonGradient from "../ButtonGradient";
import { db, auth } from '../firebase';
import { useTranslation } from "react-i18next";

const UserListScreen = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const usersRef = collection(db, "users");

    // Suscripción en tiempo real
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const userList = [];
        snapshot.forEach((docSnap) => {
          const userData = docSnap.data();
          // Si el usuario NO es admin y es user (role !== "admin"), lo agregamos a la lista.
          if (userData.role !== "admin") {
            userList.push({ id: docSnap.id, ...userData });
          }
        });
        setUsers(userList);
      },
      (error) => {
        Alert.alert("Error", "No se pudo obtener la lista de usuarios");
      }
    );

    // Cancelar la suscripción al desmontar el componente.
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      // Al no haber usuario, la app renderizará el stack de autenticación.
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => {
        // Navega a la pantalla de detalle, pasando el ID del usuario.
        navigation.navigate("UserDetailScreen", { userId: item.id });
      }}
    >
      <Text style={styles.userText}>
        {t("User")}: {item.username || "No registrado"}
      </Text>
      <Text style={styles.userText}>
        {t("Nombre")}: {item.nombre || "No registrado"}
      </Text>
      <Text style={styles.userText}>
        {t("Apellido")}: {item.apellido || "No registrado"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("Lista de Usuarios")}</Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
      />

      <View style={styles.buttonContainer}>
        <ButtonGradient
          onPress={handleSignOut}
          title={t("Salir")}
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
