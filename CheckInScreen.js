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
  Image, // Importar el componente Image
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

  const navigation = useNavigation();

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
              {/* Verificar si existe imageUrl y mostrar la imagen */}
              {latestMessage.imageUrl ? (
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
    </SafeAreaView>
  );
};

export default CheckInScreen;

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20,
    paddingHorizontal: 16, // Añadido para mejor espaciamiento
  },
  // Contenedor del mensaje y la imagen
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
});
