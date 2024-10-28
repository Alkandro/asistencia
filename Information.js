import React from "react";
import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { BlurView } from "expo-blur";
import backgroundImage from "./assets/fotos/TashiroBlack.jpg";

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
         
          <Text style={styles.titulo1}>Direccion</Text>
          <Text style={styles.titulo}>Teléfono de contacto</Text>
          <Text style={styles.titulo}>Profesor</Text>
          <Text style={styles.titulo}>
            Días y horarios de entrenamiento para adultos
          </Text>
          <Text style={styles.titulo}>
            Días y horarios de entrenamiento para niños
          </Text>
          <Text style={styles.titulo}>Check-ins:</Text>
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
    top:5,
    left: 10,
    right: 10,
    bottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius:5 , // Bordes redondeados (opcional)
    borderWidth:5,
    borderColor:"white",
    height: '80%',
  },
  titulo: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 8,
    textAlign: "center",
    letterSpacing: 0.5,
    textDecorationLine: "underline",
  },
  titulo1: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 8,
    textAlign: "center",
    letterSpacing: 0.5,
    textDecorationLine: "underline",
    marginTop: -170,
  },
});

export default Information;
