// FloatingFlags.js
import React from "react";
import { View, TouchableOpacity, Image, StyleSheet } from "react-native";

const FloatingFlags = ({ handleLanguageChange, selectedLanguage }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => handleLanguageChange("pt")}>
        <Image
          source={require("./assets/flags/brazil.png")}
          style={[styles.flag, selectedLanguage === "pt" && styles.selected]}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleLanguageChange("ja")}>
        <Image
          source={require("./assets/flags/japan.png")}
          style={[styles.flag, selectedLanguage === "ja" && styles.selected]}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleLanguageChange("en")}>
        <Image
          source={require("./assets/flags/united-states.png")}
          style={[styles.flag, selectedLanguage === "en" && styles.selected]}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleLanguageChange("es")}>
        <Image
          source={require("./assets/flags/flag.png")}
          style={[styles.flag, selectedLanguage === "es" && styles.selected]}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 310, // Ajusta la distancia desde la parte superior
    left: 10, // Ajusta la distancia desde la derecha
    flexDirection: "column",
    gap: 10,
    zIndex: 100, // Asegúrate de que se dibuje encima de otros componentes
  },
  flag: {
    width: 30,
    height: 30,
    borderRadius: 50,
    opacity: 0.7,
  },
  selected: {
    opacity: 1,
    borderWidth: 2,
    borderColor: "#000",
  },
});

export default FloatingFlags;
