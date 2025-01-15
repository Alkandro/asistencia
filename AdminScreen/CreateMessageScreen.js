import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableOpacity,
  Dimensions,
  Keyboard,
  ScrollView,
  StyleSheet,
  Button,
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
  updateDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, auth, storage } from "../firebase";
import { SwipeListView } from "react-native-swipe-list-view";
import { format } from "date-fns";
import { Card, Paragraph } from "react-native-paper";

// Importamos el formulario que creamos en components/MessageForm.js
import MessageForm from "./MessageForm";

export default function CreateMessageScreen() {
  // Estados para el formulario y mensajes
  const [message, setMessage] = useState("");
  const [additionalField1, setAdditionalField1] = useState("");
  const [additionalField2, setAdditionalField2] = useState("");
  const [additionalField3, setAdditionalField3] = useState("");
  const [localImageUri, setLocalImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [previewMessage, setPreviewMessage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);

  // Ref para el TextInput del formulario
  const textInputRef = useRef(null);

  // Solicitar permisos de la galería
  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permisos insuficientes",
          "Necesitamos permisos para acceder a tu galería."
        );
      }
    })();
  }, []);

  // Suscribirse a la colección de mensajes
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const msgs = [];
        querySnapshot.forEach((docSnap) => {
          msgs.push({ id: docSnap.id, ...docSnap.data() });
        });
        setMessages(msgs);
      },
      (error) => {
        console.error("Error al obtener los mensajes: ", error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Funciones de la pantalla
  const handleChooseImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.7,
      });
      if (!result.canceled) {
        const selectedAsset = result.assets[0];
        setLocalImageUri(selectedAsset.uri);
      } else {
        console.log("Selección de imagen cancelada.");
      }
    } catch (error) {
      console.error("Error al elegir la imagen:", error);
      Alert.alert("Error", "No se pudo elegir la imagen.");
    }
  };

  const uploadImageToStorage = async (uri) => {
    try {
      if (!uri) return null;
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "Debes iniciar sesión para subir imagen.");
        return null;
      }
      const imageName = `images/${user.uid}/${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.jpg`;
      const imageRef = ref(storage, imageName);

      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = (e) => {
          console.error("Blob error:", e);
          reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
      });

      const uploadTask = uploadBytesResumable(imageRef, blob);

      return await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Subiendo imagen: ${progress.toFixed(2)}%`);
          },
          (error) => {
            console.error("Error en la subida de imagen:", error);
            Alert.alert("Error", "No se pudo subir la imagen.");
            setUploading(false);
            reject(error);
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              console.log("URL imagen subida:", downloadUrl);
              resolve(downloadUrl);
            } catch (error) {
              console.error("Error al obtener URL de descarga:", error);
              Alert.alert("Error", "No se pudo obtener la URL de la imagen.");
              setUploading(false);
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error("uploadImageToStorage error:", error);
      Alert.alert("Error", "No se pudo subir la imagen.");
      setUploading(false);
      return null;
    }
  };

  const handleSaveMessage = async () => {
    if (message.trim().length === 0) {
      Alert.alert("Error", "Por favor escribe un mensaje.");
      return;
    }
    try {
      let imageUrl = localImageUri;
      if (
        localImageUri &&
        (editingMessage ? localImageUri !== editingMessage.imageUrl : true)
      ) {
        setUploading(true);
        const uploadedImageUrl = await uploadImageToStorage(localImageUri);
        setUploading(false);
        if (!uploadedImageUrl) return;
        imageUrl = uploadedImageUrl;

        if (
          editingMessage &&
          editingMessage.imageUrl &&
          editingMessage.imageUrl !== uploadedImageUrl
        ) {
          const oldImageRef = ref(storage, editingMessage.imageUrl);
          await deleteObject(oldImageRef);
          console.log("Imagen anterior eliminada.");
        }
      }
      const user = auth.currentUser;
      if (editingMessage) {
        const messageRef = doc(db, "messages", editingMessage.id);
        await updateDoc(messageRef, {
          text: message.trim(),
          additionalField1: additionalField1.trim(),
          additionalField2: additionalField2.trim(),
          additionalField3: additionalField3.trim(),
          imageUrl,
          updatedAt: serverTimestamp(),
        });
        Alert.alert("Éxito", "Mensaje actualizado correctamente.");
      } else {
        await addDoc(collection(db, "messages"), {
          text: message.trim(),
          additionalField1: additionalField1.trim(),
          additionalField2: additionalField2.trim(),
          additionalField3: additionalField3.trim(),
          createdAt: serverTimestamp(),
          authorId: user ? user.uid : null,
          imageUrl,
        });
        Alert.alert("Éxito", "Mensaje guardado correctamente.");
      }
      // Antes de limpiar, desenfoca el TextInput y oculta el teclado
      if (textInputRef.current) {
        textInputRef.current.blur();
      }
      Keyboard.dismiss();
      handleCancelEdit();
    } catch (error) {
      console.error("Error al guardar mensaje:", error);
      Alert.alert("Error", "No se pudo guardar el mensaje.");
    }
  };

  const handleDeleteMessage = async (messageId, imageUrl) => {
    try {
      await deleteDoc(doc(db, "messages", messageId));
      console.log("Mensaje eliminado de Firestore.");
      if (imageUrl) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
        console.log("Imagen eliminada de Storage.");
      }
      Alert.alert("Éxito", "Mensaje eliminado correctamente.");
    } catch (error) {
      console.error("Error al eliminar:", error);
      Alert.alert("Error", "No se pudo eliminar.");
    }
  };

  const handlePreviewMessage = (messageItem) => {
    setPreviewMessage(messageItem);
    setIsModalVisible(true);
  };

  const handleEditMessage = (messageItem) => {
    setEditingMessage(messageItem);
    setMessage(messageItem.text);
    setAdditionalField1(messageItem.additionalField1 || "");
    setAdditionalField2(messageItem.additionalField2 || "");
    setAdditionalField3(messageItem.additionalField3 || "");
    setLocalImageUri(messageItem.imageUrl || null);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setMessage("");
    setAdditionalField1("");
    setAdditionalField2("");
    setAdditionalField3("");
    setLocalImageUri(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return format(date, "dd/MM/yyyy HH:mm");
  };

  const renderItem = useCallback(
    (data) => (
      <TouchableOpacity
        style={styles.rowFront}
        onPress={() => handlePreviewMessage(data.item)}
      >
        <Card style={styles.card}>
          <Card.Title
            title={`Publicado el ${formatDate(data.item.createdAt)}`}
            right={() => (
              <Button
                title="Editar"
                onPress={() => handleEditMessage(data.item)}
              />
            )}
          />
          <Card.Content>
            <Paragraph>{data.item.text}</Paragraph>
            {(data.item.additionalField1 ||
              data.item.additionalField2 ||
              data.item.additionalField3) && (
              <>
                {data.item.additionalField1 && (
                  <Paragraph>
                    Campo Adicional 1: {data.item.additionalField1}
                  </Paragraph>
                )}
                {data.item.additionalField2 && (
                  <Paragraph>
                    Campo Adicional 2: {data.item.additionalField2}
                  </Paragraph>
                )}
                {data.item.additionalField3 && (
                  <Paragraph>
                    Campo Adicional 3: {data.item.additionalField3}
                  </Paragraph>
                )}
              </>
            )}
          </Card.Content>
          {data.item.imageUrl && (
            <Card.Cover source={{ uri: data.item.imageUrl }} />
          )}
        </Card>
      </TouchableOpacity>
    ),
    []
  );

  const renderHiddenItem = useCallback(
    (data) => (
      <View style={styles.rowBack}>
        <TouchableOpacity
          style={[styles.backRightBtn, styles.backRightBtnRight]}
          onPress={() => handleDeleteMessage(data.item.id, data.item.imageUrl)}
        >
          <Text style={styles.backTextWhite}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.select({ ios: 80, android: 0 })}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="always"
        >
          <MessageForm
            ref={textInputRef}
            message={message}
            setMessage={setMessage}
            additionalField1={additionalField1}
            setAdditionalField1={setAdditionalField1}
            additionalField2={additionalField2}
            setAdditionalField2={setAdditionalField2}
            additionalField3={additionalField3}
            setAdditionalField3={setAdditionalField3}
            localImageUri={localImageUri}
            setLocalImageUri={setLocalImageUri}
            uploading={uploading}
            handleChooseImage={handleChooseImage}
            handleSaveMessage={handleSaveMessage}
            editingMessage={editingMessage}
            handleCancelEdit={handleCancelEdit}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <SwipeListView
        data={messages}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-75}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <ScrollView>
              {previewMessage && (
                <>
                  <Text style={styles.modalDate}>
                    {formatDate(previewMessage.createdAt)}
                  </Text>
                  <Text style={styles.modalText}>{previewMessage.text}</Text>
                  {previewMessage.imageUrl && (
                    <Card style={styles.modalCard}>
                      <Card.Cover source={{ uri: previewMessage.imageUrl }} />
                      <Card.Title
                        title={`Publicado el ${formatDate(
                          previewMessage.createdAt
                        )}`}
                      />
                      <Card.Content>
                        <Paragraph>{previewMessage.text}</Paragraph>
                        {(previewMessage.additionalField1 ||
                          previewMessage.additionalField2 ||
                          previewMessage.additionalField3) && (
                          <>
                            {previewMessage.additionalField1 && (
                              <Paragraph>
                                Campo Adicional 1: {previewMessage.additionalField1}
                              </Paragraph>
                            )}
                            {previewMessage.additionalField2 && (
                              <Paragraph>
                                Campo Adicional 2: {previewMessage.additionalField2}
                              </Paragraph>
                            )}
                            {previewMessage.additionalField3 && (
                              <Paragraph>
                                Campo Adicional 3: {previewMessage.additionalField3}
                              </Paragraph>
                            )}
                          </>
                        )}
                      </Card.Content>
                    </Card>
                  )}
                </>
              )}
              <Button title="Cerrar" onPress={() => setIsModalVisible(false)} />
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  formWrapper: {
    backgroundColor: "#f9f9f9",
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
    justifyContent: "center",
    width: 75,
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  backRightBtnRight: {
    backgroundColor: "red",
    right: 0,
  },
  backTextWhite: {
    color: "#FFF",
  },
  card: {
    borderRadius: 10,
    overflow: "hidden",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  modalContent: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    maxHeight: "80%",
  },
  modalDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
    color: "#333",
  },
  modalCard: {
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
});
