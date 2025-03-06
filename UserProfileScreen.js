import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  TextInput,
  Modal,
  SafeAreaView,
  Platform,
} from "react-native";
import { auth, db } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { MaterialIcons } from "@expo/vector-icons";
import ButtonGradient from "./ButtonGradient";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useTranslation } from "react-i18next";

// Mapeo de imágenes de cinturones
const beltImages = {
  white: require("./assets/fotos/whitebelt.png"),
  blue: require("./assets/fotos/bluebelt.png"),
  purple: require("./assets/fotos/purplebelt.png"),
  brown: require("./assets/fotos/brownbelt.png"),
  black: require("./assets/fotos/blackbelt.png"),
};

const getBeltImage = (belt) =>
  beltImages[belt?.toLowerCase()] || beltImages["white"];

const UserProfileScreen = () => {
  const { t } = useTranslation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newData, setNewData] = useState({});
  const [newCinturon, setNewCinturon] = useState("");
  const [imageUri, setImageUri] = useState(null);

  useEffect(() => {
    const loadImage = async () => {
      const storedImageUri = await AsyncStorage.getItem("userImageUri");
      if (storedImageUri) {
        setImageUri(storedImageUri);
      }
    };
    loadImage();
    fetchUserData();
  }, []);

  // Obtener datos de Firestore
  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    } catch (error) {
      console.error("Error al obtener los datos del usuario:", error);
    } finally {
      setLoading(false);
    }
  };

  // Para abrir el modal de edición
  const handleEdit = () => {
    setNewData(userData);
    setNewCinturon(userData.cinturon);
    setIsEditing(true);
  };

  // Guardar cambios (reseteando contador si se cambió el cinturón)
  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "users", user.uid);
      const snapshot = await getDoc(userDocRef);
      if (!snapshot.exists()) return;

      // Cinturón actual
      const currentData = snapshot.data();
      const oldBelt = currentData.cinturon || "white";
      const updatedBelt = newCinturon || "white";

      const updatedData = { ...newData, cinturon: updatedBelt };

      // Si cambió de cinturón, reseteamos allTimeCheckIns
      if (oldBelt !== updatedBelt) {
        updatedData.allTimeCheckIns = 0;
      }

      // Actualiza en Firestore
      await updateDoc(userDocRef, updatedData);

      // Actualizamos estado local
      setUserData(updatedData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error al actualizar los datos:", error);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  // Formatear fecha de nacimiento
  let birthDateString = "";
  if (userData?.fechaNacimiento) {
    const birthDate = new Date(userData.fechaNacimiento);
    birthDateString = birthDate.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.container}>
        {/* Cabecera con imagen de perfil y botón de editar */}
        <View style={styles.fixedHeader}>
          <View style={styles.imagenPerfil}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            ) : (
              <Image
                source={require("./assets/fotos/tashiro1.png")}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            )}
          </View>
          <View style={styles.buttonContainer}>
            <ButtonGradient
              title={t("Editar Perfil")}
              onPress={handleEdit}
              style={styles.button}
            />
          </View>
        </View>

        {/* Datos del usuario */}
        <View style={styles.profileDataContainer}>
          {userData ? (
            <>
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
                  name="cake"
                  size={20}
                  color="#000"
                  style={styles.icon}
                />
                <Text style={styles.text}>
                  {birthDateString ? birthDateString : "--"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons
                  name="schedule"
                  size={20}
                  color="#000"
                  style={styles.icon}
                />
                <Text style={styles.text}>
                  {userData.edad ? `${userData.edad} años` : "--"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons
                  name="scale"
                  size={20}
                  color="#000"
                  style={styles.icon}
                />
                <Text style={styles.text}>
                  {userData.peso ? `${userData.peso} kg` : "--"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons
                  name="height"
                  size={20}
                  color="#000"
                  style={styles.icon}
                />
                <Text style={styles.text}>
                  {userData.altura ? `${userData.altura} cm` : "--"}
                </Text>
              </View>

              {/* CINTURÓN */}
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
            </>
          ) : (
            <Text style={styles.text1}>
              {t("No se encontraron datos del usuario")}
            </Text>
          )}
        </View>
      </View>

      {/* Modal de edición */}
      <Modal visible={isEditing} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{t("Editar Perfil")}</Text>
          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%" }}
            contentContainerStyle={styles.modalScrollContent}
          >
            <Text style={styles.text1}>{t("Nombre")}</Text>
            <TextInput
              style={styles.TextInput}
              value={`${newData.nombre || ""}`}
              onChangeText={(text) => setNewData({ ...newData, nombre: text })}
              placeholder="Nombre"
              placeholderTextColor="red"
            />

            <Text style={styles.text1}>{t("Apellido")}</Text>
            <TextInput
              style={styles.TextInput}
              value={`${newData.apellido || ""}`}
              onChangeText={(text) => setNewData({ ...newData, apellido: text })}
              placeholder="Apellido"
              placeholderTextColor="red"
            />

            <Text style={styles.text1}>{t("User")}</Text>
            <TextInput
              style={styles.TextInput}
              value={`${newData.username || ""}`}
              onChangeText={(text) =>
                setNewData({ ...newData, username: text })
              }
              placeholder="User"
              placeholderTextColor="red"
            />

            <Text style={styles.text1}>{t("Cinturón")}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newCinturon}
                onValueChange={(value) => setNewCinturon(value)}
                mode={Platform.OS === "android" ? "dropdown" : undefined}
                style={styles.picker}
              >
                <Picker.Item label={t("Blanco")} value="white" />
                <Picker.Item label={t("Azul")} value="blue" />
                <Picker.Item label={t("Violeta")} value="purple" />
                <Picker.Item label={t("Marron")} value="brown" />
                <Picker.Item label={t("Negro")} value="black" />
              </Picker>
            </View>

            {newCinturon ? (
              <Image
                source={getBeltImage(newCinturon)}
                style={styles.beltImage}
              />
            ) : null}

            <Text style={styles.text1}>{t("Teléfono")}</Text>
            <TextInput
              style={styles.TextInput}
              value={`${newData.phone || ""}`}
              onChangeText={(text) => setNewData({ ...newData, phone: text })}
              placeholder="Teléfono"
              placeholderTextColor="red"
            />

            <Text style={styles.text1}>{t("Ciudad")}</Text>
            <TextInput
              style={styles.TextInput}
              value={`${newData.ciudad || ""}`}
              onChangeText={(text) => setNewData({ ...newData, ciudad: text })}
              placeholder="Ciudad"
              placeholderTextColor="red"
            />

            <Text style={styles.text1}>{t("Provincia")}</Text>
            <TextInput
              style={styles.TextInput}
              value={`${newData.provincia || ""}`}
              onChangeText={(text) =>
                setNewData({ ...newData, provincia: text })
              }
              placeholder="Provincia"
              placeholderTextColor="red"
            />

            <Text style={styles.text1}>{t("Peso")}</Text>
            <TextInput
              style={styles.TextInput}
              value={`${newData.peso || ""}`}
              onChangeText={(text) => setNewData({ ...newData, peso: text })}
              placeholder="Peso"
              placeholderTextColor="red"
            />

            <Text style={styles.text1}>{t("Altura")}</Text>
            <TextInput
              style={styles.TextInput}
              value={`${newData.altura || ""}`}
              onChangeText={(text) => setNewData({ ...newData, altura: text })}
              placeholder="Altura"
              placeholderTextColor="red"
            />

            <Text style={styles.text1}>{t("Correo electrónico")}</Text>
            <TextInput
              style={styles.TextInput}
              value={`${newData.email || ""}`}
              onChangeText={(text) => setNewData({ ...newData, email: text })}
              placeholder="Email"
              placeholderTextColor="red"
            />

            <Text style={styles.text1}>{t("Género")}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newData.genero}
                onValueChange={(value) =>
                  setNewData({ ...newData, genero: value })
                }
                mode={Platform.OS === "android" ? "dropdown" : undefined}
                style={styles.picker1}
              >
                <Picker.Item label={t("Masculino")} value="Masculino" />
                <Picker.Item label={t("Femenino")} value="Femenino" />
              </Picker>
            </View>
          </KeyboardAwareScrollView>

          <View style={{ flexDirection: "row", marginTop: 20 }}>
            <View style={styles.buttonContainer2}>
              <ButtonGradient
                title={t("Cancelar")}
                onPress={() => setIsEditing(false)}
                style={styles.button2}
              />
            </View>
            <View style={styles.buttonContainer1}>
              <ButtonGradient
                title={t("Guardar")}
                onPress={handleSave}
                style={styles.button1}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default UserProfileScreen;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: Platform.OS === "android" ? 60 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  fixedHeader: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    alignItems: "center",
    justifyContent: "center",
  },
  imagenPerfil: {
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 5,
  },
  button: {
    borderRadius: 25,
    padding: 15,
    width: 230,
  },
  profileDataContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Platform.OS === "ios" ? 8 : 3,
  },
  icon: {
    marginRight: 8,
    color: "#000",
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
  },
  text1: {
    fontSize: 15,
    fontStyle: "italic",
    fontWeight: "bold",
    color: "#000",
    marginTop: 10,
  },
  icon1: {
    width: 60,
    height: 20,
    marginRight: 8,
    resizeMode: "contain",
  },
  beltImage: {
    width: 90,
    height: 55,
    resizeMode: "contain",
    alignSelf: "center",
    marginVertical: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#DCE6E5",
    alignItems: "center",
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 10,
  },
  modalTitle: {
    color: "#000",
    fontSize: 18,
    fontStyle: "italic",
    marginBottom: 15,
    fontWeight: "bold",
    alignSelf: "center",
  },
  modalScrollContent: {
    alignItems: "center",
    paddingBottom: 20,
  },
  TextInput: {
    padding: 10,
    width: "100%",
    height: 50,
    marginTop: 3,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  pickerContainer: {
    width: "100%",
    borderWidth: 3,
    borderColor: "gray",
    borderRadius: 15,
    marginTop: 5,
    backgroundColor: "#fff",
  },
  picker: {
    width: "100%",
    height: Platform.OS === "ios" ? 200 : 60,
    color: "#000",
  },
  picker1: {
    width: "100%",
    color: "#000",
    ...Platform.select({
      ios: {
        height: 140,
        marginTop: -40,
        marginBottom: 40,
      },
      android: {
        height: 60,
      },
    }),
  },
  buttonContainer2: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    width: "50%",
  },
  buttonContainer1: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    width: "50%",
  },
  button2: {
    borderRadius: 25,
    padding: 10,
    width: 140,
    marginTop: 15,
    marginRight: 10,
  },
  button1: {
    borderRadius: 25,
    padding: 10,
    width: 140,
    marginTop: 15,
    marginLeft: 10,
  },
});
