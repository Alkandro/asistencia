import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ActivityIndicator, FlatList, RefreshControl, StyleSheet,Animated, } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';

const AttendanceHistoryScreen = () => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monthlyCheckInCount, setMonthlyCheckInCount] = useState({});

  // Valor animado para el parpadeo
  const fadeAnim = useRef(new Animated.Value(1)).current; 

  // Función para obtener el historial de asistencia y contar los check-ins por mes
  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;

      if (user) {
        const q = query(
          collection(db, 'attendanceHistory'),
          where('userId', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        const history = [];
        const monthlyCounts = {}; // Objeto para almacenar los conteos mensuales

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const timestamp = data.timestamp?.seconds ? new Date(data.timestamp.seconds * 1000) : null;
          
          if (timestamp) {
            const monthKey = dayjs(timestamp).format('YYYY-MM'); // Formato para cada mes

            // Si el mes ya existe, incrementa el contador, si no, inicialízalo en 1
            monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
          }

          history.push({ id: doc.id, ...data });
        });

        setAttendanceHistory(history);
        setMonthlyCheckInCount(monthlyCounts); // Guarda los conteos mensuales
      }
    } catch (error) {
      console.error('Error al obtener el historial de asistencia:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar los datos
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendanceHistory();
    setRefreshing(false);
  };

  // Ejecuta cada vez que la pantalla gana el foco
  useFocusEffect(
    React.useCallback(() => {
      fetchAttendanceHistory();
    }, [])
  );

  // Obtiene el conteo de check-ins para el mes actual
  const currentMonthKey = dayjs().format('YYYY-MM');
  const currentMonthCheckIns = monthlyCheckInCount[currentMonthKey] || 0;

  // Efecto de parpadeo: 
  // - fade de 1 a 0 en 500ms, luego de 0 a 1 en 500ms, en bucle
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true, // Mejora rendimiento
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);


  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={attendanceHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <Text>Usuario: {item.email}</Text>
              <Text>Fecha de entrenamiento: {new Date(item.timestamp?.seconds * 1000).toLocaleDateString()}</Text>
              {/* <Text>Tipo: {item.type}</Text> */}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 35 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        />
      )}
      <View style={styles.footer}>
      <Animated.Text // <-- Usamos Animated.Text
          style={[
            styles.footerText,
            { opacity: fadeAnim }, // Aplica la animación de opacidad
          ]}
        >
          Felicitaciones has entrenado
           <Text style={styles.texto}> {currentMonthCheckIns} </Text>
           veces este mes!
          </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  itemContainer: {
    padding: 10,
    borderBottomWidth: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff', // Cambia el color de fondo si es necesario
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  footerText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  texto:{
    color:"#3D3BF3"
  }
});

export default AttendanceHistoryScreen;
