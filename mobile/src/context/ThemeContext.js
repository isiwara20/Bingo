import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

const ThemeContext = createContext({
  darkMode: false,
  setDarkMode: async () => {},
  language: "en",
  setLanguage: async () => {},
});

const storageKey = user => `@bingo_user_settings:${user?._id || user?.id || user?.email || user?.role || "guest"}`;

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [darkMode, setDarkModeState] = useState(false);
  const [language, setLanguageState] = useState("en");

  useEffect(() => {
    let active = true;
    global.__BINGO_DARK_MODE__ = false;
    AsyncStorage.getItem(storageKey(user))
      .then(value => {
        if (!active) return;
        const saved = value ? JSON.parse(value) : null;
        global.__BINGO_DARK_MODE__ = false;
        setDarkModeState(false);
        setLanguageState(saved?.languageCode || "en");
      })
      .catch(() => {
        if (active) {
          global.__BINGO_DARK_MODE__ = false;
          setDarkModeState(false);
        }
      });
    return () => { active = false; };
  }, [user?._id, user?.id, user?.email, user?.role]);

  const setDarkMode = async (value) => {
    // Keep app in default light theme
    global.__BINGO_DARK_MODE__ = false;
    setDarkModeState(false);
    const stored = await AsyncStorage.getItem(storageKey(user));
    const current = stored ? JSON.parse(stored) : {};
    await AsyncStorage.setItem(storageKey(user), JSON.stringify({ ...current, darkMode: false }));
  };

  const setLanguage = async (value) => {
    setLanguageState(value);
    const stored = await AsyncStorage.getItem(storageKey(user));
    const current = stored ? JSON.parse(stored) : {};
    await AsyncStorage.setItem(storageKey(user), JSON.stringify({ ...current, languageCode: value }));
  };

  return (
    <ThemeContext.Provider value={{ darkMode: false, setDarkMode, language, setLanguage }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
