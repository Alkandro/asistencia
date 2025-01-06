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
  Image,
  TouchableWithoutFeedback, // Importado
  Modal, // Importado
  FlatList, // Importado
  Dimensions, // Importado
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

const CheckInScreen = () => {
  const [monthlyCheckIns, setMonthlyCheckIns] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [latestMessage, setLatestMessage] = useState(null); // Estado para guardar el último mensaje
  const [isModalVisible, setIsModalVisible] = useState(false); // Estado para el modal

  const navigation = useNavigation();

  // Obtener dimensiones de la ventana
  const windowWidth = Dimensions.get('window').width;
  const modalWidth = windowWidth * 0.9; // 90% del ancho de la pantalla
  const modalImageWidth = modalWidth - 40; // Ajustar según el padding del modal

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

  // 6) Renderizar cada imagen en el FlatList del modal
  const renderModalImage = ({ item }) => (
    <View style={styles.modalImageContainer}>
      <Image
        source={{ uri: item }}
        style={[styles.modalImage, { width: modalImageWidth }]}
        resizeMode="cover"
      />
    </View>
  );

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

              {/* Verificar si existe imageUrls y mostrar las imágenes */}
              {latestMessage.imageUrls && latestMessage.imageUrls.length > 0 ? (
                <FlatList
                  data={latestMessage.imageUrls}
                  keyExtractor={(item, index) => index.toString()}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  renderItem={renderModalImage}
                />
              ) : latestMessage.imageUrl ? (
                <TouchableOpacity onPress={() => setIsModalVisible(true)}>
                  <Image
                    source={{ uri: latestMessage.imageUrl }}
                    style={styles.messageImage}
                    resizeMode="cover"
                    onError={(error) => {
                      console.error("Error al cargar la imagen:", error.nativeEvent.error);
                      Alert.alert(
                        "Error",
                        "No se pudo cargar la imagen del último mensaje."
                      );
                    }}
                  />
                </TouchableOpacity>
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

      {/* Modal para swipe horizontal de imágenes */}
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
                <FlatList
                  data={latestMessage?.imageUrls || []}
                  keyExtractor={(item, index) => index.toString()}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  renderItem={renderModalImage}
                />
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
  // Estilo para la imagen del mensaje
  messageImage: {
    width: 200,
    height: 200,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
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
  modalImageContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: Dimensions.get('window').width * 0.9, // Igual al ancho del modal
  },
  modalImage: {
    height: 200, // Reducir la altura para que las imágenes no sean tan grandes
    marginBottom: 20,
    borderRadius: 10,
  },
  closeButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 150,
    height: 40,
    backgroundColor: "#ff5c5c",
    borderRadius: 20,
  },
});
