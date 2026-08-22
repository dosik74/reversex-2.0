import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const isOpen = isFocused && history.length > 0;
  const portalRoot = useMemo(() => (typeof document !== 'undefined' ? document.body : null), []);

  useEffect(() => {
    const saved = localStorage.getItem('batr_searchHistory');
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

  useEffect(() => {
    if (!isFocused) return;

    const update = () => {
      const el = inputRef.current;
      if (!el) return;
      setAnchorRect(el.getBoundingClientRect());
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFocused(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFocused]);

  const saveHistory = (newHistory: string[]) => {
    setHistory(newHistory);
    localStorage.setItem('batr_searchHistory', JSON.stringify(newHistory));
  };

  const addToHistory = (term: string) => {
    const filtered = history.filter(h => h !== term);
    const newHistory = [term, ...filtered].slice(0, 8);
    saveHistory(newHistory);
  };

  const removeFromHistory = (e: { stopPropagation: () => void }, term: string) => {
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
    <>
      {isOpen && anchorRect && portalRoot && createPortal(
        <div
          style={{
            position: 'fixed',
            left: anchorRect.left,
            top: anchorRect.bottom - 8,
            width: anchorRect.width,
            marginTop: 0,
            zIndex: 1001,
          }}
        >
          <div
            className="glass-input rounded-3xl overflow-hidden shadow-2xl"
            style={{
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              background: '#0b0b12',
              borderColor: 'rgba(255,255,255,0.14)',
            }}
          >
            {history.map((item, index) => (
              <div
                key={index}
                onMouseDown={() => handleSearch(undefined, item)}
                className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4 text-white/80">
                  <History className="h-4 w-4 opacity-50" />
                  <span>{item}</span>
                </div>
                <button
                  type="button"
                  onMouseDown={(e) => removeFromHistory(e, item)}
                  className="p-1 rounded-full hover:bg-white/20 text-white/50 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>,
        portalRoot
      )}

      <form
        ref={formRef}
        onSubmit={handleSearch}
        className={`w-full max-w-2xl px-4 relative group ${isFocused ? 'z-[1000]' : 'z-10'}`}
      >
      <div className="relative transform transition-all duration-500 ease-out 
                      scale-95 opacity-90
                      group-hover:scale-[0.98] group-hover:opacity-100
                      group-focus-within:scale-100 group-focus-within:opacity-100 group-focus-within:shadow-2xl">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-white/70" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            const el = inputRef.current;
            if (el) setAnchorRect(el.getBoundingClientRect());
          }}
          placeholder={t.searchPlaceholder}
          className={`block w-full pl-14 pr-6 py-4
                     text-lg text-white placeholder-[rgba(var(--theme-rgb),0.6)]
                     glass-input
                     focus:outline-none focus:ring-2 theme-ring-focus focus:bg-[rgba(var(--theme-rgb),0.1)]
                     transition-all duration-300
                     rounded-full`}
          style={{
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            background: '#0b0b12',
            borderColor: 'rgba(255,255,255,0.14)',
          }}
          autoFocus
        />

        {/* Dropdown is rendered in a portal so it's always above bookmarks */}
      </div>
      <style>{`
          .theme-ring-focus:focus {
              --tw-ring-color: rgba(var(--theme-rgb), 0.5);
              --tw-ring-opacity: 1;
              box-shadow: 0 0 25px rgba(var(--theme-rgb), 0.3);
          }
      `}</style>
    </form>
    </>
  );
};

export default SearchBar;