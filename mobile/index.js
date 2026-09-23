const { AppRegistry } = require('react-native');
const { installThemeStyles } = require('./src/theme/installThemeStyles');
installThemeStyles();
const App = require('./App').default;
const { name: appName } = require('./app.json');
AppRegistry.registerComponent(appName, () => App);
