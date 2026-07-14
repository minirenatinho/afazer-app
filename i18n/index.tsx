import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Locale } from './translations';

const LANGUAGE_STORAGE_KEY = 'language';

export type TranslateParams = Record<string, string | number>;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TranslateParams) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function detectDeviceLocale(): Locale {
  try {
    let tag: string | undefined;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      tag = navigator.language;
    } else if (typeof Intl !== 'undefined') {
      tag = Intl.DateTimeFormat().resolvedOptions().locale;
    }
    if (tag && tag.toLowerCase().startsWith('pt')) return 'pt-BR';
  } catch {}
  return 'en';
}

function lookup(dict: unknown, key: string): unknown {
  return key
    .split('.')
    .reduce<any>((acc, part) => (acc == null ? undefined : acc[part]), dict);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectDeviceLocale);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then(stored => {
        if (stored === 'en' || stored === 'pt-BR') setLocaleState(stored);
      })
      .catch(() => {});
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next).catch(() => {});
  }, []);

  const t = useCallback(
    (key: string, params?: TranslateParams): string => {
      let value = lookup(translations[locale], key);
      if (typeof value !== 'string') value = lookup(translations.en, key);
      if (typeof value !== 'string') return key;
      if (params) {
        for (const [name, replacement] of Object.entries(params)) {
          value = (value as string).split(`{{${name}}}`).join(String(replacement));
        }
      }
      return value as string;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within a LanguageProvider');
  return ctx;
}

export type { Locale };
