import React, { useState, useEffect } from "react";
import { 
  SafeAreaView, 
  StyleSheet, 
  Modal, 
  View, 
  Text, 
  ScrollView, 
  Button, 
  TouchableOpacity, 
  Alert 
} from "react-native";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { SwipeListView } from "react-native-swipe-list-view";
import { Card, Paragraph, Checkbox } from "react-native-paper";
import { format } from "date-fns";

export default function MessagePreviewScreen() {
  const [messages, setMessages] = useState([]);
  const [previewMessage, setPreviewMessage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState({});

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((docSnap) => msgs.push({ id: docSnap.id, ...docSnap.data() }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return format(date, "dd/MM/yyyy HH:mm");
  };

  const handleDeleteSelected = async () => {
    const messageIds = Object.keys(selectedMessages).filter((id) => selectedMessages[id]);
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

  const toggleSelectMessage = (messageId) => {
    setSelectedMessages((prevState) => ({
      ...prevState,
      [messageId]: !prevState[messageId],
    }));
  };

  const renderItem = ({ item }) => (
    <View style={styles.rowFront}>
      <Card style={styles.card}>
      <Card.Title
  title={`Publicado el ${formatDate(item.createdAt)}`}
  right={() => (
    <View style={styles.checkboxWrapper}>
      <Checkbox
        status={selectedMessages[item.id] ? "checked" : "unchecked"}
        onPress={() => toggleSelectMessage(item.id)}
        color="blue" // Color de la bolita cuando está marcado
        uncheckedColor="#CDC1FF" // Color del borde del checkbox cuando está desmarcado
      />
    </View>
  )}
/>

        <Card.Content>
          <Paragraph numberOfLines={2}>{item.text}</Paragraph>
          {item.additionalField1 && (
            <Paragraph>Campo Adicional 1: {item.additionalField1}</Paragraph>
          )}
          {item.additionalField2 && (
            <Paragraph>Campo Adicional 2: {item.additionalField2}</Paragraph>
          )}
          {item.additionalField3 && (
            <Paragraph>Campo Adicional 3: {item.additionalField3}</Paragraph>
          )}
        </Card.Content>
        {item.imageUrl && (
          <Card.Cover source={{ uri: item.imageUrl }} style={styles.cardImage} />
        )}
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SwipeListView
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />

      <Button 
        title="Eliminar Seleccionados" 
        onPress={handleDeleteSelected} 
        color="red" 
      />

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {previewMessage && (
              <Card style={styles.modalCard}>
                {previewMessage.imageUrl && (
                  <Card.Cover source={{ uri: previewMessage.imageUrl }} style={styles.modalImage} />
                )}
                <Card.Title
                  title={`Publicado el ${formatDate(previewMessage.createdAt)}`}
                />
                <Card.Content>
                  <Paragraph style={styles.modalText}>
                    {previewMessage.text}
                  </Paragraph>
                  {previewMessage.additionalField1 && (
                    <Paragraph>Campo Adicional 1: {previewMessage.additionalField1}</Paragraph>
                  )}
                  {previewMessage.additionalField2 && (
                    <Paragraph>Campo Adicional 2: {previewMessage.additionalField2}</Paragraph>
                  )}
                  {previewMessage.additionalField3 && (
                    <Paragraph>Campo Adicional 3: {previewMessage.additionalField3}</Paragraph>
                  )}
                </Card.Content>
              </Card>
            )}
            <Button title="Cerrar" onPress={() => setIsModalVisible(false)} />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  checkboxWrapper: {
    backgroundColor: "#CDC1FF", // Fondo tenue para el checkbox cuando está desmarcado
    borderRadius: 50, // Bordes redondeados para que el fondo sea circular
    padding: 5, // Espaciado interno para que el checkbox no toque los bordes
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10, // Espaciado del checkbox respecto al texto
  },
  
  rowFront: { 
    padding: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: "#ccc" 
  },
  card: {
    margin: 10,
    borderRadius: 10,
    overflow: "hidden",
  },
  cardImage: {
    height: 200,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
  },
  modalCard: {
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
  modalImage: {
    height: 300,
  },
  modalText: {
    fontSize: 16,
    marginTop: 10,
  },
});
