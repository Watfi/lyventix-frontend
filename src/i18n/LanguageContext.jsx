import React, { createContext, useContext, useState, useCallback } from 'react';
import translations from './translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'es');

  const setLanguage = useCallback((l) => {
    setLang(l);
    localStorage.setItem('lang', l);
  }, []);

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations['es']?.[key] || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
