import React, { useEffect, useState } from "react";
import { View, Text, Button, Alert, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { recordCheckIn } from "./Attendance";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from './firebase';
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

        querySnapshot.forEach((doc) => {
          const data = doc.data();
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

  useEffect(() => {
    fetchMonthlyCheckIns();
  }, []);

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

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      
    } catch (error) {
      Alert.alert("Error", `No se pudo cerrar la sesión: ${error.message}`);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMonthlyCheckIns(); // Refresca los datos
    setRefreshing(false);
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer} // Aplicar estilos aquí
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Menu</Text>
      <Text style={styles.counter}>Check-ins este mes: {monthlyCheckIns}</Text>
      <View>
        <Button title="Check-in" onPress={handleCheckIn} />
        <Button title="Cerrar Sesión" onPress={handleSignOut} />
      </View>
    </ScrollView>
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
});

export default CheckInScreen;
