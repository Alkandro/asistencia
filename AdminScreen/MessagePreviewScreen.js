import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Modal,
  View,
  Button,
  Alert,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Headline,
  Paragraph,
  Checkbox,
  IconButton,
  Card,
  TextInput,
} from "react-native-paper";
import { format } from "date-fns";

export default function MessagePreviewScreen() {
  const [messages, setMessages] = useState([]);
  const [previewMessage, setPreviewMessage] = useState(null);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState({});
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editValues, setEditValues] = useState({
    text: "",
    additionalField1: "",
    additionalField2: "",
    additionalField3: "",
  });

  // Cargar mensajes de Firestore
  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((docSnap) =>
        msgs.push({ id: docSnap.id, ...docSnap.data() })
      );
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, []);

  // Función para formatear la fecha
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return format(date, "dd/MM/yyyy HH:mm");
  };

  // Alternar selección de mensaje (para borrar)
  const toggleSelectMessage = (messageId) => {
    setSelectedMessages((prevState) => ({
      ...prevState,
      [messageId]: !prevState[messageId],
    }));
  };

  // Función para borrar mensajes seleccionados
  const handleDeleteSelected = async () => {
    const messageIds = Object.keys(selectedMessages).filter(
      (id) => selectedMessages[id]
    );
    if (messageIds.length === 0) {
      Alert.alert("Error", "No has seleccionado ningún mensaje.");
      return;
    }
    Alert.alert(
      "Confirmar Eliminación",
      `¿Estás seguro de que deseas eliminar ${messageIds.length} mensaje(s)?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await Promise.all(
                messageIds.map(async (id) => {
                  const messageRef = doc(db, "messages", id);
                  await deleteDoc(messageRef);
                })
              );
              Alert.alert("Éxito", "Mensajes eliminados correctamente.");
              setSelectedMessages({});
            } catch (error) {
              console.error("Error al eliminar mensajes:", error);
              Alert.alert("Error", "No se pudieron eliminar los mensajes.");
            }
          },
        },
      ]
    );
  };

  // Función que abre el modal de previsualización
  const openPreviewModal = (message) => {
    setPreviewMessage(message);
    setIsPreviewModalVisible(true);
  };

  // Cuando se pulsa el ícono de editar en el modal de previsualización,
  // precargamos los datos y abrimos el modal de edición.
  const handleEditMessage = (message) => {
    setEditValues({
      text: message.text,
      additionalField1: message.additionalField1 || "",
      additionalField2: message.additionalField2 || "",
      additionalField3: message.additionalField3 || "",
    });
    // Puedes mantener la previsualización abierta o cerrarla. En este ejemplo, la cerramos.
    setIsPreviewModalVisible(false);
    setIsEditModalVisible(true);
  };

  // Función para guardar la edición
  const handleSaveEdit = async () => {
    try {
      const messageRef = doc(db, "messages", previewMessage.id);
      await updateDoc(messageRef, {
        text: editValues.text,
        additionalField1: editValues.additionalField1,
        additionalField2: editValues.additionalField2,
        additionalField3: editValues.additionalField3,
        updatedAt: serverTimestamp(),
      });
      Alert.alert("Éxito", "Mensaje actualizado correctamente.");
      setIsEditModalVisible(false);
    } catch (error) {
      console.error("Error al actualizar mensaje:", error);
      Alert.alert("Error", "No se pudo actualizar el mensaje.");
    }
  };

  // Renderizar cada mensaje en la lista
  const renderMessageItem = (item) => (
    <TouchableOpacity
      onPress={() => openPreviewModal(item)}
      style={styles.listItem}
    >
      <View style={styles.listContent}>
        {/* Imagen a la izquierda */}
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        {/* Contenido central */}
        <View style={styles.textContainer}>
          <Paragraph style={styles.dateText}>
            {formatDate(item.createdAt)}
          </Paragraph>
         {item.text && <Paragraph>{item.text}</Paragraph>}
          {item.additionalField1 && <Paragraph>{item.additionalField1}</Paragraph>}
          {item.additionalField2 && <Paragraph>{item.additionalField2}</Paragraph>}
          {item.additionalField3 && <Paragraph>{item.additionalField3}</Paragraph>}
        </View>

        {/* Checkbox a la derecha */}
        <View style={styles.checkboxContainer}>
          <Checkbox
            status={selectedMessages[item.id] ? "checked" : "unchecked"}
            onPress={() => toggleSelectMessage(item.id)}
            color="blue"
            uncheckedColor="#CDC1FF"
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {messages.map((message) => (
          <View key={message.id} style={styles.messageContainer}>
            {renderMessageItem(message)}
          </View>
        ))}
      </ScrollView>

      <Button
        title="Eliminar Seleccionados"
        onPress={handleDeleteSelected}
        color="red"
      />

      {/* Modal de Previsualización */}
      <Modal
        visible={isPreviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPreviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {previewMessage && (
              <Card style={styles.modalCard} mode="elevated">
                {previewMessage.imageUrl && (
                  <Card.Cover
                    source={{ uri: previewMessage.imageUrl }}
                    style={styles.modalImage}
                  />
                )}
                {/* Título con fecha y botón de edición */}
                <View style={styles.titleWithEdit}>
                  <Paragraph style={styles.dateText}>
                    {`Publicado el ${formatDate(previewMessage.createdAt)}`}
                  </Paragraph>
                  <IconButton
                    icon="pencil"
                    size={24}
                    onPress={() => handleEditMessage(previewMessage)}
                    iconColor="#4CAF50"
                  />
                </View>
                <Card.Content>
                  <Paragraph >
                   Portugues: {previewMessage.text}
                  </Paragraph>
                  {previewMessage.additionalField1 && (
                    <Paragraph>
                    Japones : {previewMessage.additionalField1}
                    </Paragraph>
                  )}
                  {previewMessage.additionalField2 && (
                    <Paragraph>
                      Ingles: {previewMessage.additionalField2}
                    </Paragraph>
                  )}
                  {previewMessage.additionalField3 && (
                    <Paragraph>
                      Español: {previewMessage.additionalField3}
                    </Paragraph>
                  )}
                </Card.Content>
              </Card>
            )}
            <Button title="Cerrar" onPress={() => setIsPreviewModalVisible(false)} />
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de Edición */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Card style={styles.modalCard} mode="elevated">
              <Card.Title title="Editar Mensaje" />
              <Card.Content>
                <TextInput
                  label="Mensaje"
                  value={editValues.text}
                  onChangeText={(val) =>
                    setEditValues({ ...editValues, text: val })
                  }
                  style={styles.input}
                />
                <TextInput
                  label="Campo Adicional 1"
                  value={editValues.additionalField1}
                  onChangeText={(val) =>
                    setEditValues({ ...editValues, additionalField1: val })
                  }
                  style={styles.input}
                />
                <TextInput
                  label="Campo Adicional 2"
                  value={editValues.additionalField2}
                  onChangeText={(val) =>
                    setEditValues({ ...editValues, additionalField2: val })
                  }
                  style={styles.input}
                />
                <TextInput
                  label="Campo Adicional 3"
                  value={editValues.additionalField3}
                  onChangeText={(val) =>
                    setEditValues({ ...editValues, additionalField3: val })
                  }
                  style={styles.input}
                />
              </Card.Content>
              <Card.Actions style={styles.editActions}>
  <IconButton
    icon="content-save"
    size={28}
    onPress={handleSaveEdit}
    iconColor="#4CAF50"
    style={styles.actionButton}
  />
  <IconButton
    icon="close"
    size={28}
    onPress={() => setIsEditModalVisible(false)}
    iconColor="#F44336"
    style={styles.actionButton}
  />
</Card.Actions>
            </Card>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  messageContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  listItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  listContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  imageContainer: {
    marginRight: 10,
    alignItems: "center",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ddd",
    
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
    
  },
  dateText: {
    fontSize: 12,
    color: "#888",
    marginBottom: 5,
  },
  checkboxContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
    
  },
  modalContent: {
    marginHorizontal:"auto",
    marginVertical:"auto",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    width: "85%",
    maxWidth: 355,
    alignSelf: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  modalCard: {
    borderRadius: 10,
    overflow: "hidden",
  },
  modalImage: {
    height: 280,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  titleWithEdit: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 10,
  },
  
  input: {
    marginVertical: 10,
    backgroundColor: "white",
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginLeft:-30,
    marginTop: 20,
  },
  actionButton: {
    marginHorizontal: 45, // Ajusta este valor según el espacio que desees
    marginVertical:10,
    
  },
});
