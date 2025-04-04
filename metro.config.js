const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = mergeConfig(defaultConfig, {
    resolver: {
        extraNodeModules: {
            buffer: require.resolve("buffer"),
            crypto: require.resolve("react-native-quick-crypto"),
            stream: require.resolve("stream-browserify"),
        },
    },
  /* your config */
});

module.exports = withNativeWind(config, { input: "./global.css" });
