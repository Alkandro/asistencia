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
  try {
    const storedLang = await AsyncStorage.getItem("userLanguage");
    if (storedLang && resources[storedLang]) {
      return storedLang;
    }
    // Si no hay un idioma guardado, usar el idioma del sistema o fallback
    const deviceLang = Localization.locale.split("-")[0];
    return resources[deviceLang] ? deviceLang : "en";
  } catch (error) {
    console.warn("Error getting stored language:", error);
    return "en";
  }
};

// ✅ INICIALIZACIÓN SÍNCRONA CON CONFIGURACIÓN MÍNIMA
const initI18n = async () => {
  try {
    // Primero inicializar con configuración básica
    await i18n.use(initReactI18next).init({
      resources,
      lng: "en", // Idioma inicial temporal
      fallbackLng: "en",
      compatibilityJSON: "v3",
      interpolation: {
        escapeValue: false,
      },
      // ✅ Configuración adicional para evitar errores
      debug: false,
      react: {
        useSuspense: false, // Importante para evitar problemas de rendering
      },
    });

    // Después cargar el idioma correcto
    const correctLanguage = await getStoredLanguage();
    await i18n.changeLanguage(correctLanguage);
    
    console.log("✅ i18n inicializado correctamente con idioma:", correctLanguage);
    return true;
  } catch (error) {
    console.error("❌ Error inicializando i18n:", error);
    return false;
  }
};

// ✅ INICIALIZAR INMEDIATAMENTE
initI18n();

// ✅ DETECTOR DE IDIOMA PERSONALIZADO (ALTERNATIVA)
const languageDetector = {
  type: 'languageDetector',
  async: false, // Importante: false para inicialización síncrona
  detect: () => {
    // Devolver idioma por defecto, se actualizará después
    return "en";
  },
  init: () => {},
  cacheUserLanguage: () => {}
};

// ✅ ALTERNATIVA: Re-inicializar con detector si hay problemas
const reinitWithDetector = () => {
  i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: "en",
      compatibilityJSON: "v3",
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

  // Cargar idioma correcto después
  setTimeout(async () => {
    const lang = await getStoredLanguage();
    i18n.changeLanguage(lang);
  }, 0);
};

// Función para cambiar de idioma y guardarlo en AsyncStorage
export const changeLanguage = async (lang) => {
  try {
    await AsyncStorage.setItem("userLanguage", lang);
    await i18n.changeLanguage(lang);
    console.log("✅ Idioma cambiado a:", lang);
  } catch (error) {
    console.warn("❌ Error changing language:", error);
  }
};

// ✅ FUNCIÓN PARA VERIFICAR SI i18n ESTÁ LISTO
export const isI18nReady = () => {
  return i18n.isInitialized && i18n.language;
};

// ✅ FUNCIÓN PARA ESPERAR A QUE i18n ESTÉ LISTO
export const waitForI18n = () => {
  return new Promise((resolve) => {
    const check = () => {
      if (isI18nReady()) {
        resolve(true);
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
};

export default i18n;

