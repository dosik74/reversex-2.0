import React, { useState, useEffect } from 'react';
import { Plus, X, Globe, Link } from 'lucide-react';
import { Bookmark } from '../types';
import { DEFAULT_BOOKMARKS, TRANSLATIONS } from '../constants';

interface BookmarkGridProps {
    language: 'en' | 'ru';
}

const BookmarkGrid: React.FC<BookmarkGridProps> = ({ language }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
        const saved = localStorage.getItem('pink_glass_bookmarks');
        return saved ? JSON.parse(saved) : DEFAULT_BOOKMARKS;
    } catch {
        return DEFAULT_BOOKMARKS;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const t = TRANSLATIONS[language];

  useEffect(() => {
    localStorage.setItem('pink_glass_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const addBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newUrl) return;
    
    let finalUrl = newUrl;
    if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
    }

    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      title: newTitle,
      url: finalUrl,
      initials: newTitle.substring(0, 2).toUpperCase(),
    };

    setBookmarks([...bookmarks, newBookmark]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewUrl('');
  };

  const removeBookmark = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  const getFaviconUrl = (url: string) => {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
        return null;
    }
  };

  return (
    <>
      {/* Speed Dial Grid Area */}
      <div className="mt-12 w-full max-w-5xl px-4 flex justify-center">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
            {bookmarks.map((b) => (
                <div key={b.id} className="group relative flex flex-col items-center">
                     <a
                        href={b.url}
                        className="flex flex-col items-center gap-3 transition-transform duration-300 group-hover:scale-105"
                    >
                        {/* Icon Box */}
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] glass-panel flex items-center justify-center relative overflow-hidden group-hover:bg-white/20 transition-all duration-300 shadow-lg group-hover:shadow-[0_0_20px_rgba(var(--theme-rgb),0.3)] border border-white/10 group-hover:border-white/30">
                             {/* Delete Button (Hover) */}
                            <button 
                                onClick={(e) => removeBookmark(e, b.id)}
                                className="absolute top-1 right-1 p-1 rounded-full bg-black/40 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all z-20"
                            >
                                <X size={12} />
                            </button>

                            <img 
                                src={getFaviconUrl(b.url) || ''} 
                                alt={b.title}
                                className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md z-10"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                            <div className="hidden w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
                                <span className="text-xl font-bold text-white/80">{b.initials}</span>
                            </div>
                            
                            {/* Glass Reflection */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                        </div>
                        
                        {/* Label */}
                        <span className="text-sm font-medium text-white/80 group-hover:text-white text-shadow-sm truncate max-w-[100px] text-center">
                            {b.title}
                        </span>
                    </a>
                </div>
            ))}

            {/* Add Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="flex flex-col items-center gap-3 group transition-transform duration-300 hover:scale-105"
            >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] border-2 border-dashed border-white/20 flex items-center justify-center 
                                group-hover:bg-white/5 group-hover:border-white/40 transition-all duration-300">
                    <Plus size={24} className="text-white/40 group-hover:text-white/80" />
                </div>
                <span className="text-sm font-medium text-white/40 group-hover:text-white/80">
                    {t.addShortcut}
                </span>
            </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl shadow-2xl transform transition-all scale-100 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Link size={20} className="theme-text-accent" />
                  {t.addShortcut}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={addBookmark} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[rgba(var(--theme-rgb),0.8)] mb-1">{t.name}</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--theme-color)] focus:ring-1 focus:ring-[var(--theme-color)] transition-all"
                  placeholder="e.g. YouTube"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[rgba(var(--theme-rgb),0.8)] mb-1">{t.url}</label>
                <input
                  type="text"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--theme-color)] focus:ring-1 focus:ring-[var(--theme-color)] transition-all"
                  placeholder="e.g. youtube.com"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl theme-bg hover:brightness-110 text-white font-medium shadow-lg transition-all hover:scale-105"
                >
                  {t.done}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BookmarkGrid;