/**
 * i18n engine — locale state, translation lookup, persistence.
 */

import type { Locale, Translations } from './types';
import { en } from './en';
import { es } from './es';
import { de } from './de';
import { fr } from './fr';
import { emit } from '../bus';

const STORAGE_KEY = 'tempo-locale';

const translations: Record<Locale, Translations> = { en, es, de, fr };

let currentLocale: Locale = loadLocale();

function loadLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in translations) return saved as Locale;
  } catch { /* ignore */ }
  return 'en';
}

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* ignore */ }
  emit('locale-changed', { locale });
}

/** Main translation lookup.  Returns the value for the given key in the current locale. */
export function t(key: keyof Translations): string {
  return translations[currentLocale][key] ?? translations.en[key] ?? key;
}

/** Get all available locales with their display labels. */
export function getLocales(): { code: Locale; label: string }[] {
  return [
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
    { code: 'de', label: 'DE' },
    { code: 'fr', label: 'FR' },
  ];
}
