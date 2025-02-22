// import i18n from "i18next";
// import { initReactI18next } from "react-i18next";
// import * as Localization from "expo-localization";

// // Importar traducciones desde archivos JSON
// import en from "./en.json"
// import ja from "./ja.json"
// import pt from "./pt.json"
// import es from './es.json';

// // Agregar las traducciones a i18next
// const resources = {
//   en: {
//     translation: en,
//   },
//   es: {
//     translation: es,
//   },
//   ja: {
//     translation: ja,
//   },
//   pt: {
//     translation: pt,
//   },
// };

// // Detector de idioma del dispositivo
// const languageDetector = {
//   type: "languageDetector",
//   async: true,
//   detect: (callback) => {
//     let locale = Localization.locale.split("-")[0]; // Extrae solo el código de idioma ("ja", "es", "pt", etc.)
    
//     // Si el idioma detectado no está en `resources`, usa el idioma por defecto (fallbackLng)
//     if (!resources[locale]) {
//       locale = "en"; // Cambia esto a otro idioma si prefieres otro fallback
//     }

//     console.log("📌 Idioma detectado:", locale); // Para depuración
//     callback(locale);
//   },
//   init: () => {},
//   cacheUserLanguage: () => {},
// };

// // Inicializar i18next
// i18n
//   .use(languageDetector)
//   .use(initReactI18next)
//   .init({
//     resources,
//     fallbackLng: "en", // Si no detecta idioma, usa inglés
//     compatibilityJSON: "v3",
//     interpolation: {
//       escapeValue: false,
//     },
//   });

// export default i18n;



import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Importar traducciones desde archivos JSON
import en from "./en.json";
import ja from "./ja.json";
import pt from "./pt.json";
import es from "./es.json";

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
