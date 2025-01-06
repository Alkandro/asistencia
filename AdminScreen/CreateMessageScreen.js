// CreateMessageScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native"; // Importar useNavigation
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../firebase";

export default function CreateMessageScreen() {
  const [message, setMessage] = useState("");
  const [localImageUri, setLocalImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);

  const textInputRef = useRef(null);
  const navigation = useNavigation(); // Inicializar useNavigation

  // Solicitar permisos al montar el componente
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permisos insuficientes",
          "Necesitamos permisos para acceder a tu biblioteca de medios."
        );
      }
    })();
  }, []);

  /**
   * Función para abrir el selector de imágenes y seleccionar una imagen
   */
  const handleChooseImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      console.log("RESULT =>", result);

      if (!result.canceled) {
        const selectedAsset = result.assets[0];
        setLocalImageUri(selectedAsset.uri);
        console.log("URI de la imagen seleccionada:", selectedAsset.uri);
      } else {
        console.log("Selección de imagen cancelada.");
      }
    } catch (error) {
      console.error("Error al elegir imagen:", error);
      Alert.alert("Error", "No se pudo elegir la imagen.");
    }
  };

  /**
   * Función para manejar el guardado del mensaje y la imagen
   */
  const handleCreateMessage = () => {
    if (message.trim().length === 0) {
      Alert.alert("Error", "Por favor escribe un mensaje.");
      return;
    }

    // Navegar a la pantalla de previsualización, pasando los datos como parámetros
    navigation.navigate("PreviewMessage", {
      message: message.trim(),
      imageUri: localImageUri,
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.innerContainer}>
          <Text style={styles.label}>Escribe un mensaje:</Text>
          <TextInput
            ref={textInputRef}
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Mensaje..."
            multiline
            numberOfLines={4}
          />

          {/* Botón para abrir el selector de imágenes */}
          <Button title="Elegir Imagen" onPress={handleChooseImage} />

          {/* Mostrar preview de la imagen elegida */}
          {localImageUri && (
            <Image
              source={{ uri: localImageUri }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          )}

          {/* Mostrar indicador de carga mientras se sube la imagen */}
          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.uploadingText}>Subiendo imagen...</Text>
            </View>
          )}

          {/* Botón para crear el mensaje */}
          <Button title="Crear Mensaje" onPress={handleCreateMessage} />
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    justifyContent: "flex-start",
  },
  label: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    textAlignVertical: "top",
  },
  imagePreview: {
    width: 200,
    height: 200,
    marginTop: 10,
    alignSelf: "center",
    borderRadius: 10,
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
});
