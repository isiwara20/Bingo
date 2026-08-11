module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-maps|react-native-gesture-handler|react-native-reanimated|react-native-screens|react-native-safe-area-context|react-native-image-picker|react-native-geolocation-service|react-native-permissions|react-native-vector-icons|@react-native-async-storage|@react-native-community)/)',
  ],
};
