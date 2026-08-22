import React from 'react';
import { TRANSLATIONS } from '../constants';

interface TopNavProps {
    language: 'en' | 'ru';
}

const TopNav: React.FC<TopNavProps> = ({ language }) => {
  const t = TRANSLATIONS[language];
  return (
    <nav className="flex items-center gap-4 text-[13px] font-medium text-white/90 mr-1">
      <a href="https://mail.google.com" className="hover:underline hover:text-white transition-colors">{t.gmail}</a>
      <a href="https://www.google.com/imghp" className="hover:underline hover:text-white transition-colors">{t.images}</a>
    </nav>
  );
};

export default TopNav;