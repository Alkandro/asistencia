// CreateMessageScreen.js
import React, { useState, useEffect, useRef, useCallback } from "react";
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
  ScrollView,
  FlatList, // Importar FlatList para swipe horizontal
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
import { format } from 'date-fns';

export default function CreateMessageScreen() {
  const [message, setMessage] = useState("");
  const [additionalField1, setAdditionalField1] = useState(""); // Nuevo campo
  const [additionalField2, setAdditionalField2] = useState(""); // Nuevo campo
  const [localImageUris, setLocalImageUris] = useState([]); // Cambiar a array
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [previewMessage, setPreviewMessage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const textInputRef = useRef(null);

  // Obtener dimensiones de la ventana
  const windowWidth = Dimensions.get('window').width;
  const modalWidth = windowWidth * 0.9; // 90% del ancho de la pantalla

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
   * Función para abrir el selector de imágenes y seleccionar múltiples imágenes
   */
  const handleChooseImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true, // Permitir selección múltiple (Nota: Asegúrate de que la versión de expo-image-picker lo soporte)
        quality: 0.7,
      });

      console.log("RESULT =>", result);

      if (!result.canceled) {
        const selectedAssets = result.assets;
        const uris = selectedAssets.map(asset => asset.uri);
        setLocalImageUris(prevUris => [...prevUris, ...uris]); // Agregar nuevas imágenes al array
        console.log("URIs de las imágenes seleccionadas:", uris);
      } else {
        console.log("Selección de imágenes cancelada.");
      }
    } catch (error) {
      console.error("Error al elegir imágenes:", error);
      Alert.alert("Error", "No se pudo elegir las imágenes.");
    }
  };

  /**
   * Función para subir múltiples imágenes a Firebase Storage
   * @param {array} uris - Array de URIs locales de las imágenes
   * @returns {array} - Array de URLs de descarga de las imágenes
   */
  const uploadImagesToStorage = async (uris) => {
    try {
      if (!uris || uris.length === 0) {
        console.log("No se proporcionaron URIs para las imágenes.");
        return [];
      }

      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "Debes estar autenticado para subir imágenes.");
        return [];
      }

      const uploadPromises = uris.map(async (uri) => {
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
                "No se pudo subir una de las imágenes. Inténtalo de nuevo."
              );
              setUploading(false);
              reject(error);
            },
            async () => {
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                console.log("Imagen subida exitosamente. URL:", downloadUrl);
                resolve(downloadUrl);
              } catch (error) {
                console.error("Error al obtener la URL de descarga:", error);
                Alert.alert(
                  "Error",
                  "No se pudo obtener la URL de una de las imágenes."
                );
                setUploading(false);
                reject(error);
              }
            }
          );
        });
      });

      setUploading(true);
      const downloadUrls = await Promise.all(uploadPromises);
      setUploading(false);
      Alert.alert("Éxito", "Imágenes subidas correctamente.");
      return downloadUrls;
    } catch (error) {
      console.error("Error en uploadImagesToStorage:", error);
      Alert.alert(
        "Error",
        "No se pudo subir las imágenes. Inténtalo de nuevo."
      );
      setUploading(false);
      return [];
    }
  };

  /**
   * Función para manejar el guardado del mensaje y las imágenes
   */
  const handleSaveMessage = async () => {
    if (message.trim().length === 0) {
      Alert.alert("Error", "Por favor escribe un mensaje.");
      return;
    }

    try {
      let imageUrls = [];
      if (localImageUris.length > 0) {
        imageUrls = await uploadImagesToStorage(localImageUris);
        if (imageUrls.length === 0) {
          return;
        }
      }

      const user = auth.currentUser;

      await addDoc(collection(db, "messages"), {
        text: message.trim(),
        additionalField1: additionalField1.trim(), // Guardar nuevo campo
        additionalField2: additionalField2.trim(), // Guardar nuevo campo
        createdAt: serverTimestamp(),
        authorId: user ? user.uid : null,
        imageUrls: imageUrls, // Guardar array de URLs
      });

      Alert.alert("Éxito", "Mensaje guardado correctamente.");

      setMessage("");
      setAdditionalField1(""); // Resetear nuevo campo
      setAdditionalField2(""); // Resetear nuevo campo
      setLocalImageUris([]);
      Keyboard.dismiss();

    } catch (error) {
      console.error("Error al guardar el mensaje:", error);
      Alert.alert("Error", "No se pudo guardar el mensaje.");
    }
  };

  /**
   * Función para eliminar un mensaje
   * @param {string} messageId - ID del mensaje a eliminar
   * @param {array} imageUrls - Array de URLs de las imágenes asociadas (si existen)
   */
  const handleDeleteMessage = async (messageId, imageUrls) => {
    try {
      // Eliminar el documento de Firestore
      await deleteDoc(doc(db, "messages", messageId));
      console.log(`Mensaje ${messageId} eliminado de Firestore.`);

      // Si el mensaje tiene imágenes, eliminarlas de Storage
      if (imageUrls && imageUrls.length > 0) {
        const deletePromises = imageUrls.map(async (url) => {
          const imageRef = ref(storage, url);
          await deleteObject(imageRef);
          console.log(`Imagen ${url} eliminada de Storage.`);
        });
        await Promise.all(deletePromises);
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
  };

  /**
   * Renderizar cada ítem de la lista de mensajes
   */
  const renderItem = useCallback((data) => (
    <TouchableOpacity
      style={styles.rowFront}
      onPress={() => handlePreviewMessage(data.item)}
    >
      <View style={styles.messageHeader}>
        {/* Puedes agregar el autor si tienes la información */}
        {/* <Text style={styles.messageAuthor}>{data.item.authorName}</Text> */}
        <Text style={styles.messageDate}>{formatDate(data.item.createdAt)}</Text>
      </View>
      <Text style={styles.messageText}>{data.item.text}</Text>
      {data.item.imageUrls && data.item.imageUrls.length > 0 && (
        <ScrollView horizontal>
          {data.item.imageUrls.map((url, index) => (
            <Image
              key={index}
              source={{ uri: url }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}
      {/* Mostrar campos adicionales si existen */}
      {data.item.additionalField1 ? (
        <Text style={styles.additionalField}>Campo 1: {data.item.additionalField1}</Text>
      ) : null}
      {data.item.additionalField2 ? (
        <Text style={styles.additionalField}>Campo 2: {data.item.additionalField2}</Text>
      ) : null}
    </TouchableOpacity>
  ), []);

  /**
   * Renderizar el fondo para el swipe de eliminación
   */
  const renderHiddenItem = useCallback((data) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => handleDeleteMessage(data.item.id, data.item.imageUrls)}
      >
        <Text style={styles.backTextWhite}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  ), []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Formulario de Creación de Mensaje */}
        <View style={styles.formContainer}>
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

          {/* Campos adicionales */}
          <Text style={styles.label}>Campo Adicional 1:</Text>
          <TextInput
            style={styles.input}
            value={additionalField1}
            onChangeText={setAdditionalField1}
            placeholder="Campo Adicional 1..."
          />

          <Text style={styles.label}>Campo Adicional 2:</Text>
          <TextInput
            style={styles.input}
            value={additionalField2}
            onChangeText={setAdditionalField2}
            placeholder="Campo Adicional 2..."
          />

          {/* Botón para abrir el selector de imágenes */}
          <Button title="Elegir Imágenes" onPress={handleChooseImages} />

          {/* Mostrar preview de las imágenes elegidas */}
          {localImageUris.length > 0 && (
            <ScrollView horizontal style={styles.imagePreviewContainer}>
              {localImageUris.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          )}

          {/* Mostrar indicador de carga mientras se suben las imágenes */}
          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.uploadingText}>Subiendo imágenes...</Text>
            </View>
          )}

          <Button title="Subir Mensaje" onPress={handleSaveMessage} />

          {/* Separador */}
          <View style={styles.separator} />
        </View>

        {/* Lista de mensajes */}
        <View style={styles.listContainer}>
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
              extraData={messages}
            />
          )}
        </View>

        {/* Modal para previsualizar el mensaje */}
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
            <View style={styles.modalOverlay}>
              {/* Evitar que los toques dentro del contenido del modal cierren el modal */}
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.modalContent}>
                  <ScrollView>
                    <View style={styles.modalHeader}>
                      {/* Puedes agregar el autor si tienes la información */}
                      {/* <Text style={styles.modalAuthor}>{previewMessage?.authorName}</Text> */}
                      <Text style={styles.modalDate}>{formatDate(previewMessage?.createdAt)}</Text>
                    </View>
                    <Text style={styles.modalText}>{previewMessage?.text}</Text>
                    
                    {/* Swipe Horizontal para las imágenes */}
                    {previewMessage?.imageUrls && previewMessage.imageUrls.length > 0 && (
                      <FlatList
                        data={previewMessage.imageUrls}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                          <Image
                            source={{ uri: item }}
                            style={[styles.modalImage, { width: modalWidth - 40 }]} // Ajustar el ancho
                            resizeMode="cover"
                          />
                        )}
                      />
                    )}
                    
                    {/* Mostrar campos adicionales si existen */}
                    {previewMessage?.additionalField1 ? (
                      <Text style={styles.additionalField}>Campo 1: {previewMessage.additionalField1}</Text>
                    ) : null}
                    {previewMessage?.additionalField2 ? (
                      <Text style={styles.additionalField}>Campo 2: {previewMessage.additionalField2}</Text>
                    ) : null}
                    <Button title="Cerrar" onPress={() => setIsModalVisible(false)} />
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  formContainer: {
    padding: 16,
    backgroundColor: "#f9f9f9",
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
    backgroundColor: "#fff",
  },
  imagePreviewContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginRight: 10,
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
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  noMessagesText: {
    textAlign: "center",
    color: "#777",
    marginTop: 10,
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
    marginRight: 10,
  },
  additionalField: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
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
    width: Dimensions.get('window').width * 0.9,
    maxHeight: Dimensions.get('window').height * 0.8, // Limitar la altura para permitir scroll
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
    height: 300,
    marginBottom: 20,
    borderRadius: 10,
  },
});
