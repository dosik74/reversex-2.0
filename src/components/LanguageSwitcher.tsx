import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const current = i18n.language || 'ru';

  const changeLang = async (lng: string) => {
    await i18n.changeLanguage(lng);
    localStorage.setItem('lng', lng);
  };

  return (
    <Select value={current} onValueChange={changeLang}>
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
