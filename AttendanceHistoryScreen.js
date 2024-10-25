import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';  // Asegúrate de importar tu configuración de Firebase

const AttendanceHistoryScreen = () => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  // Función para obtener el historial de asistencia desde Firestore
  const fetchAttendanceHistory = async () => {
    try {
      const user = auth.currentUser;

      if (user) {
        const q = query(
          collection(db, 'attendanceHistory'),
          where('userId', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        const history = [];

        querySnapshot.forEach((doc) => {
          history.push({ id: doc.id, ...doc.data() });
        });

        setAttendanceHistory(history);
      }
    } catch (error) {
      console.error('Error al obtener el historial de asistencia:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      
      {attendanceHistory.length === 0 ? (
        <Text>No hay registros de asistencia disponibles.</Text>
      ) : (
        <FlatList
        data={attendanceHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ padding: 10, borderBottomWidth: 1 }}>
              <Text>Usuario: {item.email}</Text>
              <Text>Fecha de entrenamiento: {new Date(item.timestamp?.seconds * 1000).toLocaleDateString()}</Text>
              <Text>Tipo: {item.type}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default AttendanceHistoryScreen;




