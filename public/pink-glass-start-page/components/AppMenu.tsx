import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { INITIAL_FAVORITES, INITIAL_OTHERS, ALL_APPS, TRANSLATIONS } from '../constants';
import { AppItem } from '../types';

interface AppMenuProps {
    language: 'en' | 'ru';
}

const AppMenu: React.FC<AppMenuProps> = ({ language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language];
  
  const hydrateApps = (items: any[]): AppItem[] => {
    return items.map(savedItem => {
        const original = ALL_APPS.find(a => a.id === savedItem.id);
        return original || null;
    }).filter((item): item is AppItem => item !== null);
  };

  const [favorites, setFavorites] = useState<AppItem[]>(() => {
    try {
        const saved = localStorage.getItem('pink_glass_favorites');
        return saved ? hydrateApps(JSON.parse(saved)) : INITIAL_FAVORITES;
    } catch { return INITIAL_FAVORITES; }
  });

  const [others, setOthers] = useState<AppItem[]>(() => {
    try {
        const saved = localStorage.getItem('pink_glass_others');
        return saved ? hydrateApps(JSON.parse(saved)) : INITIAL_OTHERS;
    } catch { return INITIAL_OTHERS; }
  });

  useEffect(() => {
    const replacer = (key: string, value: any) => {
        if (key === 'icon') return undefined;
        return value;
    };
    localStorage.setItem('pink_glass_favorites', JSON.stringify(favorites, replacer));
    localStorage.setItem('pink_glass_others', JSON.stringify(others, replacer));
  }, [favorites, others]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDragStart = (e: React.DragEvent, id: string, source: 'favorites' | 'others') => {
    e.dataTransfer.setData('appId', id);
    e.dataTransfer.setData('sourceGroup', source);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetGroup: 'favorites' | 'others') => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('appId');
    const sourceGroup = e.dataTransfer.getData('sourceGroup') as 'favorites' | 'others';

    if (!appId || !sourceGroup) return;

    const sourceList = sourceGroup === 'favorites' ? [...favorites] : [...others];
    const itemIndex = sourceList.findIndex(i => i.id === appId);
    if (itemIndex === -1) return;
    
    const itemToMove = sourceList[itemIndex];
    const dropTarget = (e.target as HTMLElement).closest('[data-app-id]');
    let insertIndex: number;
    const targetList = targetGroup === 'favorites' ? [...favorites] : [...others];

    if (dropTarget) {
        const targetId = dropTarget.getAttribute('data-app-id');
        const targetIndex = targetList.findIndex(i => i.id === targetId);
        const rect = dropTarget.getBoundingClientRect();
        const offset = e.clientY - rect.top;
        if (offset > rect.height / 2) {
            insertIndex = targetIndex + 1;
        } else {
            insertIndex = targetIndex;
        }
    } else {
        insertIndex = targetList.length;
    }

    if (sourceGroup === targetGroup) {
        const newList = [...sourceList];
        newList.splice(itemIndex, 1);
        const adjustedInsert = (itemIndex < insertIndex) ? insertIndex - 1 : insertIndex;
        newList.splice(adjustedInsert, 0, itemToMove);
        if (sourceGroup === 'favorites') setFavorites(newList);
        else setOthers(newList);
    } else {
        const newSourceList = sourceList.filter(i => i.id !== appId);
        const newTargetList = targetGroup === 'favorites' ? [...favorites] : [...others];
        newTargetList.splice(insertIndex, 0, itemToMove);

        if (sourceGroup === 'favorites') setFavorites(newSourceList);
        else setOthers(newSourceList);

        if (targetGroup === 'favorites') setFavorites(newTargetList);
        else setOthers(newTargetList);
    }
  };

  const renderAppItem = (app: AppItem, source: 'favorites' | 'others') => (
    <div
      key={app.id}
      data-app-id={app.id}
      draggable
      onDragStart={(e) => handleDragStart(e, app.id, source)}
      className="flex flex-col items-center justify-center p-3 rounded-2xl
                 glass-hover transition-all duration-200 cursor-move
                 group relative active:scale-95 active:opacity-80"
    >
        <a href={app.url} 
           onClick={(e) => { if(isOpen) e.stopPropagation(); }} 
           className="flex flex-col items-center w-full h-full text-decoration-none pointer-events-none" 
           style={{ pointerEvents: 'auto' }} 
        >
            <div className="mb-2 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                {app.icon}
            </div>
            <span className="text-sm text-white/90 group-hover:text-white font-light tracking-wide truncate max-w-[80px]">
                {app.name}
            </span>
        </a>
    </div>
  );

  return (
    <div className="relative z-50" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-full transition-all duration-300 group ${
          isOpen 
            ? 'theme-bg-accent' 
            : 'hover:bg-white/10'
        }`}
        aria-label="Google Apps"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white opacity-90 group-hover:opacity-100" fill="currentColor">
          <path d="M6,8c1.1,0,2-0.9,2-2s-0.9-2-2-2S4,4.9,4,6S4.9,8,6,8z M12,8c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S10.9,8,12,8z M18,8c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S16.9,8,18,8z M6,14c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S4.9,14,6,14z M12,14c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S10.9,14,12,14z M18,14c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S16.9,14,18,14z M6,20c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S4.9,20,6,20z M12,20c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S10.9,20,12,20z M18,20c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S16.9,20,18,20z"/>
        </svg>
      </button>

      <div
        className={`
            absolute top-16 right-0 w-[340px] rounded-3xl
            glass-panel
            transform origin-top-right transition-all duration-300 ease-out z-50
            overflow-hidden flex flex-col
            ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-90 -translate-y-8 invisible pointer-events-none'}
        `}
      >
        <div className="p-4 bg-black/10 border-b theme-border flex justify-between items-center">
            <h3 className="text-white font-medium text-lg tracking-wide pl-2">{t.googleApps}</h3>
             <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar max-h-[70vh] p-4 space-y-6">
            <div 
                className="bg-black/10 rounded-2xl p-2 min-h-[110px] border border-white/5 transition-colors hover:bg-black/20"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'favorites')}
            >
                <div className="grid grid-cols-3 gap-2">
                    {favorites.map((app) => renderAppItem(app, 'favorites'))}
                </div>
                {favorites.length === 0 && (
                    <div className="text-center text-white/30 text-xs py-8 pointer-events-none">{t.dropFavorites}</div>
                )}
            </div>

            <div 
                className="bg-black/10 rounded-2xl p-2 min-h-[100px] border border-white/5 transition-colors hover:bg-black/20"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'others')}
            >
                <h4 className="text-xs font-semibold theme-text-accent uppercase tracking-widest mb-3 pl-2 mt-1 pointer-events-none">{t.moreApps}</h4>
                <div className="grid grid-cols-3 gap-2">
                    {others.map((app) => renderAppItem(app, 'others'))}
                </div>
            </div>
        </div>
        
        <div className="bg-black/20 p-3 text-center border-t theme-border">
            <a href="https://about.google/products/" className="text-xs theme-text-accent hover:text-white transition-colors">
                {t.moreFromGoogle}
            </a>
        </div>
      </div>
    </div>
  );
};

export default AppMenu;