// import React, { useEffect, useState } from "react";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  Modal,
  SafeAreaView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { MaterialIcons } from "@expo/vector-icons";
import ButtonMinimal from "../Styles/ButtonMinimal";
import InputMinimal from "../Styles/InputMinimal";
import CardMinimal from "../Styles/CardMinimal";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Ionicons";

// Mapeo de imágenes de cinturones
const beltImages = {
  white: require("../assets/fotos/whitebelt.png"),
  blue: require("../assets/fotos/bluebelt.png"),
  purple: require("../assets/fotos/purplebelt.png"),
  brown: require("../assets/fotos/brownbelt.png"),
  black: require("../assets/fotos/blackbelt.png"),
};

const getBeltImage = (belt) =>
  beltImages[belt?.toLowerCase()] || beltImages["white"];

const getBeltColor = (belt) => {
  const beltColorMap = {
    white: "#000000",
    blue: "#4285F4",
    purple: "#AA60C8",
    brown: "#8B4513",
    black: "#000000",
  };
  return beltColorMap[belt] || "#333333";
};

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
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
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

  // Datos del perfil organizados
  const profileData = [
    { icon: "person", label: t("Nombre"), value: userData?.nombre },
    { icon: "person", label: t("Apellido"), value: userData?.apellido },
    { icon: "at", label: t("Usuario"), value: `@${userData?.username}` },
    { icon: "call", label: t("Teléfono"), value: userData?.phone },
    { icon: "location", label: t("Ciudad"), value: userData?.ciudad },
    { icon: "location-outline", label: t("Provincia"), value: userData?.provincia },
    { icon: "calendar", label: t("Fecha de Nacimiento"), value: birthDateString || "--" },
    { icon: "time", label: t("Edad"), value: userData?.edad ? `${userData.edad} años` : "--" },
    { icon: "fitness", label: t("Peso"), value: userData?.peso ? `${userData.peso} kg` : "--" },
    { icon: "resize", label: t("Altura"), value: userData?.altura ? `${userData.altura} cm` : "--" },
    { icon: "male-female", label: t("Género"), value: userData?.genero },
    { icon: "mail", label: t("Correo"), value: userData?.email },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header con imagen de perfil */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatar} />
            ) : (
              <Image
                source={require("../assets/fotos/tashiro1.png")}
                style={styles.avatar}
              />
            )}
          </View>
          <Text style={styles.userName}>
            {userData?.nombre} {userData?.apellido}
          </Text>
          <Text style={styles.userHandle}>@{userData?.username}</Text>
          
          {/* Cinturón destacado */}
          <View style={styles.beltSection}>
            <Image
              source={getBeltImage(userData?.cinturon)}
              style={styles.beltImage}
            />
            <Text style={[styles.beltText, { color: getBeltColor(userData?.cinturon) }]}>
              {userData?.cinturon?.charAt(0).toUpperCase() + userData?.cinturon?.slice(1)}
            </Text>
          </View>

          <ButtonMinimal
            title={t("Editar Perfil")}
            onPress={handleEdit}
            variant="outline"
            style={styles.editButton}
          />
        </View>

        {/* Información del perfil */}
        <View style={styles.infoSection}>
          {userData ? (
            profileData.map((item, index) => (
              item.value && (
                <CardMinimal key={index} style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Icon
                      name={item.icon}
                      size={20}
                      color="#666666"
                      style={styles.infoIcon}
                    />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>{item.label}</Text>
                      <Text style={styles.infoValue}>{item.value}</Text>
                    </View>
                  </View>
                </CardMinimal>
              )
            ))
          ) : (
            <CardMinimal style={styles.infoCard}>
              <Text style={styles.noDataText}>
                {t("No se encontraron datos del usuario")}
              </Text>
            </CardMinimal>
          )}
        </View>
      </ScrollView>

      {/* Modal de edición */}
      <Modal visible={isEditing} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          {/* Header del modal */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setIsEditing(false)}
              style={styles.modalCloseButton}
            >
              <Icon name="close" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t("Editar Perfil")}</Text>
            <View style={styles.modalCloseButton} />
          </View>

          <KeyboardAwareScrollView
            style={styles.modalScrollContainer}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalForm}>
              <View style={styles.formRow}>
                <InputMinimal
                  label={t("Nombre")}
                  value={newData.nombre || ""}
                  onChangeText={(text) => setNewData({ ...newData, nombre: text })}
                  placeholder={t("Nombre")}
                  style={styles.halfInput}
                />
                <InputMinimal
                  label={t("Apellido")}
                  value={newData.apellido || ""}
                  onChangeText={(text) => setNewData({ ...newData, apellido: text })}
                  placeholder={t("Apellido")}
                  style={styles.halfInput}
                />
              </View>

              <InputMinimal
                label={t("Usuario")}
                value={newData.username || ""}
                onChangeText={(text) => setNewData({ ...newData, username: text })}
                placeholder={t("Usuario")}
              />

              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>{t("Cinturón")}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={newCinturon}
                    onValueChange={(value) => setNewCinturon(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label={t("Blanco")} value="white" />
                    <Picker.Item label={t("Azul")} value="blue" />
                    <Picker.Item label={t("Violeta")} value="purple" />
                    <Picker.Item label={t("Marrón")} value="brown" />
                    <Picker.Item label={t("Negro")} value="black" />
                  </Picker>
                </View>
                {newCinturon && (
                  <View style={styles.beltPreview}>
                    <Image
                      source={getBeltImage(newCinturon)}
                      style={styles.beltPreviewImage}
                    />
                  </View>
                )}
              </View>

              <View style={styles.formRow}>
                <InputMinimal
                  label={t("Teléfono")}
                  value={newData.phone || ""}
                  onChangeText={(text) => setNewData({ ...newData, phone: text })}
                  placeholder={t("Teléfono")}
                  keyboardType="phone-pad"
                  style={styles.halfInput}
                />
                <InputMinimal
                  label={t("Ciudad")}
                  value={newData.ciudad || ""}
                  onChangeText={(text) => setNewData({ ...newData, ciudad: text })}
                  placeholder={t("Ciudad")}
                  style={styles.halfInput}
                />
              </View>

              <InputMinimal
                label={t("Provincia")}
                value={newData.provincia || ""}
                onChangeText={(text) => setNewData({ ...newData, provincia: text })}
                placeholder={t("Provincia")}
              />

              <View style={styles.formRow}>
                <InputMinimal
                  label={t("Peso (kg)")}
                  value={newData.peso || ""}
                  onChangeText={(text) => setNewData({ ...newData, peso: text })}
                  placeholder={t("Peso")}
                  keyboardType="numeric"
                  style={styles.halfInput}
                />
                <InputMinimal
                  label={t("Altura (cm)")}
                  value={newData.altura || ""}
                  onChangeText={(text) => setNewData({ ...newData, altura: text })}
                  placeholder={t("Altura")}
                  keyboardType="numeric"
                  style={styles.halfInput}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>{t("Género")}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={newData.genero}
                    onValueChange={(value) => setNewData({ ...newData, genero: value })}
                    style={styles.picker}
                  >
                    <Picker.Item label={t("Masculino")} value="Masculino" />
                    <Picker.Item label={t("Femenino")} value="Femenino" />
                  </Picker>
                </View>
              </View>

              <InputMinimal
                label={t("Correo electrónico")}
                value={newData.email || ""}
                onChangeText={(text) => setNewData({ ...newData, email: text })}
                placeholder={t("Correo")}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </KeyboardAwareScrollView>

          {/* Botones del modal */}
          <View style={styles.modalButtons}>
            <ButtonMinimal
              title={t("Cancelar")}
              onPress={() => setIsEditing(false)}
              variant="outline"
              style={styles.modalButton}
            />
            <ButtonMinimal
              title={t("Guardar")}
              onPress={handleSave}
              style={styles.modalButton}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    paddingBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  userName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 20,
  },
  beltSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  beltImage: {
    width: 80,
    height: 30,
    resizeMode: "contain",
    marginBottom: 8,
  },
  beltText: {
    fontSize: 18,
    fontWeight: "600",
  },
  editButton: {
    paddingHorizontal: 32,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoCard: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: 16,
    width: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
  },
  noDataText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    fontStyle: "italic",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  modalScrollContainer: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  modalForm: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formRow: {
    flexDirection: "row",
    gap: 16,
  },
  halfInput: {
    flex: 1,
  },
  formSection: {
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 8,
  },
  pickerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  picker: {
    height: Platform.OS === 'ios' ? 190 : 'auto',
    width: '100%',
    backgroundColor: '#33333',
    transform: [{ scale: 0.95 }], // Reducir tamaño a 85%
  },
  beltPreview: {
    alignItems: "center",
    marginTop: 16,
  },
  beltPreviewImage: {
    width: 60,
    height: 25,
    resizeMode: "contain",
  },
  modalButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

export default UserProfileScreen;
