/**
 * BinGo – Entry Point
 *
 * This file is the Android/iOS entry point.
 * It registers the root App component with the native runtime.
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
