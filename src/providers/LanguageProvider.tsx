// src/providers/LanguageProvider.tsx

import React, { createContext, useContext, useState, useCallback } from 'react';
import translations, { LangCode, TranslationKeys } from '../i18n/translations';

type LanguageContextType = {
  language: LangCode;
  setLanguage: (code: LangCode) => void;
  t: (key: keyof TranslationKeys) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<LangCode>('en');

  const t = useCallback((key: keyof TranslationKeys): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
