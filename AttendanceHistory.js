// AttendanceHistory.js
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { db, auth } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const AttendanceHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return; // No hay usuario autenticado
      }

      const q = query(collection(db, 'attendanceHistory'), where('userId', '==', auth.currentUser.uid));
      try {
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecords(data);
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
      {records.map((record, index) => (
        <Text key={record.id}>Check-in at {record.timestamp?.toDate().toString()}</Text>
      ))}
    </View>
  );
};

export default AttendanceHistory;
