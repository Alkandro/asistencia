// MessageListScreen.js
import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

export default function MessageListScreen() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, orderBy("createdAt", "desc"));

    // Suscripción en tiempo real a Firestore
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages = [];
      snapshot.forEach((docSnap) => {
        loadedMessages.push({ id: docSnap.id, ...docSnap.data() });
      });
      setMessages(loadedMessages);
      setLoading(false);
    });

    // Cancela la suscripción al desmontar
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (messages.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No hay mensajes todavía.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.messageItem}>
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.messageDate}>
              {item.createdAt ? item.createdAt.toDate().toLocaleString() : ""}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  messageItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  messageDate: {
    fontSize: 12,
    color: "#888",
  },
});
