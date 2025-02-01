import React from "react";
import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { BlurView } from "expo-blur";
import backgroundImage from "./assets/fotos/tashiroblack.png";

const Information = () => {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={backgroundImage}
        style={styles.background}
        resizeMode="cover"
      >
        {/* BlurView que ocupa el 80% de la altura de la pantalla */}
        <BlurView instnsity={80} style={styles.absolute}>
         
          <Text style={styles.titulo}>Profesor</Text>
          <Text style={styles.titulo1}>田代 セイイチ
Instructor/Black Belt</Text>

          <Text style={styles.titulo}>Teléfono de contacto</Text>
          <Text style={styles.titulo1}>Direccion</Text>
          <Text style={styles.titulo}>Direccion</Text>
          <Text style={styles.titulo1}>〒367-0051 埼玉県本庄市本庄１-１-２ もとまちハイツ 201号室</Text>
          <Text style={styles.titulo}>
            Días y horarios de entrenamiento para adultos
          </Text>
          <Text style={styles.titulo1}>オールレベル柔術
月・水・金：20:30〜22:00     
  土：18:30~20:00
日：9:00〜10:30</Text>
          <Text style={styles.titulo}>
            Días y horarios de entrenamiento para niños
          </Text>
          <Text style={styles.titulo1}>月・水・金：19:15〜20:15
土：17:00〜18:00n</Text>
          <Text style={styles.titulo}>Check-ins:</Text>
          <Text style={styles.titulo1}>Direccion</Text>
        </BlurView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  background: {
    height: '80%',
    marginTop:100, // Ocupa todo el contenedor
    justifyContent: "center",
    alignItems: "center",
  },
  absolute: {
    position: 'absolute',
    top:-50,
    left: 3,
    right: 3,
    bottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius:5 , // Bordes redondeados (opcional)
    borderWidth:5,
    borderColor:"white",
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    height: '100%',
  },
  titulo: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    marginVertical: 8,
    textAlign: "center",
    textDecorationLine: "underline",
    
  },
  titulo1: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    marginVertical: 8,
    textAlign: "center",
    
   
  },
});

export default Information;


