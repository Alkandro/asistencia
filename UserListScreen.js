import React, { useEffect, useState } from 'react';
import { View, Text, FlatList,Button } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigation } from "@react-navigation/native";
import { db, auth } from './firebase';

const UserListScreen = () => {
  const [users, setUsers] = useState([]);
  const [checkIns, setCheckIns] = useState({}); // Guarda check-ins por usuario
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUsers = async () => {
      // Verifica si el usuario logueado es admin
      if (auth.currentUser) {
        const currentUserDoc = await getDocs(query(collection(db, 'users'), where('email', '==', auth.currentUser.email)));
        const currentUser = currentUserDoc.docs[0]?.data();
        
        if (currentUser?.role === 'admin') { // Solo si es admin
          // Obtener la lista de todos los usuarios
          const userSnapshot = await getDocs(collection(db, 'users'));
          const userList = userSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
          }));

          setUsers(userList);

          // Obtener el historial de check-ins de cada usuario
          const checkInData = {};
          for (let user of userList) {
            const checkInSnapshot = await getDocs(
              query(collection(db, 'attendanceHistory'), where('userId', '==', user.id))
            );
            checkInData[user.id] = checkInSnapshot.docs.map(doc => doc.data());
          }

          setCheckIns(checkInData);
        }
      }
    };

    fetchUsers();
  }, []);
  const handleSignOut = async () => {
    try {
      await auth.signOut(); // Cierra la sesión del usuario
      navigation.navigate("Login"); // Redirigir al usuario a la pantalla de Login
    } catch (error) {
      Alert.alert("Error", `No se pudo cerrar la sesión: ${error.message}`);
    }
  };

  return (
    <View>
      <Text>Lista de Usuarios</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.email}
        renderItem={({ item }) => (
          <View>
            <Text>Nombre: {item.username}</Text>
            <Text>Email: {item.email}</Text>
            <Text>Teléfono: {item.phone}</Text>
            <Text>Apellido: {item.apellido}</Text>
            <Text>Check-ins:</Text>
            {checkIns[item.id]?.map((checkIn, index) => (
              <View key={index}>
                <Text>Check-in {index + 1}: {checkIn.timestamp}</Text> {/* Mostrar timestamp o lo que necesites */}
              </View>
            ))}
          </View>
        )}
      />
       <Button
        title="¿No tienes una cuenta? Regístrate"
        onPress={() => navigation.navigate("UserProfile")}
      />
       <Button title="Cerrar Sesión" onPress={handleSignOut} />
    </View>
  );
};

export default UserListScreen;
