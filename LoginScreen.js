import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  Text,
  StatusBar,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Linking,
  SafeAreaView, // Asegúrate de importar SafeAreaView
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase"; // Asegúrate de importar Firestore
import { doc, getDoc } from "firebase/firestore"; // Para obtener el rol del usuario
import ButtonGradient from "./ButtonGradient";
import Icon from "react-native-vector-icons/FontAwesome"; // Ajusta el icono según tu preferencia
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useTranslation } from 'react-i18next'; 

// Obtener las dimensiones de la pantalla
const { width, height } = Dimensions.get("window");

const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();  // Hook para traducción
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(
        t( "Error"),
        t("Por favor, ingresa tu correo electrónico y contraseña.")
      );
      return;
    }

    try {
      // Iniciar sesión con correo y contraseña
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Obtener el documento del usuario desde Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userRole = userDoc.data().role;

        if (userRole === "admin") {
          // Si el usuario es admin, navegar a UserListScreen
          console.log("Admin logueado. App.js redirigirá a AdminStack.");
        } else {
          // Si el usuario no es admin, navegar a CheckInScreen
         
        }
      } else {
        Alert.alert(
          t("Error"),
          t( "No se encontró el perfil del usuario en la base de datos.")
        );
      }
    } catch (error) {
      Alert.alert(
        t("Error"),
        t(`No se pudo iniciar sesión porque el usuario o contrasena son equivocadas o el usuario no existe`)
      );
    }
  };

  const openFacebook = () => {
    Linking.openURL("https://www.facebook.com/tashas.natura");
  };
  const openInstagram = () => {
    Linking.openURL("https://www.instagram.com/tshr_jiujitsu/");
  };
  const openTwiter = () => {
    Linking.openURL("https://overlimit-bjj.sakura.ne.jp/fsj41442/");
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      extraScrollHeight={20} // Ajusta según sea necesario
      keyboardShouldPersistTaps="handled"
    >
      {/* StatusBar para ajustar la pantalla debajo de la barra */}
      <StatusBar barStyle="dark-content" backgroundColor="#f1f1f1" />

      <View style={styles.imageContainer}>
        <Image
          source={require("./assets/fotos/IMG_5240.png")} // para imagen local
          style={styles.image}
        />
      </View>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.navigate("Information")}>
          <Image
            source={require("./assets/fotos/tashiro1.png")} // Coloca el nombre de tu imagen de logo aquí
            style={styles.logo}
          />
        </TouchableOpacity>
        <Text style={styles.subTitle}>{t("Sign in to your account")}</Text>
        <TextInput
          placeholder={t("tashiro@gmail.com")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.textIput}
        />
        <TextInput
          placeholder={t("Password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.textIput}
        />

        <ButtonGradient
          onPress={handleLogin}
          title={t("Iniciar sesión")}
          style={styles.button}
        />
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text
            style={[
              styles.forgotPassword,
              {
                marginTop: Platform.OS === "android" ? -15 : -5, // Solo en Android se mueve
              },
            ]}
          >
            {t("Don't have an account?")}
          </Text>
        </TouchableOpacity>
      </View>
      {/* Íconos de enlace al final de la pantalla */}
      <View
        style={[
          styles.iconContainer,
          {
            // Ajustar el tamaño del contenedor según el sistema operativo
            marginTop: Platform.OS === "ios" ? 20 : 15, // Menor padding en Android si es necesario
          },
        ]}
      >
        <TouchableOpacity onPress={openFacebook} style={styles.iconWrapper}>
          <Icon name="facebook" size={30} color="#3b5998" />
        </TouchableOpacity>
        <TouchableOpacity onPress={openTwiter} style={styles.iconWrapper}>
          <FontAwesome6 name="square-x-twitter"  size={30} color="black" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={openInstagram} // Cambia 'InstagramScreen' al destino deseado
          style={styles.iconWrapper}
        >
          <Icon name="instagram" size={30} color="#E1306C" />
        </TouchableOpacity>
      </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: "#f1f1f1",
    flex: 1,
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  titulo: {
    fontSize: 80,
    color: "#34434D",
    fontWeight: "bold",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
    marginTop: 10,
    resizeMode: "contain",
  },
  subTitle: {
    fontSize: 20,
    color: "gray",
  },
  textIput: {
    padding: 10,
    paddingStart: 30,
    width: "80%",
    height: 50,
    marginTop: 15,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  forgotPassword: {
    fontSize: 15,
    marginTop: -10,
    color: "gray",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover", // ajusta cómo se adapta la imagen
  },
  imageContainer: {
    width: "100%",
    height: height * 0.35, // 1/4 de la altura de la pantalla
    marginTop: StatusBar.currentHeight, // Añade espacio extra por el StatusBar
  },
  button: {
    width: "80%",
    height: 50,
    borderRadius: 25,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: -10, // Reduce el padding vertical para ajustar la altura
    marginTop: 10, // Añade un margen superior para levantar los íconos
  },
  iconWrapper: {
    marginHorizontal: 15,
  },
});

export default LoginScreen;
