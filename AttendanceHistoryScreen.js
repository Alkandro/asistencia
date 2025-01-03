// import React, { useEffect, useState } from 'react';
// import { View, Text, ActivityIndicator, FlatList, RefreshControl, StyleSheet } from 'react-native';
// import { collection, query, where, getDocs } from 'firebase/firestore';
// import { auth, db } from './firebase';
// import { useFocusEffect } from '@react-navigation/native';
// import dayjs from 'dayjs';

// const AttendanceHistoryScreen = () => {
//   const [attendanceHistory, setAttendanceHistory] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [monthlyCheckInCount, setMonthlyCheckInCount] = useState(0);

//   // const fetchAttendanceHistory = async () => {
//   //   try {
//   //     setLoading(true);
//   //     const user = auth.currentUser;

//   //     if (user) {
//   //       const q = query(
//   //         collection(db, 'attendanceHistory'),
//   //         where('userId', '==', user.uid)
//   //       );

//   //       const querySnapshot = await getDocs(q);
//   //       const history = [];
//   //       const currentMonthKey = dayjs().format('YYYY-MM');
//   //       let count = 0;

//   //       querySnapshot.forEach((doc) => {
//   //         const data = doc.data();
//   //         const timestamp = data.timestamp?.seconds ? new Date(data.timestamp.seconds * 1000) : null;

//   //         if (timestamp && dayjs(timestamp).format('YYYY-MM') === currentMonthKey) {
//   //           count++;
//   //         }

//   //         history.push({ id: doc.id, ...data });
//   //       });

//   //       setAttendanceHistory(history);
//   //       setMonthlyCheckInCount(count);
//   //     }
//   //   } catch (error) {
//   //     console.error('Error al obtener el historial de asistencia:', error);
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   const fetchAttendanceHistory = async () => {
//     try {
//       setLoading(true);
//       const user = auth.currentUser;
  
//       if (user) {
//         const q = query(
//           collection(db, 'attendanceHistory'),
//           where('userId', '==', user.uid)
//         );
  
//         const querySnapshot = await getDocs(q);
//         const history = [];
//         const monthlyCounts = {}; // Objeto para almacenar los conteos mensuales
  
//         querySnapshot.forEach((doc) => {
//           const data = doc.data();
//           const timestamp = data.timestamp?.seconds ? new Date(data.timestamp.seconds * 1000) : null;
          
//           if (timestamp) {
//             const monthKey = dayjs(timestamp).format('YYYY-MM'); // Formato para cada mes
  
//             // Si el mes ya existe, incrementa el contador, si no, inicialízalo en 1
//             monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
//           }
  
//           history.push({ id: doc.id, ...data });
//         });
  
//         setAttendanceHistory(history);
//         setMonthlyCheckInCount(monthlyCounts);
//       }
//     } catch (error) {
//       console.error('Error al obtener el historial de asistencia:', error);
//     } finally {
//       setLoading(false);
//     }
//   };
  

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await fetchAttendanceHistory(); // Refrescar los datos
//     setRefreshing(false);
//   };

//   useFocusEffect(
//     React.useCallback(() => {
//       fetchAttendanceHistory(); // Se ejecuta cada vez que `AttendanceHistoryScreen` gana el foco
//     }, [])
//   );

//   return (
//     <View style={styles.container}>
//       {loading ? (
//         <ActivityIndicator size="large" color="#0000ff" />
//       ) : (
//         <FlatList
//           data={attendanceHistory}
//           keyExtractor={(item) => item.id}
//           renderItem={({ item }) => (
//             <View style={styles.itemContainer}>
//               <Text>Usuario: {item.email}</Text>
//               <Text>Fecha de entrenamiento: {new Date(item.timestamp?.seconds * 1000).toLocaleDateString()}</Text>
//               <Text>Tipo: {item.type}</Text>
//             </View>
//           )}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//             />
//           }
//         />
//       )}
//       <View style={styles.footer}>
//         <Text style={styles.footerText}>
//           Check-ins este mes: {monthlyCheckInCount}
//         </Text>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//   },
//   itemContainer: {
//     padding: 10,
//     borderBottomWidth: 1,
//   },
//   footer: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: '#fff', // Cambia el color de fondo si es necesario
//     padding: 15,
//     alignItems: 'center',
//     borderTopWidth: 1,
//     borderTopColor: '#ccc',
//   },
//   footerText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });

// export default AttendanceHistoryScreen;

import React, { useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';

const AttendanceHistoryScreen = () => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monthlyCheckInCount, setMonthlyCheckInCount] = useState({});

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
              <Text>Tipo: {item.type}</Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        />
      )}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Check-ins este mes: {currentMonthCheckIns}
        </Text>
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
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AttendanceHistoryScreen;
