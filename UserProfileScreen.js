import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet,Image } from 'react-native';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';

// import BlueBelt from './assets/fotos/jiujitsuBlue.png';
import WhiteBelt from './assets/fotos/whiteBelt.png';
import BlueBelt from './assets/fotos/blueBelt.png';
import PurpleBelt from './assets/fotos/purpleBelt.png';
import BrownBelt from './assets/fotos/brownBelt.png';
import BlackBelt from './assets/fotos/blackBelt.png';



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

  // Función para obtener la imagen del cinturón según el valor de 'cinturon'
  const getBeltImage = (beltColor) => {
    switch (beltColor) {
      case 'white':
        return WhiteBelt;
      case 'blue':
        return BlueBelt;
      case 'purple':
        return PurpleBelt;
      case 'brown':
        return BrownBelt;
      case 'black':
        return BlackBelt;
      default:
        return null; // Imagen por defecto o deja en blanco
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      {userData ? (
        <>
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={20} color="#000" style={styles.icon} />
            <Text style={styles.text}>{userData.username}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={20} color="#000" style={styles.icon} />
            <Text style={styles.text}>{userData.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color="#000" style={styles.icon} />
            <Text style={styles.text}>{userData.phone}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="badge" size={20} color="#000" style={styles.icon} />
            <Text style={styles.text}>{userData.nombre}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="badge" size={20} color="#000" style={styles.icon} />
            <Text style={styles.text}>{userData.apellido}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="location-city" size={20} color="#000" style={styles.icon} />
            <Text style={styles.text}>{userData.ciudad} 市</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color="#000" style={styles.icon} />
            <Text style={styles.text}>{userData.provincia} 県</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="schedule" size={20} color="#000" style={styles.icon} />
            <Text style={styles.text}>{userData.edad} years old</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="scale" size={20} color="#000" style={styles.icon} />
            <Text style={styles.text}>{userData.peso} kg</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="height" size={20} color="#000" style={styles.icon} />
            <Text style={styles.text}>{userData.altura} cm</Text>
          </View>

          {/* Muestra la imagen del cinturón */}
          <View style={styles.infoRow}>
            <Image source={getBeltImage(userData.cinturon)} style={styles.icon1} />
            <Text style={styles.text}>{userData.cinturon}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="wc" size={20} color="#000" style={styles.icon} />
            <Text style={styles.text}>{userData.genero}</Text>
          </View>
        </>
      ) : (
        <Text>No se encontraron datos del usuario</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
  },
  icon1: {
    width: 60, // Ajusta el ancho
    height: 20, // Ajusta la altura
    marginRight: 8,
    resizeMode: 'contain',
  },
});

export default UserProfileScreen;
