// MessageForm.js
import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Platform,
  Keyboard,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useTranslation } from "react-i18next";

const MessageForm = React.forwardRef(
  (
    {
      message,
      setMessage,
      additionalField1,
      setAdditionalField1,
      localImageUri,
      setLocalImageUri,
      uploading,
      handleChooseImage,
      handleSaveMessage,
      editingMessage,
      handleCancelEdit,
      defaultImage,
    },
    ref
  ) => {
    const { t } = useTranslation(); // Hook para traducción

    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
              <Text style={styles.label}>
                {editingMessage ? t("Editar Mensaje:") : t("Portugués")}
              </Text>
              <TextInput
                ref={ref}
                style={[styles.input, styles.largeInput]}
                value={message}
                onChangeText={setMessage}
                placeholder={t("Mensaje...")}
                multiline
                numberOfLines={6} // Ajusta según necesites
                autoCorrect={false}
                autoCapitalize="none"
                textAlignVertical="top"
              />

              <Text style={styles.label}>{t("Japonés")}</Text>
              <TextInput
                style={[styles.input, styles.largeInput]}
                value={additionalField1}
                onChangeText={setAdditionalField1}
                placeholder={t("Mensaje...")}
                multiline
                numberOfLines={6} // Ajusta según necesites
                autoCorrect={false}
                autoCapitalize="none"
                textAlignVertical="top"
              />

              {/* FILA DE ÍCONOS ARRIBA DE LA IMAGEN */}
              <View style={styles.iconRow}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => {
                    Keyboard.dismiss(); // Oculta el teclado antes de abrir el selector de imágenes
                    handleChooseImage();
                  }}
                >
                  <Icon name="image" size={24} color="#000" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setLocalImageUri(null)}
                >
                  <Icon name="trash" size={24} color="#ff4d4d" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() =>
                    handleSaveMessage(localImageUri || defaultImage)
                  }
                >
                  <Icon name="paper-plane" size={24} color="#007bff" />
                </TouchableOpacity>
              </View>

              {/* PREVISUALIZACIÓN DE LA IMAGEN */}
              <View
                style={[
                  styles.imagePreviewContainer,
                  Platform.OS === "ios"
                    ? styles.imageCenterIOS
                    : styles.imageCenterAndroid,
                ]}
              >
                <Image
                  source={localImageUri ? { uri: localImageUri } : defaultImage}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
              </View>

              {uploading && (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="large" color="#0000ff" />
                  <Text style={styles.uploadingText}>Subiendo imagen...</Text>
                </View>
              )}

              {/* Botón solo visible si estás editando un mensaje (opcional) */}
              {editingMessage && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.cancelButtonText}>Cancelar Edición</Text>
                </TouchableOpacity>
              )}

              <View style={styles.separator} />
            </View>
          </ScrollView>
       
    );
  }
);

const styles = StyleSheet.create({
  // Para que el ScrollView sepa cómo dimensionar el contenido.
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  iconButton: {
    padding: 10,
  },
  imagePreviewContainer: {
    marginTop: 30, // Espaciado uniforme arriba
    marginBottom: 50, // Espaciado uniforme abajo
  },
  imagePreview: {
    width: 220, // Aumenté el tamaño
    height: 220, // Aumenté el tamaño
    borderRadius: 110, // Redonda
    borderWidth: 2, // Borde sutil
    borderColor: "#ddd",
  },
  uploadingContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  uploadingText: {
    marginTop: 5,
    fontSize: 16,
    color: "#555",
  },
  cancelButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  separator: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 20,
  },
  largeInput: {
    minHeight: 120, // Ajusta el tamaño según lo necesites
    textAlignVertical: "top",
  },
  imageCenterIOS: {
    alignSelf: "center", // Centrado en iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  imageCenterAndroid: {
    alignSelf: "center", // Centrado en Android
    elevation: 9, // Sombra en Android
    marginTop: 15,
  },
});

export default React.memo(MessageForm);
