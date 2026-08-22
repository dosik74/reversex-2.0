import React, { useState, useEffect, useRef } from 'react';
import { Search, History, X } from 'lucide-react';
import { SEARCH_ENGINES, TRANSLATIONS } from '../constants';

interface SearchBarProps {
    engine: keyof typeof SEARCH_ENGINES;
    language: 'en' | 'ru';
}

const SearchBar: React.FC<SearchBarProps> = ({ engine, language }) => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const t = TRANSLATIONS[language];
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
    
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveHistory = (newHistory: string[]) => {
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const addToHistory = (term: string) => {
    const filtered = history.filter(h => h !== term);
    const newHistory = [term, ...filtered].slice(0, 8); // Keep last 8
    saveHistory(newHistory);
  };

  const removeFromHistory = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h !== term);
    saveHistory(newHistory);
  };

  const handleSearch = (e?: React.FormEvent, searchTerm?: string) => {
    if (e) e.preventDefault();
    const finalQuery = searchTerm || query;
    if (finalQuery.trim()) {
      addToHistory(finalQuery.trim());
      const baseUrl = SEARCH_ENGINES[engine] || SEARCH_ENGINES.google;
      window.location.href = `${baseUrl}${encodeURIComponent(finalQuery)}`;
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSearch} className="w-full max-w-2xl px-4 relative group z-10">
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
          onFocus={() => setIsFocused(true)}
          placeholder={t.searchPlaceholder}
          className={`block w-full pl-14 pr-6 py-4 
                     text-lg text-white placeholder-[rgba(var(--theme-rgb),0.6)]
                     glass-input
                     focus:outline-none focus:ring-2 theme-ring-focus focus:bg-[rgba(var(--theme-rgb),0.1)]
                     transition-all duration-300
                     ${isFocused && history.length > 0 ? 'rounded-t-3xl rounded-b-none border-b-0' : 'rounded-full'}`}
          autoFocus
        />
        
        {isFocused && history.length > 0 && (
          <div className="absolute top-full left-0 w-full glass-input border-t-0 rounded-b-3xl overflow-hidden shadow-2xl z-20">
            {history.map((item, index) => (
              <div 
                key={index}
                onClick={() => handleSearch(undefined, item)}
                className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4 text-white/80">
                  <History className="h-4 w-4 opacity-50" />
                  <span>{item}</span>
                </div>
                <button 
                  type="button"
                  onClick={(e) => removeFromHistory(e, item)}
                  className="p-1 rounded-full hover:bg-white/20 text-white/50 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
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