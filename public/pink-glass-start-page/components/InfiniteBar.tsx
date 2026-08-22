import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Globe, Star } from 'lucide-react';
import { Bookmark } from '../types';
import { TRANSLATIONS } from '../constants';

interface InfiniteBarProps {
    language: 'en' | 'ru';
}

const DEFAULT_TOP_LINKS: Bookmark[] = [
    { id: 't1', title: 'News', url: 'https://news.google.com', initials: 'N' },
    { id: 't2', title: 'Twitter', url: 'https://twitter.com', initials: 'X' },
    { id: 't3', title: 'Instagram', url: 'https://instagram.com', initials: 'IG' },
];

const InfiniteBar: React.FC<InfiniteBarProps> = ({ language }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
        const saved = localStorage.getItem('pink_glass_top_bar');
        return saved ? JSON.parse(saved) : DEFAULT_TOP_LINKS;
    } catch {
        return DEFAULT_TOP_LINKS;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isActive, setIsActive] = useState(false);
  const t = TRANSLATIONS[language];

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const velocity = useRef(0);
  const lastX = useRef(0);
  const rafId = useRef<number | null>(null);
  const [hasMoved, setHasMoved] = useState(false);

  useEffect(() => {
    localStorage.setItem('pink_glass_top_bar', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // --- Momentum Scrolling Logic ---
  const stopMomentum = () => {
    if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    setIsActive(true);
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
    lastX.current = e.pageX;
    velocity.current = 0;
    setHasMoved(false);
    stopMomentum();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current);
    scrollRef.current.scrollLeft = scrollLeft.current - walk;

    const delta = e.pageX - lastX.current;
    velocity.current = delta; 
    lastX.current = e.pageX;

    if (Math.abs(walk) > 5) {
        setHasMoved(true);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    setIsActive(false);
    startMomentum();
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    setIsActive(false);
    startMomentum();
  };

  const startMomentum = () => {
    stopMomentum();
    if (Math.abs(velocity.current) < 1) return;

    const momentumLoop = () => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollLeft -= velocity.current * 1.5;
        velocity.current *= 0.96;

        if (Math.abs(velocity.current) > 0.5) {
            rafId.current = requestAnimationFrame(momentumLoop);
        } else {
            stopMomentum();
        }
    };
    rafId.current = requestAnimationFrame(momentumLoop);
  };

  const handleWheel = (e: React.WheelEvent) => {
    stopMomentum();
    if (scrollRef.current) {
        scrollRef.current.scrollLeft += e.deltaY * 0.5;
    }
  };

  // --- CRUD ---

  const addBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newUrl) return;
    let finalUrl = newUrl;
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;

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
    setTimeout(() => {
        if(scrollRef.current) {
            scrollRef.current.scrollTo({ left: scrollRef.current.scrollWidth, behavior: 'smooth' });
        }
    }, 100);
  };

  const removeBookmark = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  const getFaviconUrl = (url: string) => {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch { return null; }
  };

  return (
    <>
      {/* Fixed Top Bar - Reduced Height to h-10 (40px) */}
      <div 
        className="fixed top-0 left-0 w-full h-10 z-[100] border-b border-white/5 shadow-sm select-none"
        style={{
            background: 'rgba(var(--theme-rgb), 0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
        }}
      >
          <div 
              ref={scrollRef}
              className={`w-full h-full flex items-center gap-2 px-4 overflow-x-auto cursor-grab active:cursor-grabbing custom-scrollbar-hide 
                         transition-transform duration-200 ease-out origin-center ${isActive ? 'scale-[0.995]' : 'scale-100'}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onWheel={handleWheel}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
              {bookmarks.map((b) => (
                  <a
                      key={b.id}
                      href={b.url}
                      onClick={(e) => hasMoved && e.preventDefault()}
                      draggable={false}
                      className="group relative flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-200 shrink-0
                                 hover:bg-white/10 active:scale-95 border border-transparent hover:border-white/5"
                  >
                      {/* Hover delete */}
                      <button 
                          onClick={(e) => removeBookmark(e, b.id)}
                          className="absolute -top-0.5 -right-0.5 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 scale-75 hover:scale-110"
                      >
                          <X size={8} />
                      </button>

                      {/* Icon */}
                      <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          <img 
                              src={getFaviconUrl(b.url) || ''} 
                              alt="" 
                              className="w-3.5 h-3.5 object-contain"
                              onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                          />
                          <div className="hidden w-3.5 h-3.5 flex items-center justify-center">
                              <Globe size={12} className="text-white/80"/>
                          </div>
                      </div>
                      
                      {/* Title */}
                      <span className="text-[11px] font-medium text-white/80 whitespace-nowrap group-hover:text-white drop-shadow-sm transition-colors">
                          {b.title}
                      </span>
                  </a>
              ))}

              <button
                  onClick={() => !hasMoved && setIsModalOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 shrink-0
                             hover:bg-white/10 text-white/50 hover:text-white border border-transparent hover:border-white/5 group"
              >
                  <Plus size={12} className="group-hover:rotate-90 transition-transform"/>
              </button>
              
              {/* Spacer */}
              <div className="w-8 shrink-0" />
          </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm glass-panel p-5 rounded-3xl shadow-2xl transform transition-all scale-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Star size={16} className="theme-text-accent" />
                  {t.addShortcut}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={addBookmark} className="space-y-4">
              <input
                type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--theme-color)]"
                placeholder={t.name} autoFocus
              />
              <input
                type="text" required value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--theme-color)]"
                placeholder={t.url}
              />
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 text-sm">{t.cancel}</button>
                <button type="submit" className="px-5 py-2 rounded-lg theme-bg hover:brightness-110 text-white font-medium shadow-lg text-sm">{t.done}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default InfiniteBar;