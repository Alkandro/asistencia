import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

// Importar traducciones
const resources = {
  en: {
    translation: {
      welcome: "Welcome!",
      buttonText: "Click me",
      loading: "Loading...", // Agregado para pruebas
    },
  },
  es: {
    translation: {
      welcome: "¡Bienvenido!",
      buttonText: "Haz clic en mí",
      loading: "Cargando...", // Agregado para pruebas
    },
  },
};

// Detector de idioma del dispositivo
const languageDetector = {
  type: "languageDetector",
  async: true,
  detect: (callback) => {
    const locale = Localization.locale.split("-")[0]; // Extrae solo "es" o "en"
    console.log("📌 Idioma detectado:", locale); // Para depuración
    callback(locale);
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

// Inicializar i18n
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
