import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Alert, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { recordCheckIn } from "./Attendance";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { auth, db } from './firebase';
import ButtonGradient from "./ButtonGradient";
import { doc, getDoc, updateDoc, increment, collection, query, where, getDocs } from "firebase/firestore";
import dayjs from 'dayjs';

const CheckInScreen = () => {
  const [monthlyCheckIns, setMonthlyCheckIns] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchMonthlyCheckIns = async () => {
    try {
      const user = auth.currentUser;

      if (user) {
        const q = query(
          collection(db, 'attendanceHistory'),
          where('userId', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        const currentMonthKey = dayjs().format('YYYY-MM');
        let count = 0;

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const timestamp = data.timestamp?.seconds ? new Date(data.timestamp.seconds * 1000) : null;
          if (timestamp && dayjs(timestamp).format('YYYY-MM') === currentMonthKey) {
            count++;
          }
        });

        setMonthlyCheckIns(count);
      }
    } catch (error) {
      console.error("Error al obtener los check-ins mensuales:", error);
    }
  };

  // Este useEffect se ejecuta una sola vez al montar la pantalla
  useEffect(() => {
    fetchMonthlyCheckIns();
  }, []);

  // useFocusEffect se ejecuta cada vez que la pantalla gana el foco.
  useFocusEffect(
    useCallback(() => {
      fetchMonthlyCheckIns();
    }, [])
  );

  const handleCheckIn = async () => {
    if (auth.currentUser) {
      const monthKey = dayjs().format('YYYY-MM');
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      
      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userName = userData.username || "Usuario";
          const userBelt = userData.cinturon || "desconocida";

          await recordCheckIn();
          await updateDoc(userDocRef, {
            [`checkIns_${monthKey}`]: increment(1)
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
                onPress: () => fetchMonthlyCheckIns() // Refresca el contador al presionar OK
              }
            ]
          );

          navigation.navigate("AttendanceHistory");
        }
      } catch (error) {
        Alert.alert("Error", `No se pudo registrar el check-in: ${error.message}`);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMonthlyCheckIns(); // Refresca los datos
    setRefreshing(false);
  };

  return (
    <View style={styles.container} >
    <ScrollView 
      style={{flex:1}} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Menu</Text>
      <Text style={styles.counter}>Este mes has entrenado : {monthlyCheckIns} veces</Text>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <ButtonGradient
          onPress={handleCheckIn}
          title="REGISTRO"
          style={styles.button}
        />
      </View>
    
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20, // Agrega espacio en la parte inferior si es necesario
  },
  title: {
    fontSize: 20,
    fontStyle: "italic",
    marginBottom: 20,
  },
  counter: {
    fontSize: 16,
    marginBottom: 10,
  },
  buttonContainer: {
    height: 80,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: "auto",
    marginVertical: "auto",
    width: 270,    // Ajusta el ancho
    height: 50,    // Ajusta la altura
    
  },
});

export default CheckInScreen;
