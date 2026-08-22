import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { SEARCH_ENGINES, TRANSLATIONS } from '../constants';

interface SearchBarProps {
    engine: keyof typeof SEARCH_ENGINES;
    language: 'en' | 'ru';
}

const SearchBar: React.FC<SearchBarProps> = ({ engine, language }) => {
  const [query, setQuery] = useState('');
  const t = TRANSLATIONS[language];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const baseUrl = SEARCH_ENGINES[engine] || SEARCH_ENGINES.google;
      window.location.href = `${baseUrl}${encodeURIComponent(query)}`;
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl px-4 relative group z-10">
      <div className="relative transform transition-all duration-500 ease-out 
                      scale-95 opacity-90
                      group-hover:scale-[0.98] group-hover:opacity-100
                      group-focus-within:scale-100 group-focus-within:opacity-100 group-focus-within:shadow-2xl">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-white/70" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="block w-full pl-14 pr-6 py-4 rounded-full 
                     text-lg text-white placeholder-[rgba(var(--theme-rgb),0.6)]
                     glass-input
                     focus:outline-none focus:ring-2 theme-ring-focus focus:bg-[rgba(var(--theme-rgb),0.1)]
                     transition-all duration-300"
          autoFocus
        />
      </div>
      <style>{`
          .theme-ring-focus:focus {
              --tw-ring-color: rgba(var(--theme-rgb), 0.5);
              --tw-ring-opacity: 1;
              box-shadow: 0 0 25px rgba(var(--theme-rgb), 0.3);
          }
      `}</style>
    </form>
  );
};

export default SearchBar;