// // AttendanceHistory.js
// import React, { useState, useEffect } from 'react';
// import { View, Text, ActivityIndicator } from 'react-native';
// import { db, auth } from './firebase';
// import { collection, query, where, getDocs } from 'firebase/firestore';

// const AttendanceHistory = () => {
//   const [records, setRecords] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchRecords = async () => {
//       if (!auth.currentUser) {
//         setLoading(false);
//         return; // No hay usuario autenticado
//       }

//       const q = query(collection(db, 'attendanceHistory'), where('userId', '==', auth.currentUser.uid));
//       try {
//         const querySnapshot = await getDocs(q);
//         const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         setRecords(data);
//       } catch (error) {
//         console.error('Error fetching attendance history:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchRecords();
//   }, []);

//   if (loading) {
//     return <ActivityIndicator size="large" color="#0000ff" />;
//   }

//   if (records.length === 0) {
//     return <Text>No se encontraron registros para este usuario.</Text>;
//   }

//   return (
//     <View>
//       {records.map((record, index) => (
//         <Text key={record.id}>Check-in at {record.timestamp?.toDate().toString()}</Text>
//       ))}
//     </View>
//   );
// };

// export default AttendanceHistory;


import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { db, auth } from './firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const AttendanceHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return; // No hay usuario autenticado
      }

      const userId = auth.currentUser.uid;

      // Consulta para obtener el historial de asistencia
      const q = query(collection(db, 'attendanceHistory'), where('userId', '==', userId));

      try {
        const querySnapshot = await getDocs(q);
        const historyData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Obtén el username del usuario autenticado
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        let username = 'Usuario'; // Valor por defecto
        if (userDoc.exists()) {
          username = userDoc.data().username || 'Usuario';
        }

        // Añade el username a cada registro
        const recordsWithUsername = historyData.map(record => ({
          ...record,
          username,
        }));

        setRecords(recordsWithUsername);
      } catch (error) {
        console.error('Error fetching attendance history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (records.length === 0) {
    return <Text>No se encontraron registros para este usuario.</Text>;
  }

  return (
    <View>
      {records.map((record) => (
        <View key={record.id} style={{ padding: 10, borderBottomWidth: 1 }}>
          <Text>Usuario: {record.username}</Text>
          <Text>Check-in: {record.timestamp?.toDate().toString()}</Text>
        </View>
      ))}
    </View>
  );
};

export default AttendanceHistory;
