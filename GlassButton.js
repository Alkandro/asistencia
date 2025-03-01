import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";

// Ejemplo de un botón de entrenamiento con efecto vidrio
const GlassButton = ({ onPress, title }) => {
  return (
    <View style={styles.buttonWrapper}>
      {/* BlurView crea el efecto "vidrio" */}
      <BlurView intensity={60} style={styles.blurContainer} tint="light">
        <TouchableOpacity onPress={onPress} style={styles.touchArea}>
          <Text style={styles.buttonText}>{title}</Text>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    // Para simular flotante, lo posicionamos de forma absoluta
    position: "absolute",
    bottom: 30,      // Ajusta la distancia desde el fondo
    alignSelf: "center", 
    zIndex: 999,     // Asegura que aparezca delante
  },
  blurContainer: {
    borderRadius: 25,
    overflow: "hidden",
    // Ajusta el tamaño del contenedor "vidriado"
    width: 200,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  touchArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default GlassButton;
