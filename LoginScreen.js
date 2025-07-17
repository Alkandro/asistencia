// import React, { useState, useEffect } from "react";
// import {
//   View,
//   TextInput,
//   Button,
//   Alert,
//   StyleSheet,
//   Text,
//   StatusBar,
//   TouchableOpacity,
//   Image,
//   Dimensions,
//   Platform,
//   Linking,
//   SafeAreaView,
// } from "react-native";
// import { signInWithEmailAndPassword } from "firebase/auth";
// import { auth, db } from "./firebase";
// import { doc, getDoc } from "firebase/firestore";
// import ButtonGradient from "./ButtonGradient";
// import Icon from "react-native-vector-icons/FontAwesome";
// import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
// import { useTranslation } from "react-i18next";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { changeLanguage } from "./i18n"; // Importamos la función para cambiar idioma
// import FloatingFlags from "./FloatingFlags";

// const { width, height } = Dimensions.get("window");

// const LoginScreen = ({ navigation }) => {
//   const { t, i18n } = useTranslation();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

//   useEffect(() => {
//     const loadLanguage = async () => {
//       const lang = await AsyncStorage.getItem("userLanguage");
//       if (lang) setSelectedLanguage(lang);
//     };
//     loadLanguage();
//   }, []);

//   const handleLanguageChange = async (lang) => {
//     await changeLanguage(lang);
//     setSelectedLanguage(lang);
//   };

//   const handleLogin = async () => {
//     if (!email || !password) {
//       Alert.alert(
//         t("Error"),
//         t("Por favor, ingresa tu correo electrónico y contraseña.")
//       );
//       return;
//     }

//     try {
//       const userCredential = await signInWithEmailAndPassword(
//         auth,
//         email,
//         password
//       );
//       const user = userCredential.user;
//       const userDocRef = doc(db, "users", user.uid);
//       const userDoc = await getDoc(userDocRef);

//       if (userDoc.exists()) {
//         const userRole = userDoc.data().role;
//         if (userRole === "admin") {
//           console.log("Admin logueado. App.js redirigirá a AdminStack.");
//         } else {
//           console.log("Usuario normal logueado.");
//         }
//       } else {
//         Alert.alert(
//           t("Error"),
//           t("No se encontró el perfil del usuario en la base de datos.")
//         );
//       }
//     } catch (error) {
//       Alert.alert(
//         t("Error"),
//         t("No se pudo iniciar sesión. Verifica tu correo y contraseña.")
//       );
//     }
//   };

//   return (
//     <SafeAreaView style={styles.mainContainer}>
//       <KeyboardAwareScrollView
//         contentContainerStyle={{ flexGrow: 1 }}
//         extraScrollHeight={20}
//         keyboardShouldPersistTaps="handled"
//       >
//         <FloatingFlags
//           handleLanguageChange={handleLanguageChange}
//           selectedLanguage={selectedLanguage}
//         />
//         <StatusBar barStyle="dark-content" backgroundColor="#f1f1f1" />

//         <View style={styles.imageContainer}>
//           <Image
//             source={require("./assets/fotos/IMG_5240.png")}
//             style={styles.image}
//           />
//         </View>

//         <View style={styles.container}>
//           <TouchableOpacity onPress={() => navigation.navigate("Information")}>
//             <Image
//               source={require("./assets/fotos/tashiro1.png")}
//               style={styles.logo}
//             />
//           </TouchableOpacity>

//           <Text style={styles.subTitle}>{t("Sign in to your account")}</Text>

//           <TextInput
//             placeholder={t("tashiro@gmail.com")}
//             value={email}
//             onChangeText={setEmail}
//             keyboardType="email-address"
//             autoCapitalize="none"
//             style={styles.textInput}
//           />
//           <TextInput
//             placeholder={t("Password")}
//             value={password}
//             onChangeText={setPassword}
//             secureTextEntry
//             style={styles.textInput}
//           />

//           <ButtonGradient
//             onPress={handleLogin}
//             title={t("Iniciar sesión")}
//             style={styles.button}
//           />

//           <TouchableOpacity onPress={() => navigation.navigate("Register")}>
//             <Text style={styles.forgotPassword}>
//               {t("Don't have an account?")}
//             </Text>
//           </TouchableOpacity>
//         </View>

//         <View style={styles.iconContainer}>
//           <TouchableOpacity
//             onPress={() =>
//               Linking.openURL("https://www.facebook.com/tashas.natura")
//             }
//             style={styles.iconWrapper}
//           >
//             <Icon name="facebook" size={30} color="#3b5998" />
//           </TouchableOpacity>

//           <TouchableOpacity
//             onPress={() =>
//               Linking.openURL("https://overlimit-bjj.sakura.ne.jp/fsj41442/")
//             }
//             style={styles.iconWrapper}
//           >
//             <FontAwesome6 name="square-x-twitter" size={30} color="black" />
//           </TouchableOpacity>

//           <TouchableOpacity
//             onPress={() =>
//               Linking.openURL("https://www.instagram.com/tshr_jiujitsu/")
//             }
//             style={styles.iconWrapper}
//           >
//             <Icon name="instagram" size={30} color="#E1306C" />
//           </TouchableOpacity>
//         </View>
//       </KeyboardAwareScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   mainContainer: {
//     backgroundColor: "#f1f1f1",
//     flex: 1,
//   },
//   container: {
//     alignItems: "center",
//     justifyContent: "center",
//     width: "100%",
//   },
//   logo: {
//     width: 120,
//     height: 120,
//     marginBottom: 10,
//     marginTop: 10,
//     resizeMode: "contain",
//   },
//   subTitle: {
//     fontSize: 20,
//     color: "gray",
//   },
//   textInput: {
//     padding: 10,
//     paddingStart: 30,
//     width: "80%",
//     height: 50,
//     marginTop: 15,
//     borderRadius: 30,
//     backgroundColor: "#fff",
//   },
//   forgotPassword: {
//     fontSize: 15,
//     marginTop: -15,
//     color: "gray",
//   },
//   imageContainer: {
//     width: "100%",
//     height: height * 0.35,
    
//     marginTop: StatusBar.currentHeight,
//   },
//   image: {
//     width: "100%",
//     height: "100%",
//     resizeMode: "cover",
//   },
//   button: {
//     width: "80%",
//     height: 50,
//     borderRadius: 25,
//     padding: 10,
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 20,
//     marginBottom: 40,
//   },
//   iconContainer: {
//     flexDirection: "row",
//     justifyContent: "center",
//     marginTop: 10,
//   },
//   iconWrapper: {
//     marginHorizontal: 15,
//   },
//   languageContainer: {
//     flexDirection: "row",
//     marginTop: 20,
//     gap: 10,
//   },
//   flag: {
//     width: 30,
//     height: 30,
//     borderRadius: 7,
//     opacity: 0.7,
//   },
//   selected: {
//     opacity: 1,
//     borderWidth: 2,
//     borderColor: "#000",
//   },
//   iconContainer: {
//     flexDirection: "row",
//     justifyContent: "center", // Centra horizontalmente
//     alignItems: "center", // Centra verticalmente
//     paddingVertical: 5, // Ajusta el espaciado interno sin valores negativos
//     paddingTop: Platform.OS === "ios" ? 25 : 5, // Ajusta según la plataforma
//   },
//   iconWrapper: {
//     marginHorizontal: 15,
//     padding: 5, // Espaciado adicional
//   },
// });

// export default LoginScreen;

import React, { useState, useEffect } from "react";
import {
  View,
  Alert,
  StyleSheet,
  Text,
  StatusBar,
  TouchableOpacity,
  Image,
  Platform,
  Linking,
  SafeAreaView,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import ButtonMinimal from "./ButtonMinimal";
import InputMinimal from "./InputMinimal";
import Icon from "react-native-vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { changeLanguage } from "./i18n";
import FloatingFlags from "./FloatingFlags";

const LoginScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  useEffect(() => {
    const loadLanguage = async () => {
      const lang = await AsyncStorage.getItem("userLanguage");
      if (lang) setSelectedLanguage(lang);
    };
    loadLanguage();
  }, []);

  const handleLanguageChange = async (lang) => {
    await changeLanguage(lang);
    setSelectedLanguage(lang);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(
        t("Error"),
        t("Por favor, ingresa tu correo electrónico y contraseña.")
      );
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userRole = userDoc.data().role;
        if (userRole === "admin") {
          console.log("Admin logueado. App.js redirigirá a AdminStack.");
        } else {
          console.log("Usuario normal logueado.");
        }
      } else {
        Alert.alert(
          t("Error"),
          t("No se encontró el perfil del usuario en la base de datos.")
        );
      }
    } catch (error) {
      Alert.alert(
        t("Error"),
        t("No se pudo iniciar sesión. Verifica tu correo y contraseña.")
      );
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        <FloatingFlags
          handleLanguageChange={handleLanguageChange}
          selectedLanguage={selectedLanguage}
        />
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={styles.container}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <TouchableOpacity onPress={() => navigation.navigate("Information")}>
              <Image
                source={require("./assets/fotos/tashiro1.png")}
                style={styles.logo}
              />
            </TouchableOpacity>
            <Text style={styles.logoText}>TASHIRO</Text>
            <Text style={styles.logoSubtext}>JIU-JITSU</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.welcomeText}>{t("Sign in to your account")}</Text>
            
            <InputMinimal
              placeholder={t("tashiro@gmail.com")}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            
            <InputMinimal
              placeholder={t("Password")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />

            <ButtonMinimal
              onPress={handleLogin}
              title={t("Iniciar sesión")}
              style={styles.loginButton}
            />

            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerLink}>
                {t("Don't have an account?")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Social Media Section */}
          <View style={styles.socialSection}>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL("https://www.facebook.com/tashas.natura")
              }
              style={styles.socialIcon}
            >
              <Icon name="facebook" size={24} color="#3b5998" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Linking.openURL("https://overlimit-bjj.sakura.ne.jp/fsj41442/")
              }
              style={styles.socialIcon}
            >
              <FontAwesome6 name="square-x-twitter" size={24} color="#000000" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Linking.openURL("https://www.instagram.com/tshr_jiujitsu/")
              }
              style={styles.socialIcon}
            >
              <Icon name="instagram" size={24} color="#E1306C" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: "center",
    marginTop: Platform.OS === 'ios' ? 60 : 80,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
    resizeMode: "contain",
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 16,
    color: "#666666",
    letterSpacing: 1,
    marginTop: 4,
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 40,
  },
  welcomeText: {
    fontSize: 18,
    color: "#666666",
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    marginBottom: 24,
  },
  loginButton: {
    marginTop: 32,
    marginBottom: 24,
  },
  registerLink: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  socialSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    gap: 32,
  },
  socialIcon: {
    padding: 8,
  },
});

export default LoginScreen;

