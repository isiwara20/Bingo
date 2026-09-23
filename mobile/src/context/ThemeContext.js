import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

const ThemeContext = createContext({ darkMode: false, setDarkMode: async () => {}, language: "en", setLanguage: async () => {} });
const storageKey = user => `@bingo_user_settings:${user?._id || user?.id || user?.email || user?.role || "guest"}`;

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [darkMode, setDarkModeState] = useState(false);
  const [language, setLanguageState] = useState("en");
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey(user)).then(value => {
      if (!active) return;
      const saved = value ? JSON.parse(value) : null;
      const nextDarkMode = saved?.darkMode ?? Appearance.getColorScheme() === "dark";
      global.__BINGO_DARK_MODE__ = nextDarkMode;
      setDarkModeState(nextDarkMode);
      setLanguageState(saved?.languageCode || "en");
    }).catch(() => active && setDarkModeState(false));
    return () => { active = false; };
  }, [user?._id, user?.id, user?.email, user?.role]);
  const setDarkMode = async value => {
    setDarkModeState(value);
    const stored = await AsyncStorage.getItem(storageKey(user));
    const current = stored ? JSON.parse(stored) : {};
    await AsyncStorage.setItem(storageKey(user), JSON.stringify({ ...current, darkMode: value }));
  };
  const setLanguage = async value => {
    setLanguageState(value);
    const stored = await AsyncStorage.getItem(storageKey(user));
    const current = stored ? JSON.parse(stored) : {};
    await AsyncStorage.setItem(storageKey(user), JSON.stringify({ ...current, languageCode: value }));
  };
  return <ThemeContext.Provider value={{ darkMode, setDarkMode, language, setLanguage }}>{children}</ThemeContext.Provider>;
};
export const useTheme = () => useContext(ThemeContext);



