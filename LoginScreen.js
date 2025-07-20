import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useTranslation } from "react-i18next";
import ButtonMinimal from "./ButtonMinimal";
import InputMinimal from "./InputMinimal";
import { Ionicons } from '@expo/vector-icons';

const { height: screenHeight } = Dimensions.get('window');

// Componente de banderas reposicionado
const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'pt', flag: '🇧🇷', name: 'Português' },
    { code: 'ja', flag: '🇯🇵', name: '日本語' },
    { code: 'es', flag: '🇪🇸', name: 'Español' },
    { code: 'en', flag: '🇺🇸', name: 'English' },
  ];

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <View style={styles.languageSelector}>
      {languages.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.flagButton,
            i18n.language === lang.code && styles.flagButtonActive
          ]}
          onPress={() => handleLanguageChange(lang.code)}
        >
          <Text style={styles.flagText}>{lang.flag}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Limpiar campos al enfocar la pantalla
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setEmail("");
      setPassword("");
      setLoading(false);
    });

    return unsubscribe;
  }, [navigation]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        t("Error"),
        t("Por favor, completa todos los campos"),
        [{ text: t("OK") }]
      );
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      console.error("Error de login:", error);
      
      let errorMessage = t("Error al iniciar sesión");
      
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = t("Usuario no encontrado");
          break;
        case "auth/wrong-password":
          errorMessage = t("Contraseña incorrecta");
          break;
        case "auth/invalid-email":
          errorMessage = t("Email inválido");
          break;
        case "auth/too-many-requests":
          errorMessage = t("Demasiados intentos. Intenta más tarde");
          break;
        default:
          errorMessage = t("Error al iniciar sesión");
      }
      
      Alert.alert(t("Error"), errorMessage, [{ text: t("OK") }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (platform) => {
    Alert.alert(
      t("Próximamente"),
      t("Login con {{platform}} estará disponible pronto", { platform }),
      [{ text: t("OK") }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Selector de idioma en la esquina superior derecha */}
      <View style={styles.languageSelectorContainer}>
        <LanguageSelector />
      </View>
      
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.contentContainer}>
          {/* Logo TASHIRO en lugar de texto */}
          <View style={styles.logoSection}>
            <Image
              source={require("./assets/fotos/tashiro1.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoSubtext}>JIU-JITSU</Text>
          </View>

          {/* Formulario compacto */}
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>{t("Sign in to your account")}</Text>

            <View style={styles.inputContainer}>
              <InputMinimal
                label={t("Email")}
                placeholder="tashiro@gmail.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <InputMinimal
                label={t("Password")}
                placeholder={t("Password")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#666666"
                    />
                  </TouchableOpacity>
                }
              />
            </View>

            <View style={styles.buttonContainer}>
              <ButtonMinimal
                title={t("Iniciar sesión")}
                onPress={handleLogin}
                disabled={loading}
                loading={loading}
                style={styles.loginButton}
              />
            </View>

            {/* Registro */}
            <View style={styles.registerSection}>
              <Text style={styles.registerText}>
                {t("Don't have an account?")}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Register")}
                disabled={loading}
                style={styles.registerLink}
              >
                <Text style={styles.registerLinkText}>
                  {t("Registrarse")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Redes sociales compactas */}
            <View style={styles.socialSection}>
              <View style={styles.socialButtons}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin("Facebook")}
                  disabled={loading}
                >
                  <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin("Twitter")}
                  disabled={loading}
                >
                  <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin("Instagram")}
                  disabled={loading}
                >
                  <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Loading overlay CORREGIDO para iOS */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <View style={styles.spinnerContainer}>
              <ActivityIndicator size="large" color="#000000" />
            </View>
            <Text style={styles.loadingText}>{t("Iniciando sesión...")}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    
  },
  languageSelectorContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    right: 20,
    zIndex: 1000,
  },
  languageSelector: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  flagButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
  },
  flagButtonActive: {
    backgroundColor: "#F0F0F0",
  },
  flagText: {
    fontSize: 18,
  },
  keyboardContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 80 : 60, // Espacio para las banderas
    justifyContent: "center", // Centrar todo el contenido
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 60, // Reducido de 60
  },
  logoImage: {
    width: 120, // Tamaño del logo
    height: 120,
    marginBottom: 2,
     backgroundColor: 'white', // Esto crearía el cuadrado blanco
    borderRadius: 75, // Si usas borderRadius con un fondo no transparente
    borderWidth: 1, // Si usas un borde
    borderColor: 'white', // Y el borde es blanco
    marginBottom: Platform.OS === "ios" ? 10 : 5,
  },
  logoSubtext: {
    fontSize: 16,
    color: "#666666",
    letterSpacing: 1,
    fontWeight: "500",
    marginBottom: Platform.OS === "ios" ? -10 : -25,
  },
  formSection: {
    width: "100%",
  },
  formTitle: {
    fontSize: 22, // Reducido de 24
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    marginBottom: 30, // Reducido de 40
  },
  inputContainer: {
    marginBottom: Platform.OS === "ios" ? 25 : 3, // Reducido de 24
  },
  passwordToggle: {
    padding: 4,
  },
  buttonContainer: {
    marginTop: 12, // Reducido de 16
    marginBottom: 24, // Reducido de 32
  },
  loginButton: {
    width: "100%",
  },
  registerSection: {
    alignItems: "center",
    marginBottom: 24, // Reducido de 40
  },
  registerText: {
    fontSize: 14, // Reducido de 16
    color: "#666666",
    marginBottom: 6, // Reducido de 8
  },
  registerLink: {
    paddingVertical: 6, // Reducido de 8
    paddingHorizontal: 12, // Reducido de 16
  },
  registerLinkText: {
    fontSize: 14, // Reducido de 16
    color: "#000000",
    fontWeight: "600",
  },
  socialSection: {
    alignItems: "center",
  },
  socialButtons: {
    flexDirection: "row",
    gap: 16, // Reducido de 20
  },
  socialButton: {
    width: 44, // Reducido de 50
    height: 44, // Reducido de 50
    borderRadius: 22, // Reducido de 25
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  loadingContainer: {
    backgroundColor: "#FFFFFF",
    padding: 24, // Reducido de 30
    borderRadius: 12,
    alignItems: "center",
    minWidth: 160,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  spinnerContainer: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14, // Reducido de 16
    color: "#333333",
    fontWeight: "500",
    textAlign: "center",
  },
});

export default LoginScreen;
