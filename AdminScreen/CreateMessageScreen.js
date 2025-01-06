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
  Modal,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc 
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, auth, storage } from "../firebase";
import { SwipeListView } from 'react-native-swipe-list-view';
import { format } from 'date-fns'; // Importar date-fns para formatear fechas

export default function CreateMessageScreen() {
  const [message, setMessage] = useState("");
  const [localImageUri, setLocalImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [previewMessage, setPreviewMessage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const textInputRef = useRef(null);

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

  // Escuchar los mensajes en tiempo real desde Firestore
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
    }, (error) => {
      console.error("Error al obtener los mensajes: ", error);
    });

    // Limpiar el listener al desmontar
    return () => unsubscribe();
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

      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "Debes estar autenticado para subir una imagen.");
        return null;
      }

      const imageName = `images/${user.uid}/${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.jpg`;
      const imageRef = ref(storage, imageName);
      console.log("Referencia de la imagen creada:", imageRef.fullPath);

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

      const uploadTask = uploadBytesResumable(imageRef, blob);
      console.log("Tarea de subida creada.");

      setUploading(true);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Subiendo imagen: ${progress.toFixed(2)}% completado`);
          },
          (error) => {
            console.error("Error en la tarea de subida:", error);
            Alert.alert(
              "Error",
              "No se pudo subir la imagen. Inténtalo de nuevo."
            );
            setUploading(false);
            reject(error);
          },
          async () => {
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
          return;
        }
      }

      const user = auth.currentUser;

      await addDoc(collection(db, "messages"), {
        text: message.trim(),
        createdAt: serverTimestamp(),
        authorId: user ? user.uid : null,
        imageUrl: imageUrl,
      });

      Alert.alert("Éxito", "Mensaje guardado correctamente.");

      setMessage("");
      setLocalImageUri(null);
      if (textInputRef.current) {
        textInputRef.current.blur();
      }
      Keyboard.dismiss();

    } catch (error) {
      console.error("Error al guardar el mensaje:", error);
      Alert.alert("Error", "No se pudo guardar el mensaje.");
    }
  };

  /**
   * Función para eliminar un mensaje
   * @param {string} messageId - ID del mensaje a eliminar
   * @param {string} imageUrl - URL de la imagen asociada (si existe)
   */
  const handleDeleteMessage = async (messageId, imageUrl) => {
    try {
      // Eliminar el documento de Firestore
      await deleteDoc(doc(db, "messages", messageId));
      console.log(`Mensaje ${messageId} eliminado de Firestore.`);

      // Si el mensaje tiene una imagen, eliminarla de Storage
      if (imageUrl) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
        console.log(`Imagen ${imageUrl} eliminada de Storage.`);
      }

      Alert.alert("Éxito", "Mensaje eliminado correctamente.");
    } catch (error) {
      console.error("Error al eliminar el mensaje:", error);
      Alert.alert("Error", "No se pudo eliminar el mensaje.");
    }
  };

  /**
   * Función para previsualizar un mensaje
   * @param {object} messageItem - Objeto del mensaje a previsualizar
   */
  const handlePreviewMessage = (messageItem) => {
    setPreviewMessage(messageItem);
    setIsModalVisible(true);
  };

  /**
   * Función para formatear la fecha
   * @param {object} timestamp - Objeto Timestamp de Firestore
   * @returns {string} - Fecha formateada
   */
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate(); // Convertir Timestamp a Date
    // Formatear la fecha usando date-fns
    return format(date, 'dd/MM/yyyy HH:mm');
    // Si no usas date-fns, puedes formatear manualmente:
    // return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
  };

  /**
   * Renderizar cada ítem de la lista de mensajes
   */
  const renderItem = (data) => (
    <TouchableOpacity
      style={styles.rowFront}
      onPress={() => handlePreviewMessage(data.item)}
    >
      <View style={styles.messageHeader}>
       
        <Text style={styles.messageDate}>{formatDate(data.item.createdAt)}</Text>
      </View>
      <Text style={styles.messageText}>{data.item.text}</Text>
      {data.item.imageUrl && (
        <Image
          source={{ uri: data.item.imageUrl }}
          style={styles.messageImage}
          resizeMode="cover"
        />
      )}
    </TouchableOpacity>
  );

  /**
   * Renderizar el fondo para el swipe de eliminación
   */
  const renderHiddenItem = (data) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => handleDeleteMessage(data.item.id, data.item.imageUrl)}
      >
        <Text style={styles.backTextWhite}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );

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

          <Button title="Subir Mensaje" onPress={handleSaveMessage} />

          {/* Separador */}
          <View style={styles.separator} />

          {/* Lista de mensajes */}
          <Text style={styles.label}>Mensajes enviados:</Text>
          {messages.length === 0 ? (
            <Text style={styles.noMessagesText}>No hay mensajes.</Text>
          ) : (
            <SwipeListView
              data={messages}
              renderItem={renderItem}
              renderHiddenItem={renderHiddenItem}
              rightOpenValue={-75}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
            />
          )}

          {/* Modal para previsualizar el mensaje */}
          <Modal
            visible={isModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsModalVisible(false)}
          >
            <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    
                    <Text style={styles.modalDate}>{formatDate(previewMessage?.createdAt)}</Text>
                  </View>
                  <Text style={styles.modalText}>{previewMessage?.text}</Text>
                  {previewMessage?.imageUrl && (
                    <Image
                      source={{ uri: previewMessage.imageUrl }}
                      style={styles.modalImage}
                      resizeMode="cover"
                    />
                  )}
                  <Button title="Cerrar" onPress={() => setIsModalVisible(false)} />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
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
  separator: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 20,
  },
  noMessagesText: {
    textAlign: "center",
    color: "#777",
    marginTop: 10,
  },
  listContainer: {
    paddingBottom: 100,
  },
  rowFront: {
    backgroundColor: "#FFF",
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    padding: 20,
    justifyContent: "center",
  },
  rowBack: {
    alignItems: "center",
    backgroundColor: "#DDD",
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingRight: 15,
  },
  backRightBtn: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    position: "absolute",
    top: 0,
    width: 75,
  },
  backRightBtnRight: {
    backgroundColor: "red",
    right: 0,
  },
  backTextWhite: {
    color: "#FFF",
  },
  messageText: {
    fontSize: 16,
    marginBottom: 10,
  },
  messageImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  messageAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  messageDate: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: Dimensions.get('window').width * 0.8,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  modalAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalDate: {
    fontSize: 12,
    color: '#666',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  modalImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
  },
});
