import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';

const UserListScreen = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (auth.currentUser && auth.currentUser.email === 'admin_email@example.com') { // verifica si es el superusuario
        const querySnapshot = await getDocs(collection(db, 'users'));
        const userList = querySnapshot.docs.map(doc => doc.data());
        setUsers(userList);
      }
    };

    fetchUsers();
  }, []);

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
          </View>
        )}
      />
    </View>
  );
};

export default UserListScreen;
