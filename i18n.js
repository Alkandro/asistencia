import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

// Importar traducciones desde archivos JSON
import en from "./en.json"
import es from './es.json';

// Agregar las traducciones a i18next
const resources = {
  en: {
    translation: en,
  },
  es: {
    translation: es,
  },
};

// Detector de idioma del dispositivo
const languageDetector = {
  type: "languageDetector",
  async: true,
  detect: (callback) => {
    const locale = Localization.locale.startsWith("es") ? "es" : "en"; // Extrae solo "es" o "en"
    console.log("📌 Idioma detectado:", locale); // Para depuración
    callback(locale);
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

// Inicializar i18next
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en", // Si no detecta idioma, usa inglés
    compatibilityJSON: "v3",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
