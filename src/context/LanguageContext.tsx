import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { LANG_KEY, SUPPORTED_LANGS, persistLng } from "@/i18n/config";

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const normalize = (lng: string) => {
  const base = (lng || "ru").split("-")[0].toLowerCase();
  return (SUPPORTED_LANGS as readonly string[]).includes(base) ? base : "ru";
};

export const LanguageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState(() => normalize(i18n.language || "ru"));

  // Старт: единый ключ. Подхватываем 'language' только как миграцию.
  useEffect(() => {
    const stored =
      localStorage.getItem(LANG_KEY) || localStorage.getItem("language") || "ru";
    const lng = normalize(stored);
    setLanguageState(lng);
    if (i18n.language !== lng) i18n.changeLanguage(lng);
    persistLng(lng);
  }, [i18n]);

  // Если язык поменяли напрямую через i18n (например, LanguageSwitcher раньше) — синхронизируем стейт
  useEffect(() => {
    const onChanged = (lng: string) => setLanguageState(normalize(lng));
    i18n.on("languageChanged", onChanged);
    return () => i18n.off("languageChanged", onChanged);
  }, [i18n]);

  const setLanguage = useCallback(
    (lang: string) => {
      const lng = normalize(lang);
      setLanguageState(lng);
      persistLng(lng);
      if (i18n.language !== lng) i18n.changeLanguage(lng);
    },
    [i18n]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
