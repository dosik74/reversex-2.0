import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/context/LanguageContext';
import { persistLng } from '@/i18n/config';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  // Может рендериться вне LanguageProvider (например, на /auth до провайдера) —
  // тогда работаем напрямую с i18n, но пишем в тот же единый ключ.
  let lang = i18n.language || 'ru';
  let setLang: ((lng: string) => void) | null = null;
  try {
    const ctx = useLanguage();
    lang = ctx.language;
    setLang = ctx.setLanguage;
  } catch {
    /* вне провайдера — fallback ниже */
  }

  const changeLang = async (lng: string) => {
    if (setLang) {
      setLang(lng);
    } else {
      await i18n.changeLanguage(lng);
      persistLng(lng);
    }
  };

  return (
    <Select value={lang} onValueChange={changeLang}>
      <SelectTrigger className="w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ru">Русский</SelectItem>
        <SelectItem value="kk">Қазақша</SelectItem>
        <SelectItem value="en">English</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default LanguageSwitcher;
