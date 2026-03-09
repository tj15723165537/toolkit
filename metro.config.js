const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// NativeWind configuration
try {
  const { withNativeWind } = require('nativewind/dist/metro');
  module.exports = withNativeWind(config, { input: './global.css' });
} catch (error) {
  console.warn('NativeWind metro config failed, using default config:', error.message);
  module.exports = config;
}