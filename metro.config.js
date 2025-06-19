// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // 1) Asegura que Metro incluya los módulos .cjs de Firebase
  config.resolver.sourceExts.push('cjs');

  // 2) Desactiva la resolución de "package exports"
  config.resolver.unstable_enablePackageExports = false;

  return config;
})();
