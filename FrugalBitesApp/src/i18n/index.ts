import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import ro from './ro.json';

const LANGUAGE_KEY = '@frugalbites_language';

const resources = {
  en: { translation: en },
  ro: { translation: ro },
};

// Get saved language or use device language
const getInitialLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage) {
      return savedLanguage;
    }
    // Get device language using getLocales()
    const locales = Localization.getLocales();
    const deviceLanguage = locales[0]?.languageCode || 'en';
    return deviceLanguage === 'ro' ? 'ro' : 'en';
  } catch {
    return 'en';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default, will be updated
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Initialize with saved/device language
const initI18n = async () => {
  const language = await getInitialLanguage();
  await i18n.changeLanguage(language);
  return i18n;
};

// Auto-initialize on import
getInitialLanguage().then((language) => {
  i18n.changeLanguage(language);
});

export { initI18n };

export const changeLanguage = async (language: 'en' | 'ro') => {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
  await i18n.changeLanguage(language);
};

export const getCurrentLanguage = () => i18n.language;

export default i18n;
