module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Load environment variables from .env file
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      safe: false,
      allowUndefined: true,
    }],
    // react-native-reanimated must be listed last
    'react-native-reanimated/plugin',
  ],
};
