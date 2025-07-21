import React from "react";
import { View, Text, StyleSheet, ImageBackground, Platform, ScrollView } from "react-native";
import { BlurView } from "expo-blur";
import backgroundImage from "../assets/fotos/tashiroblack.png";
import { useTranslation } from 'react-i18next';

const Information = () => {
  const { t } = useTranslation();  // Hook para traducción
  const renderContent = () => {
    return (
      <>
        <Text style={styles.titulo}>{t("Profesor")}</Text>
        <Text style={styles.titulo1}>
          田代 セイイチ{"\n"}Instructor/Black Belt
        </Text>
        <Text style={styles.titulo}>{t("Teléfono")}</Text>
        <Text style={styles.titulo1}>
         090 6516 3248
        </Text>
        <Text style={styles.titulo}>{t("Direccion")}</Text>
        <Text style={styles.titulo1}>
          〒367-0051 埼玉県本庄市本庄１-１-２{"\n"}もとまちハイツ 201号室
        </Text>
        <Text style={styles.titulo}>{t("Días y horarios de entrenamiento para adultos")}</Text>
        <Text style={styles.titulo1}>
          オールレベル柔術{"\n"}月・水・金：20:30〜22:00{"\n"}土：18:30~20:00{"\n"}日：9:00〜10:30
        </Text>
        <Text style={styles.titulo}>{t("Días y horarios de entrenamiento para niños")}</Text>
        <Text style={styles.titulo1}>
          月・水・金：19:15〜20:15{"\n"}土：17:00〜18:00
        </Text>
       
      </>
    );
  };

  // En Android usamos un ScrollView para que se pueda desplazar el contenido
  const renderBlurContainer = () => {
    if (Platform.OS === "ios") {
      return (
        <BlurView intensity={10} style={styles.absolute}>
          {renderContent()}
        </BlurView>
      );
    } else {
      return (
        <View style={[styles.absolute, { backgroundColor: "rgba(0, 0, 0, 0.6)" }]}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {renderContent()}
          </ScrollView>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
        {renderBlurContainer()}
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
    height: "80%",
    marginTop: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  absolute: {
    position: "absolute",
    top: -50,
    left: 3,
    right: 3,
    bottom: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 5,
    borderColor: "white",
    padding: 10, // agrega padding para el contenido
  },
  scrollContainer: {
    // Ajusta el contenido para que se acomode mejor
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titulo: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    marginVertical: 4, // reduce margen vertical
    textAlign: "center",
    textDecorationLine: "underline",
  },
  titulo1: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    marginVertical: 4, // reduce margen vertical
    textAlign: "center",
    lineHeight: 18, // ajusta la altura de línea para compactar el texto
  },
});

export default Information;
