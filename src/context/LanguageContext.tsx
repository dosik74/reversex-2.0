import { createContext, useContext, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState(i18n.language || "ru");

  useEffect(() => {
    const storedLang = localStorage.getItem("language") || "ru";
    setLanguageState(storedLang);
    i18n.changeLanguage(storedLang);
  }, [i18n]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    i18n.changeLanguage(lang);
  };

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
