import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Importar traducciones desde archivos JSON
import en from "./Idiomas/en.json";
import ja from "./Idiomas/ja.json";
import pt from "./Idiomas/pt.json";
import es from "./Idiomas/es.json";

// Agregar las traducciones a i18next
const resources = {
  en: { translation: en },
  es: { translation: es },
  ja: { translation: ja },
  pt: { translation: pt },
};

// Función para obtener el idioma guardado o detectar el del dispositivo
const getStoredLanguage = async () => {
  const storedLang = await AsyncStorage.getItem("userLanguage");
  if (storedLang && resources[storedLang]) {
    return storedLang;
  }
  // Si no hay un idioma guardado, usar el idioma del sistema o fallback
  const deviceLang = Localization.locale.split("-")[0]; // "es", "ja", etc.
  return resources[deviceLang] ? deviceLang : "en";
};

// Inicializar i18next
i18n.use(initReactI18next).init({
  resources,
  fallbackLng: "en", // Idioma por defecto
  compatibilityJSON: "v3",
  interpolation: {
    escapeValue: false,
  },
});

// Función para cambiar de idioma y guardarlo en AsyncStorage
export const changeLanguage = async (lang) => {
  await AsyncStorage.setItem("userLanguage", lang);
  i18n.changeLanguage(lang);
};

// Obtener y establecer el idioma inicial
getStoredLanguage().then((lang) => {
  i18n.changeLanguage(lang);
});

export default i18n;
