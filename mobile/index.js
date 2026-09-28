/**
 * BinGo – Entry Point
 *
 * This file is the Android/iOS entry point.
 * It registers the root App component with the native runtime.
 */

const { AppRegistry } = require('react-native');
const { installThemeStyles } = require('./src/theme/installThemeStyles');
installThemeStyles();
const App = require('./App').default;
const { name: appName } = require('./app.json');

AppRegistry.registerComponent(appName, () => App);
