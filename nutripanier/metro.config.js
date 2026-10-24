// Ajoute le support des fichiers .wasm, requis par expo-sqlite sur le web.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('wasm');

module.exports = config;
