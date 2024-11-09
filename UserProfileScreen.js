import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  Button,
  TextInput,
  Modal,
} from "react-native";
import { auth, db } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { MaterialIcons } from "@expo/vector-icons";
import { useImageContext } from "./ImageContext";



// Importar imágenes de los cinturones
import WhiteBelt from "./assets/fotos/whiteBelt.png";
import BlueBelt from "./assets/fotos/blueBelt.png";
import PurpleBelt from "./assets/fotos/purpleBelt.png";
import BrownBelt from "./assets/fotos/brownBelt.png";
import BlackBelt from "./assets/fotos/blackBelt.png";

const UserProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newData, setNewData] = useState({});

  const { imageUri } = useImageContext();

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          console.log("No se encontraron datos para este usuario");
        }
      }
    } catch (error) {
      console.error("Error al obtener los datos del usuario:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBeltImage = (beltColor) => {
    switch (beltColor) {
      case "white":
        return WhiteBelt;
      case "blue":
        return BlueBelt;
      case "purple":
        return PurpleBelt;
      case "brown":
        return BrownBelt;
      case "black":
        return BlackBelt;
      default:
        return null;
    }
  };

  const handleEdit = () => {
    setNewData(userData);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), newData);
        setUserData(newData);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error al actualizar los datos:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      <Button title="Editar perfil" onPress={handleEdit} />

      {userData ? (
        <>
        <View>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={{ width: 100, height: 100, borderRadius: 50 }} />
      ) : (
        <Text>No hay imagen seleccionada</Text>
      )}
    </View>
          {/* Mostrar datos del usuario */}
          <View style={styles.infoRow}>
            <MaterialIcons
              name="badge"
              size={20}
              color="#000"
              style={styles.icon}
            />
            <Text style={styles.text}>{userData.nombre}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons
              name="badge"
              size={20}
              color="#000"
              style={styles.icon}
            />
            <Text style={styles.text}>{userData.apellido}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons
              name="person"
              size={20}
              color="#000"
              style={styles.icon}
            />
            <Text style={styles.text}>{userData.username}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons
              name="phone"
              size={20}
              color="#000"
              style={styles.icon}
            />
            <Text style={styles.text}>{userData.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons
              name="location-city"
              size={20}
              color="#000"
              style={styles.icon}
            />
            <Text style={styles.text}>{userData.ciudad}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons
              name="location-on"
              size={20}
              color="#000"
              style={styles.icon}
            />
            <Text style={styles.text}>{userData.provincia}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons
              name="schedule"
              size={20}
              color="#000"
              style={styles.icon}
            />
            <Text style={styles.text}>{userData.edad} años</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons
              name="scale"
              size={20}
              color="#000"
              style={styles.icon}
            />
            <Text style={styles.text}>{userData.peso} kg</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons
              name="height"
              size={20}
              color="#000"
              style={styles.icon}
            />
            <Text style={styles.text}>{userData.altura} cm</Text>
          </View>
          <View style={styles.infoRow}>
            <Image
              source={getBeltImage(userData.cinturon)}
              style={styles.icon1}
            />
            <Text style={styles.text}>{userData.cinturon}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons
              name="wc"
              size={20}
              color="#000"
              style={styles.icon}
            />
            <Text style={styles.text}>{userData.genero}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons
              name="email"
              size={20}
              color="#000"
              style={styles.icon}
            />
            <Text style={styles.text}>{userData.email}</Text>
          </View>

          {/* Modal para editar la información */}
          <Modal visible={isEditing} animationType="slide">
            <View style={styles.modalContainer}>
              <Text>Editar perfil</Text>

              <TextInput
                style={styles.input}
                value={`Nombre: ${newData.nombre}`}
                onChangeText={(text) => {
                  // Remueve el prefijo "Nombre: " para actualizar solo el nombre
                  const newName = text.replace("Nombre: ", "");
                  setNewData({ ...newData, nombre: newName });
                }}
              />
              <TextInput
                style={styles.input}
                value={`Apellido: ${newData.apellido}`}
                onChangeText={(text) => {
                  const nuevoApellido = text.replace("Apellido: ", ""); // Eliminar el prefijo al actualizar
                  setNewData({ ...newData, apellido: nuevoApellido });
                }}
                placeholder="Apellido"
              />
              <TextInput
                style={styles.input}
                value={`User: ${newData.username}`}
                onChangeText={(text) =>
                  setNewData({
                    ...newData,
                    username: text.replace(/^User: /, ""),
                  })
                }
                placeholder="User"
              />

              <TextInput
                style={styles.input}
                value={`Teléfono: ${newData.phone}`}
                onChangeText={(text) =>
                  setNewData({
                    ...newData,
                    phone: text.replace(/^Teléfono: /, ""),
                  })
                }
                placeholder="Teléfono"
              />

              <TextInput
                style={styles.input}
                value={`Ciudad: ${newData.ciudad}`}
                onChangeText={(text) =>
                  setNewData({
                    ...newData,
                    ciudad: text.replace(/^Ciudad: /, ""),
                  })
                }
                placeholder="Ciudad"
              />

              <TextInput
                style={styles.input}
                value={`Provincia: ${newData.provincia}`}
                onChangeText={(text) =>
                  setNewData({
                    ...newData,
                    provincia: text.replace(/^Provincia: /, ""),
                  })
                }
                placeholder="Provincia"
              />

              <TextInput
                style={styles.input}
                value={`Edad: ${newData.edad}`}
                onChangeText={(text) =>
                  setNewData({ ...newData, edad: text.replace(/^Edad: /, "") })
                }
                placeholder="Edad"
              />

              <TextInput
                style={styles.input}
                value={`Peso: ${newData.peso}`}
                onChangeText={(text) =>
                  setNewData({ ...newData, peso: text.replace(/^Peso: /, "") })
                }
                placeholder="Peso"
              />

              <TextInput
                style={styles.input}
                value={`Altura: ${newData.altura}`}
                onChangeText={(text) =>
                  setNewData({
                    ...newData,
                    altura: text.replace(/^Altura: /, ""),
                  })
                }
                placeholder="Altura"
              />

              <TextInput
                style={styles.input}
                value={`Email: ${newData.email}`}
                onChangeText={(text) =>
                  setNewData({
                    ...newData,
                    email: text.replace(/^Email: /, ""),
                  })
                }
                placeholder="Email"
              />

              <TextInput
                style={styles.input}
                value={`Cinturon: ${newData.cinturon}`}
                onChangeText={(text) =>
                  setNewData({
                    ...newData,
                    cinturon: text.replace(/^Cinturon: /, ""),
                  })
                }
                placeholder="Cinturon"
              />

              {/* Añadir más campos de edición si es necesario */}
              <Button title="Guardar" onPress={handleSave} />
              <Button title="Cancelar" onPress={() => setIsEditing(false)} />
            </View>
          </Modal>
        </>
      ) : (
        <Text>No se encontraron datos del usuario</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
  },
  
  icon1: {
    width: 60,
    height: 20,
    marginRight: 8,
    resizeMode: "contain",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "black",
  },
  input: {
    width: "80%",
    height: 40,
    borderColor: "gray",
    borderWidth: 2,
    marginBottom: 16,
    paddingLeft: 8,
    borderRadius: 6,
    color: "white",
    fontSize: 17,
  },
});

export default UserProfileScreen;
