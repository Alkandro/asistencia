// CheckInScreen.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Alert,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  TouchableWithoutFeedback,
  Modal,
  Dimensions,
} from "react-native";
import { recordCheckIn } from "./Attendance";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { auth, db } from "./firebase";
import ButtonGradient from "./ButtonGradient";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import dayjs from "dayjs";
import { Card, Paragraph } from 'react-native-paper'; // Importa Paragraph

const CheckInScreen = () => {
  const [monthlyCheckIns, setMonthlyCheckIns] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [latestMessage, setLatestMessage] = useState(null); // Estado para guardar el último mensaje
  const [isModalVisible, setIsModalVisible] = useState(false); // Estado para el modal

  const navigation = useNavigation();

  // Obtener dimensiones de la ventana
  const windowWidth = Dimensions.get('window').width;
  const cardWidth = windowWidth * 0.95; // 95% del ancho de la pantalla
  const modalCardWidth = windowWidth * 0.9; // 90% del ancho de la pantalla para el modal

  // 1) Suscribirnos a la colección "messages" para obtener el último mensaje
  useEffect(() => {
    const messagesRef = collection(db, "messages");
    // Ordena por createdAt descendente y toma 1 (el último mensaje creado)
    const q = query(messagesRef, orderBy("createdAt", "desc"), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setLatestMessage(docSnap.data());
      } else {
        // No hay mensajes todavía
        setLatestMessage(null);
      }
    });

    return () => unsubscribe(); // Cancela suscripción al desmontar
  }, []);

  // 2) Lógica para obtener cuántos check-ins hay este mes
  const fetchMonthlyCheckIns = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const q = query(
          collection(db, "attendanceHistory"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const currentMonthKey = dayjs().format("YYYY-MM");
        let count = 0;

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const timestamp = data.timestamp?.seconds
            ? new Date(data.timestamp.seconds * 1000)
            : null;
          if (
            timestamp &&
            dayjs(timestamp).format("YYYY-MM") === currentMonthKey
          ) {
            count++;
          }
        });

        setMonthlyCheckIns(count);
      }
    } catch (error) {
      console.error("Error al obtener los check-ins mensuales:", error);
    }
  };

  // Se ejecuta una sola vez al montar la pantalla
  useEffect(() => {
    fetchMonthlyCheckIns();
  }, []);

  // useFocusEffect se ejecuta cada vez que la pantalla gana el foco.
  useFocusEffect(
    useCallback(() => {
      fetchMonthlyCheckIns();
    }, [])
  );

  // 3) Manejo del botón de Check-In
  const handleCheckIn = async () => {
    if (auth.currentUser) {
      const monthKey = dayjs().format("YYYY-MM");
      const userDocRef = doc(db, "users", auth.currentUser.uid);

      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userName = userData.username || "Usuario";
          const userBelt = userData.cinturon || "desconocida";

          await recordCheckIn();
          await updateDoc(userDocRef, {
            [`checkIns_${monthKey}`]: increment(1),
          });

          const newCheckInCount = monthlyCheckIns + 1;
          setMonthlyCheckIns(newCheckInCount);

          Alert.alert(
            "",
            `Bienvenido al entrenamiento de hoy, ${userName}!\n
            Practica mucho para mejorar tus técnicas en tu cinturón color ${userBelt}.\n
            Check-ins este mes: ${newCheckInCount}`,
            [
              {
                text: "OK",
                onPress: () => fetchMonthlyCheckIns(), // Refresca el contador al presionar OK
              },
            ]
          );

          navigation.navigate("Historial");
        }
      } catch (error) {
        Alert.alert(
          "Error",
          `No se pudo registrar el check-in: ${error.message}`
        );
      }
    }
  };

  // 4) Refresh para actualizar los datos
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMonthlyCheckIns();
    setRefreshing(false);
  };

  // 5) Calcular la suma de los dos campos adicionales
  const calculateSum = () => {
    if (
      latestMessage &&
      latestMessage.additionalField1 &&
      latestMessage.additionalField2
    ) {
      const field1 = parseFloat(latestMessage.additionalField1);
      const field2 = parseFloat(latestMessage.additionalField2);
      if (!isNaN(field1) && !isNaN(field2)) {
        return field1 + field2;
      }
    }
    return null;
  };

  // 6) Función para formatear la fecha
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return dayjs(date).format('DD/MM/YYYY HH:mm');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* 5) Muestra el último mensaje arriba de "Menu" */}
          {latestMessage ? (
            <View style={styles.messageContainer}>
              <Text style={styles.latestMessage}>
                Último mensaje: {latestMessage.text}
              </Text>
              
              {/* Mostrar campos adicionales si existen */}
              {latestMessage.additionalField1 && latestMessage.additionalField2 ? (
                <View style={styles.additionalFieldsContainer}>
                  <Text style={styles.additionalField}>
                    Campo Adicional 1: {latestMessage.additionalField1}
                  </Text>
                  <Text style={styles.additionalField}>
                    Campo Adicional 2: {latestMessage.additionalField2}
                  </Text>
                  <Text style={styles.sumText}>
                    Suma de campos adicionales: {calculateSum()}
                  </Text>
                </View>
              ) : null }

              {/* Verificar si existe imageUrl y mostrar la imagen usando Card */}
              {latestMessage.imageUrl ? (
                <TouchableWithoutFeedback onPress={() => setIsModalVisible(true)}>
                  <Card style={styles.card}>
                    <Card.Cover source={{ uri: latestMessage.imageUrl }} />
                  </Card>
                </TouchableWithoutFeedback>
              ) : null}
            </View>
          ) : (
            <Text style={styles.latestMessage}>No hay mensajes aún</Text>
          )}

          <Text style={styles.title}>Menu</Text>
          <Text style={styles.counter}>
            Este mes has entrenado: {monthlyCheckIns} veces
          </Text>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <ButtonGradient
            onPress={handleCheckIn}
            title="REGISTRO"
            style={styles.button}
          />
        </View>
      </View>

      {/* Modal para mostrar la imagen con título y contenido */}
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
                {/* Mostrar la imagen y detalles si existe latestMessage */}
                {latestMessage?.imageUrl && (
                  <Card style={styles.modalCard}>
                    <Card.Cover source={{ uri: latestMessage.imageUrl }} />
                    <Card.Title title="Detalles del Mensaje" subtitle={`Publicado el ${formatDate(latestMessage.createdAt)}`} />
                    <Card.Content>
                      <Paragraph>{latestMessage.text}</Paragraph>
                      {/* Mostrar campos adicionales si existen */}
                      {latestMessage.additionalField1 && latestMessage.additionalField2 ? (
                        <>
                          <Paragraph>Campo Adicional 1: {latestMessage.additionalField1}</Paragraph>
                          <Paragraph>Campo Adicional 2: {latestMessage.additionalField2}</Paragraph>
                          <Paragraph>Suma de campos adicionales: {calculateSum()}</Paragraph>
                        </>
                      ) : null}
                    </Card.Content>
                  </Card>
                )}
                <ButtonGradient
                  onPress={() => setIsModalVisible(false)}
                  title="Cerrar"
                  style={styles.closeButton}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default CheckInScreen;

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20,
    paddingHorizontal: 16, // Añadido para mejor espaciamiento
  },
  // Contenedor del mensaje y las imágenes
  messageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  // Texto del último mensaje
  latestMessage: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
    color: "black",
    textAlign: "center",
  },
  // Contenedor para los campos adicionales
  additionalFieldsContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  // Texto de los campos adicionales
  additionalField: {
    fontSize: 14,
    color: "#333",
    marginVertical: 2,
    textAlign: "center",
  },
  // Texto de la suma de campos adicionales
  sumText: {
    fontSize: 16,
    marginTop: 5,
    color: "#333",
    textAlign: "center",
    fontWeight: "600",
  },
  // Estilo para el Card del mensaje en la vista principal
  card: {
    width:Dimensions.get('window').width * 0.95, // Puedes ajustar este valor o usar cardWidth
    height: 200, // Ajusta la altura según sea necesario
    borderRadius: 10,
    overflow: 'hidden', // Asegura que la imagen respete el borderRadius
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  // Estilo para el Card dentro del modal
  modalCard: {
    width: Dimensions.get('window').width * 0.9 - 40, // Asegura que la imagen ocupe el ancho disponible en el modal
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontStyle: "italic",
    marginBottom: 20,
    textAlign: "center",
  },
  counter: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  buttonContainer: {
    height: 80,
    justifyContent: "center", // Centrar verticalmente el botón
    alignItems: "center", // Centrar horizontalmente el botón
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    width: 270,
    height: 50,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: Dimensions.get('window').width * 0.9,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 150,
    height: 40,
    backgroundColor: "#ff5c5c",
    borderRadius: 20,
    marginTop: 10, // Añadido para separar del Card
  },
});
