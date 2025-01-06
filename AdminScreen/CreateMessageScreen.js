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
  Keyboard, // Importar Keyboard
  TouchableWithoutFeedback, // Para cerrar el teclado al tocar fuera
  KeyboardAvoidingView, // Para ajustar la vista cuando el teclado está abierto
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker"; // Importar expo-image-picker
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { db, auth, storage } from "../firebase"; // Asegúrate de que firebase.js está correctamente configurado

export default function CreateMessageScreen() {
  const [message, setMessage] = useState("");
  const [localImageUri, setLocalImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const textInputRef = useRef(null); // Crear una referencia al TextInput

  // Solicitar permisos al montar el componente
  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
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
        quality: 0.7, // Ajusta la calidad según tus necesidades
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
   * Función para subir la imagen a Firebase Storage
   * @param {string} uri - URI local de la imagen
   * @returns {string|null} - URL de descarga de la imagen o null si falla
   */
  const uploadImageToStorage = async (uri) => {
    try {
      if (!uri) {
        console.log("No se proporcionó URI para la imagen.");
        return null;
      }

      // Verificar si el usuario está autenticado
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "Debes estar autenticado para subir una imagen.");
        return null;
      }

      // Generar un nombre único para la imagen
      const imageName = `images/${user.uid}/${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.jpg`;
      const imageRef = ref(storage, imageName);
      console.log("Referencia de la imagen creada:", imageRef.fullPath);

      // Convertir URI a Blob usando XMLHttpRequest
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          console.log("Blob obtenido exitosamente.");
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          console.error("Error al obtener el blob:", e);
          reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
      });

      console.log("Blob convertido correctamente:", blob);

      // Crear la tarea de subida
      const uploadTask = uploadBytesResumable(imageRef, blob);
      console.log("Tarea de subida creada.");

      setUploading(true); // Mostrar indicador de carga

      // Retornar una nueva promesa que se resuelve cuando la subida termina
      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Subiendo imagen: ${progress.toFixed(2)}% completado`);
          },
          (error) => {
            // Manejar errores de la subida
            console.error("Error en la tarea de subida:", error);
            Alert.alert(
              "Error",
              "No se pudo subir la imagen. Inténtalo de nuevo."
            );
            setUploading(false);
            reject(error);
          },
          async () => {
            // Subida completada exitosamente
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              console.log("Imagen subida exitosamente. URL:", downloadUrl);
              Alert.alert("Éxito", "Imagen subida correctamente.");
              setUploading(false);
              resolve(downloadUrl);
            } catch (error) {
              console.error("Error al obtener la URL de descarga:", error);
              Alert.alert(
                "Error",
                "No se pudo obtener la URL de la imagen."
              );
              setUploading(false);
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error("Error en uploadImageToStorage:", error);
      Alert.alert(
        "Error",
        "No se pudo subir la imagen. Inténtalo de nuevo."
      );
      setUploading(false);
      return null;
    }
  };

  /**
   * Función para manejar el guardado del mensaje y la imagen
   */
  const handleSaveMessage = async () => {
    if (message.trim().length === 0) {
      Alert.alert("Error", "Por favor escribe un mensaje.");
      return;
    }

    try {
      let imageUrl = null;
      if (localImageUri) {
        imageUrl = await uploadImageToStorage(localImageUri);
        if (!imageUrl) {
          // Si la subida de la imagen falló, no continuar
          return;
        }
      }

      const user = auth.currentUser;

      // Crear documento en Firestore: "messages"
      await addDoc(collection(db, "messages"), {
        text: message.trim(),
        createdAt: serverTimestamp(),
        authorId: user ? user.uid : null,
        imageUrl: imageUrl, // URL de la imagen, si existe
      });

      Alert.alert("Éxito", "Mensaje guardado correctamente.");

      // Limpiar campos y cerrar el teclado
      setMessage("");
      setLocalImageUri(null);
      if (textInputRef.current) {
        textInputRef.current.blur(); // Desenfocar el TextInput
      }
      Keyboard.dismiss(); // Cerrar el teclado

    } catch (error) {
      console.error("Error al guardar el mensaje:", error);
      Alert.alert("Error", "No se pudo guardar el mensaje.");
    }
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
            ref={textInputRef} // Asignar la referencia al TextInput
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

          <Button title="Subir Mensaje" onPress={handleSaveMessage} />
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
    textAlignVertical: "top", // Para alinear el texto al inicio en Android
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
