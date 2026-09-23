import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";

const ThemedApp = () => {
  const { darkMode } = useTheme();
  const navigationTheme = { dark: darkMode, colors: { primary: "#4CAF50", background: darkMode ? "#121212" : "#F5F5F5", card: darkMode ? "#1E1E1E" : "#FFFFFF", text: darkMode ? "#FFFFFF" : "#212121", border: darkMode ? "#383838" : "#E0E0E0", notification: "#E53935" } };
  return <NavigationContainer theme={navigationTheme}>
    <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor={darkMode ? "#121212" : "#FFFFFF"} />
    <RootNavigator />
  </NavigationContainer>;
};

const App = () => <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><AuthProvider><ThemeProvider><ThemedApp /></ThemeProvider></AuthProvider></SafeAreaProvider></GestureHandlerRootView>;
export default App;


