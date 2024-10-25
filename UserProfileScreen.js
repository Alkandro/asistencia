// import React, { useEffect, useState } from 'react';
// import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
// import { auth, db } from './firebase'; // Asegúrate de importar correctamente
// import { doc, getDoc } from 'firebase/firestore';

// const UserProfileScreen = () => {
//   const [userData, setUserData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null); // Estado para manejar errores

//   // Función para obtener los datos del usuario desde Firestore
//   const fetchUserData = async () => {
//     try {
//       const user = auth.currentUser; // Obtener usuario autenticado

//       if (user) {
//         const userDoc = await getDoc(doc(db, 'users', user.uid));
        
//         if (userDoc.exists()) {
//           setUserData(userDoc.data());
//         } else {
//           console.log('No se encontraron datos para este usuario');
//           setError('No se encontraron datos para este usuario.');
//         }
//       } else {
//         setError('No hay usuario autenticado.');
//       }
//     } catch (error) {
//       console.error('Error al obtener los datos del usuario:', error);
//       setError('Hubo un problema al cargar los datos del perfil.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Llamar a la función para obtener los datos cuando el componente se monta
//   useEffect(() => {
//     fetchUserData();
//   }, []);

//   if (loading) {
//     return <ActivityIndicator size="large" color="#0000ff" />;
//   }

//   return (
//     <View style={styles.container}>
//       {error ? (
//         <Text style={styles.error}>{error}</Text>
//       ) : userData ? (
//         <>
//           <Text style={styles.title}>Perfil del Usuario</Text>
//           <Text>Nombre: {userData.name}</Text>
//           <Text>Email: {userData.email}</Text>
//           <Text>Teléfono: {userData.phone}</Text>
//         </>
//       ) : (
//         <Text>No se encontraron datos del usuario</Text>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     justifyContent: 'center',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//   },
//   error: {
//     color: 'red',
//     marginBottom: 20,
//   },
// });

// export default UserProfileScreen;


import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

const UserProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;

      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          console.log('No se encontraron datos para este usuario');
        }
      }
    } catch (error) {
      console.error('Error al obtener los datos del usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View>
      {userData ? (
        <>
          <Text>Usuario: {userData.username}</Text>
          <Text>Email: {userData.email}</Text>
          <Text>Teléfono: {userData.phone}</Text>
          <Text>Nombre: {userData.nombre}</Text>
          <Text>Apellido: {userData.apellido}</Text>
          <Text>Ciudad: {userData.ciudad}</Text>
          <Text>Provincia: {userData.provincia}</Text>
          <Text>Edad: {userData.edad}</Text>
          <Text>Peso: {userData.peso}</Text>
          <Text>Altura: {userData.altura}</Text>
          <Text>Cinturon: {userData.cinturon}</Text>
          <Text>Genero: {userData.genero}</Text>
        </>
      ) : (
        <Text>No se encontraron datos del usuario</Text>
      )}
    </View>
  );
};

export default UserProfileScreen;
