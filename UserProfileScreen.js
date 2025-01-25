import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  TextInput,
  Modal,
  ScrollView,
  SafeAreaView,
  Platform,
} from "react-native";
import { auth, db } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { MaterialIcons } from "@expo/vector-icons";
import ButtonGradient from "./ButtonGradient";
import { Picker } from "@react-native-picker/picker"; // Importamos el Picker nativo
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

// Mapeo de imágenes de cinturones
const beltImages = {
  white: require("./assets/fotos/whiteBelt.png"),
  blue: require("./assets/fotos/blueBelt.png"),
  purple: require("./assets/fotos/purpleBelt.png"),
  brown: require("./assets/fotos/brownBelt.png"),
  black: require("./assets/fotos/blackBelt.png"),
};

const getBeltImage = (belt) =>
  beltImages[belt?.toLowerCase()] || beltImages["white"];

const UserProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newData, setNewData] = useState({});
  const [imageUri, setImageUri] = useState(null);

  // Estado para el cinturón (solo lo usaremos con el Picker)
  const [cinturon, setNewCinturon] = useState("");

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

  const handleEdit = () => {
    setNewData(userData);
    setNewCinturon(userData.cinturon); // Inicializar el estado del cinturón
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Actualizamos el cinturon con el valor seleccionado en el Picker
        const updatedData = { ...newData, cinturon: cinturon };
        await updateDoc(doc(db, "users", user.uid), updatedData);
        setUserData(updatedData);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error al actualizar los datos:", error);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        behavior={Platform.OS === "ios" ? "height" : "height"}
        style={styles.container}
      >
        <View>
          <View style={styles.fixedHeader}>
            <View style={styles.imagenPerfil}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: 100, height: 100, borderRadius: 50 }}
                />
              ) : (
                <Image
                  source={require("./assets/fotos/tashiro1.jpg")}
                  style={{ width: 100, height: 100, borderRadius: 50 }}
                />
              )}
            </View>
            <View style={styles.buttonContainer}>
              <ButtonGradient
                title="Editar Perfil"
                onPress={handleEdit}
                style={styles.button}
              />
            </View>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.container}>
              {userData ? (
                <>
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
                      <Text
                        style={{
                          color: "#000",
                          fontSize: 18,
                          fontStyle: "italic",
                          marginBottom: 15,
                          fontWeight: "bold",
                        }}
                      >
                        Editar perfil
                      </Text>

                      <KeyboardAwareScrollView
                        keyboardShouldPersistTaps="handled"
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={{ width: "100%" }}
                        contentContainerStyle={styles.modalScrollContent}
                      >
                        {/* -- Campos de texto -- */}
                        <Text style={styles.text1}>Nombre</Text>
                        <TextInput
                          style={styles.TextInput}
                          value={`${newData.nombre}`}
                          onChangeText={(text) => {
                            const newName = text.replace("Nombre: ", "");
                            setNewData({ ...newData, nombre: newName });
                          }}
                          placeholder="Nombre"
                          placeholderTextColor="red"
                        />

                        <Text style={styles.text1}>Apellido</Text>
                        <TextInput
                          style={styles.TextInput}
                          value={`${newData.apellido}`}
                          onChangeText={(text) => {
                            const nuevoApellido = text.replace(
                              "Apellido: ",
                              ""
                            );
                            setNewData({
                              ...newData,
                              apellido: nuevoApellido,
                            });
                          }}
                          placeholder="Apellido"
                          placeholderTextColor="red"
                        />

                        <Text style={styles.text1}>User</Text>
                        <TextInput
                          style={styles.TextInput}
                          value={`${newData.username}`}
                          onChangeText={(text) =>
                            setNewData({
                              ...newData,
                              username: text.replace(/^User: /, ""),
                            })
                          }
                          placeholder="User"
                          placeholderTextColor="red"
                        />
                        <Text style={styles.text1}>Cinturón</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={cinturon}
                            onValueChange={(value) => setNewCinturon(value)}
                            mode={
                              Platform.OS === "android" ? "dropdown" : undefined
                            }
                            style={{
                              width: "100%",
                              height: Platform.OS === "ios" ? 200 : 60, // forzamos una altura menor
                            }}
                          >
                            <Picker.Item label="White" value="white" />
                            <Picker.Item label="Blue" value="blue" />
                            <Picker.Item label="Purple" value="purple" />
                            <Picker.Item label="Brown" value="brown" />
                            <Picker.Item label="Black" value="black" />
                          </Picker>
                        </View>

                        {/* Vista previa del cinturón */}
                        {cinturon ? (
                          <Image
                            source={getBeltImage(cinturon)}
                            style={styles.beltImage}
                          />
                        ) : null}

                        <Text style={styles.text1}>Telefono</Text>
                        <TextInput
                          style={styles.TextInput}
                          value={`${newData.phone}`}
                          onChangeText={(text) =>
                            setNewData({
                              ...newData,
                              phone: text.replace(/^Teléfono: /, ""),
                            })
                          }
                          placeholder="Teléfono"
                          placeholderTextColor="red"
                        />

                        <Text style={styles.text1}>Ciudad</Text>
                        <TextInput
                          style={styles.TextInput}
                          value={`${newData.ciudad}`}
                          onChangeText={(text) =>
                            setNewData({
                              ...newData,
                              ciudad: text.replace(/^Ciudad: /, ""),
                            })
                          }
                          placeholder="Ciudad"
                          placeholderTextColor="red"
                        />

                        <Text style={styles.text1}>Provincia</Text>
                        <TextInput
                          style={styles.TextInput}
                          value={`${newData.provincia}`}
                          onChangeText={(text) =>
                            setNewData({
                              ...newData,
                              provincia: text.replace(/^Provincia: /, ""),
                            })
                          }
                          placeholder="Provincia"
                          placeholderTextColor="red"
                        />

                        <Text style={styles.text1}>Edad</Text>
                        <TextInput
                          style={styles.TextInput}
                          value={`${newData.edad}`}
                          onChangeText={(text) =>
                            setNewData({
                              ...newData,
                              edad: text.replace(/^Edad: /, ""),
                            })
                          }
                          placeholder="Edad"
                          placeholderTextColor="red"
                        />

                        <Text style={styles.text1}>Peso</Text>
                        <TextInput
                          style={styles.TextInput}
                          value={`${newData.peso}`}
                          onChangeText={(text) =>
                            setNewData({
                              ...newData,
                              peso: text.replace(/^Peso: /, ""),
                            })
                          }
                          placeholder="Peso"
                          placeholderTextColor="red"
                        />

                        <Text style={styles.text1}>Altura</Text>
                        <TextInput
                          style={styles.TextInput}
                          value={`${newData.altura}`}
                          onChangeText={(text) =>
                            setNewData({
                              ...newData,
                              altura: text.replace(/^Altura: /, ""),
                            })
                          }
                          placeholder="Altura"
                          placeholderTextColor="red"
                        />

                        <Text style={styles.text1}>Email</Text>
                        <TextInput
                          style={styles.TextInput}
                          value={`${newData.email}`}
                          onChangeText={(text) =>
                            setNewData({
                              ...newData,
                              email: text.replace(/^Email: /, ""),
                            })
                          }
                          placeholder="Email"
                          placeholderTextColor="red"
                        />

                      
                        
                      </KeyboardAwareScrollView>

                      <View style={{ flexDirection: "row", marginTop: 40 }}>
                        <View style={styles.buttonContainer2}>
                          <ButtonGradient
                            title="Cancelar"
                            onPress={() => setIsEditing(false)}
                            style={styles.button2}
                          />
                        </View>
                        <View style={styles.buttonContainer1}>
                          <ButtonGradient
                            title="Guardar"
                            onPress={handleSave}
                            style={styles.button1}
                          />
                        </View>
                      </View>
                    </View>
                  </Modal>
                </>
              ) : (
                <Text style={styles.text1}>
                  No se encontraron datos del usuario
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  fixedHeader: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    height: 170,
  },
  imagenPerfil: {
    flex: 1,
    alignItems: "center",
    margin: -10,
  },
  buttonContainer: {
    alignItems: "center",
    backgroundColor: "transparent",
    padding: 10,
    margin: -15,
  },
  button: {
    marginHorizontal: "auto",
    borderRadius: 25,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
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
  beltImage: {
    width: 90,
    height: 55,
    resizeMode: "contain",
    alignSelf: "center",
    marginVertical: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#DCE6E5",
  },
  modalScrollContent: {
    alignItems: "center",
    paddingBottom: 20,
  },
  text1: {
    fontSize: 15,
    fontStyle: "italic",
    fontWeight: "bold",
    marginTop: 10,
    color: "#000",
    marginLeft: -250,
  },
  TextInput: {
    padding: 10,
    paddingStart: 15,
    width: "100%",
    height: 50,
    marginTop: 3,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  pickerContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: "#fff",
  },
  picker: {
    width: "100%",
    height: 60,
    color: "#000",
  },
  buttonContainer2: {
    alignItems: "center",
    backgroundColor: "transparent",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    margin: -30,
    marginBottom:10,
    width: "60%",
  },
  button2: {
    borderRadius: 25,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 180,
    marginRight: 50,
    marginBottom: 16,
  },
  buttonContainer1: {
    alignItems: "center",
    backgroundColor: "transparent",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    margin: -30,
    marginBottom:10,
    width: "60%",
  },
  button1: {
    borderRadius: 25,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 180,
    marginLeft: 50,
    marginBottom: 16,
  },
});

export default UserProfileScreen;
