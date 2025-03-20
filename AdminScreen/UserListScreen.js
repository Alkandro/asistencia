import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
} from "react-native";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import ButtonGradient from "../ButtonGradient";
import { db, auth } from "../firebase";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Ionicons";
import { updateDoc, doc } from "firebase/firestore";

const UserListScreen = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const usersRef = collection(db, "users");

    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const userList = [];
        snapshot.forEach((docSnap) => {
          const userData = docSnap.data();
          if (userData.role !== "admin") {
            // Suponemos que en cada usuario se incluye la propiedad "newTrainings"
            userList.push({ id: docSnap.id, ...userData });
          }
        });
        setUsers(userList);
      },
      (error) => {
        Alert.alert("Error", "No se pudo obtener la lista de usuarios");
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };
  const handleNewTraining = async (userId, currentTrainings = 0) => {
    const userRef = doc(db, "users", userId);
    const newValue = currentTrainings + 1;
    await updateDoc(userRef, { newTrainings: newValue });
  };
  
  

  // Componente para cada usuario con dropdown, fondo intercalado y badge de notificación
  const UserItem = ({ item, index }) => {
    const [expanded, setExpanded] = useState(false);
    // Fondo y color de texto intercalados:
    const backgroundColor = index % 2 === 0 ? "black" : "white";
    const textColor = index % 2 === 0 ? "white" : "black";

    return (
      <View style={[styles.userItem, { backgroundColor }]}>
        <View style={styles.userHeaderRow}>
          <TouchableOpacity
            onPress={async () => {
              // Actualiza newTrainings a 0 (o a otro valor) para el usuario antes de navegar
              await updateDoc(doc(db, "users", item.id), { newTrainings: 0 });
              navigation.navigate("UserDetailScreen", { userId: item.id });
            }}
            style={{ flex: 1 }}
          >
            <View style={styles.nameBadgeContainer}>
              <Text style={[styles.userName, { color: textColor }]}>
                {item.nombre || "No registrado"}
              </Text>
              {(item.newTrainings ?? 0) > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.newTrainings}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Icon
              name={expanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={textColor}
            />
          </TouchableOpacity>
        </View>
        {expanded && (
          <View style={styles.userDetails}>
            <Text style={[styles.userText, { color: textColor }]}>
              {t("User")}: {item.username || "No registrado"}
            </Text>
            <Text style={[styles.userText, { color: textColor }]}>
              {t("Nombre")}: {item.nombre || "No registrado"}
            </Text>
            <Text style={[styles.userText, { color: textColor }]}>
              {t("Apellido")}: {item.apellido || "No registrado"}
            </Text>
            {/* Otros detalles adicionales */}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("Lista de Usuarios")}</Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <UserItem item={item} index={index} />}
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
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  userHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  badge: {
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  userDetails: {
    marginTop: 8,
    paddingLeft: 10,
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
