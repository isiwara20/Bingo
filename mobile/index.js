/**
 * BinGo – React Native Entry Point
 *
 * This file is the Android/iOS entry point.
 * It registers the root App component with the native runtime.
 *
 * The component name "BinGo" must match MainActivity.kt getMainComponentName().
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
