const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * Windows: disable watchman (not available), use node file watcher
 */
const config = {
  watcher: {
    watchman: {
      deferStates: [],
    },
    // Use node file watcher on Windows instead of watchman
    additionalExts: ['mjs', 'cjs'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
