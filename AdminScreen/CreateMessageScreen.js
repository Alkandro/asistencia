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
  doc,
  updateDoc, // Importa updateDoc
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
import { Card, Paragraph, Title } from 'react-native-paper'; // Importa Paragraph y Title

export default function CreateMessageScreen() {
  const [message, setMessage] = useState("");
  const [additionalField1, setAdditionalField1] = useState("");
  const [additionalField2, setAdditionalField2] = useState("");
  const [localImageUri, setLocalImageUri] = useState(null); // Cambiado a una sola URI
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [previewMessage, setPreviewMessage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null); // Nuevo estado para edición
  
  const textInputRef = useRef(null);

  const windowWidth = Dimensions.get('window').width;
  const modalWidth = windowWidth * 0.9;

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

    return () => unsubscribe();
  }, []);

  /**
   * Función para abrir el selector de imágenes y seleccionar una imagen
   */
  const handleChooseImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false, // Solo una imagen
        quality: 0.7,
      });

      console.log("RESULT =>", result);

      if (!result.canceled) {
        const selectedAsset = result.assets[0];
        setLocalImageUri(selectedAsset.uri); // Guardar solo una URI
        console.log("URI de la imagen seleccionada:", selectedAsset.uri);
      } else {
        console.log("Selección de imagen cancelada.");
      }
    } catch (error) {
      console.error("Error al elegir la imagen:", error);
      Alert.alert("Error", "No se pudo elegir la imagen.");
    }
  };

  /**
   * Función para subir una imagen a Firebase Storage
   * @param {string} uri - URI local de la imagen
   * @returns {string|null} - URL de descarga de la imagen o null en caso de error
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

      return await new Promise((resolve, reject) => {
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
      let imageUrl = localImageUri;

      // Si hay una nueva imagen y estamos editando, subirla
      if (localImageUri && (editingMessage ? localImageUri !== editingMessage.imageUrl : true)) {
        setUploading(true);
        const uploadedImageUrl = await uploadImageToStorage(localImageUri);
        setUploading(false);
        if (!uploadedImageUrl) {
          return;
        }
        imageUrl = uploadedImageUrl;

        // Si estamos editando y había una imagen anterior diferente, eliminarla
        if (editingMessage && editingMessage.imageUrl && editingMessage.imageUrl !== uploadedImageUrl) {
          const oldImageRef = ref(storage, editingMessage.imageUrl);
          await deleteObject(oldImageRef);
          console.log(`Imagen antigua ${editingMessage.imageUrl} eliminada de Storage.`);
        }
      }

      const user = auth.currentUser;

      if (editingMessage) {
        // Actualizar el mensaje existente
        const messageRef = doc(db, "messages", editingMessage.id);
        await updateDoc(messageRef, {
          text: message.trim(),
          additionalField1: additionalField1.trim(),
          additionalField2: additionalField2.trim(),
          imageUrl: imageUrl, // Actualizar la URL de la imagen
          updatedAt: serverTimestamp(),
        });

        Alert.alert("Éxito", "Mensaje actualizado correctamente.");
      } else {
        // Crear un nuevo mensaje
        await addDoc(collection(db, "messages"), {
          text: message.trim(),
          additionalField1: additionalField1.trim(),
          additionalField2: additionalField2.trim(),
          createdAt: serverTimestamp(),
          authorId: user ? user.uid : null,
          imageUrl: imageUrl, // Guardar una sola URL
        });

        Alert.alert("Éxito", "Mensaje guardado correctamente.");
      }

      // Resetear el formulario
      setMessage("");
      setAdditionalField1("");
      setAdditionalField2("");
      setLocalImageUri(null);
      setEditingMessage(null);
      Keyboard.dismiss();

    } catch (error) {
      console.error("Error al guardar el mensaje:", error);
      Alert.alert("Error", "No se pudo guardar el mensaje.");
    }
  };

  /**
   * Función para eliminar un mensaje
   * @param {string} messageId - ID del mensaje a eliminar
   * @param {string|null} imageUrl - URL de la imagen asociada (si existe)
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
   * Función para manejar la edición de un mensaje
   * @param {object} messageItem - Objeto del mensaje a editar
   */
  const handleEditMessage = (messageItem) => {
    setEditingMessage(messageItem);
    setMessage(messageItem.text);
    setAdditionalField1(messageItem.additionalField1 || "");
    setAdditionalField2(messageItem.additionalField2 || "");
    setLocalImageUri(messageItem.imageUrl || null);
  };

  /**
   * Función para cancelar la edición
   */
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setMessage("");
    setAdditionalField1("");
    setAdditionalField2("");
    setLocalImageUri(null);
  };

  /**
   * Función para formatear la fecha
   * @param {object} timestamp - Objeto Timestamp de Firestore
   * @returns {string} - Fecha formateada
   */
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
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
      <Card style={styles.card}>
        <Card.Title 
          title={`Publicado el ${formatDate(data.item.createdAt)}`} 
          right={(props) => (
            <Button
              {...props}
              title="Editar"
              onPress={() => handleEditMessage(data.item)}
            />
          )}
        />
        <Card.Content>
          <Paragraph>{data.item.text}</Paragraph>
          {/* Mostrar campos adicionales si existen */}
          {data.item.additionalField1 && data.item.additionalField2 ? (
            <>
              <Paragraph>Campo Adicional 1: {data.item.additionalField1}</Paragraph>
              <Paragraph>Campo Adicional 2: {data.item.additionalField2}</Paragraph>
              <Paragraph>
                Suma de campos adicionales: {parseFloat(data.item.additionalField1) + parseFloat(data.item.additionalField2)}
              </Paragraph>
            </>
          ) : null}
        </Card.Content>
        {data.item.imageUrl && (
          <Card.Cover source={{ uri: data.item.imageUrl }} />
        )}
      </Card>
    </TouchableOpacity>
  ), []);

  /**
   * Renderizar el fondo para el swipe de eliminación
   */
  const renderHiddenItem = useCallback((data) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => handleDeleteMessage(data.item.id, data.item.imageUrl)}
      >
        <Text style={styles.backTextWhite}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  ), []);

  /**
   * Renderizar el formulario como componente de encabezado
   */
  const renderHeader = () => (
    <View style={styles.formContainer}>
      <Text style={styles.label}>
        {editingMessage ? "Editar Mensaje:" : "Escribe un mensaje:"}
      </Text>
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
      <Button title="Elegir Imagen" onPress={handleChooseImage} />

      {/* Mostrar preview de la imagen elegida */}
      {localImageUri && (
        <View style={styles.imagePreviewContainer}>
          <Image
            source={{ uri: localImageUri }}
            style={styles.imagePreview}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => setLocalImageUri(null)}
          >
            <Text style={styles.removeImageText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mostrar indicador de carga mientras se sube la imagen */}
      {uploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.uploadingText}>Subiendo imagen...</Text>
        </View>
      )}

      <Button
        title={editingMessage ? "Actualizar Mensaje" : "Subir Mensaje"}
        onPress={handleSaveMessage}
      />

      {/* Mostrar botón para cancelar la edición */}
      {editingMessage && (
        <Button
          title="Cancelar Edición"
          color="red"
          onPress={handleCancelEdit}
        />
      )}

      {/* Separador */}
      <View style={styles.separator} />
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Lista de mensajes con el formulario como encabezado */}
        <SwipeListView
          data={messages}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-75}
          keyExtractor={(item) => item.id}
          extraData={messages}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: 20 }}
        />

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
                      <Text style={styles.modalDate}>{formatDate(previewMessage?.createdAt)}</Text>
                    </View>
                    <Text style={styles.modalText}>{previewMessage?.text}</Text>
                    
                    {/* Mostrar la imagen si existe */}
                    {previewMessage?.imageUrl && (
                      <Card style={styles.modalCard}>
                        <Card.Cover source={{ uri: previewMessage.imageUrl }} />
                        <Card.Title title={`Publicado el ${formatDate(previewMessage.createdAt)}`} />
                        <Card.Content>
                          <Paragraph>{previewMessage.text}</Paragraph>
                          {/* Mostrar campos adicionales si existen */}
                          {previewMessage.additionalField1 && previewMessage.additionalField2 ? (
                            <>
                              <Paragraph>Campo Adicional 1: {previewMessage.additionalField1}</Paragraph>
                              <Paragraph>Campo Adicional 2: {previewMessage.additionalField2}</Paragraph>
                              <Paragraph>
                                Suma de campos adicionales: {parseFloat(previewMessage.additionalField1) + parseFloat(previewMessage.additionalField2)}
                              </Paragraph>
                            </>
                          ) : null}
                        </Card.Content>
                      </Card>
                    )}
                    
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
    alignItems: "center",
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 10,
  },
  removeImageButton: {
    marginTop: 5,
    backgroundColor: "#ff4d4d",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  removeImageText: {
    color: "#fff",
    fontWeight: "bold",
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
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
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
    maxHeight: Dimensions.get('window').height * 0.8,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalCard: {
    width: Dimensions.get('window').width * 0.9 - 40, // Ajuste para el Card dentro del modal
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
});
