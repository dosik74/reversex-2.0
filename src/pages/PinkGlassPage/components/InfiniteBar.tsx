import React, { useState, useRef } from 'react';
import { Plus, Star, X } from 'lucide-react';
import { Bookmark } from '../types';
import { TRANSLATIONS } from '../constants';
import { useGlobal } from '../context/GlobalContext';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import SortableBookmark from './SortableBookmark';
import EditBookmarkModal from './EditBookmarkModal';
import { AnimatePresence } from 'framer-motion';

interface InfiniteBarProps {
    language: 'en' | 'ru';
}

const InfiniteBar: React.FC<InfiniteBarProps> = ({ language }) => {
  const { topLinks: bookmarks, setTopLinks: setBookmarks, updateBookmark } = useGlobal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const t = TRANSLATIONS[language];

  // We need to keep the scroll ref for visual scrolling, but we need to ensure it doesn't break drag.
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Custom simple horizontal scroll handling that cooperates with DnD
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
        scrollRef.current.scrollLeft += e.deltaY * 0.5;
    }
  };

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
  };

  const removeBookmark = (id: string) => {
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  return (
    <>
      {/* Droppable ID 'top-bar' is used in App.tsx to identify this zone */}
      <div 
        className="fixed top-0 left-0 w-full h-12 z-[100] border-b border-white/5 shadow-sm select-none"
        style={{
            background: 'rgba(var(--theme-rgb), 0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
        }}
      >
          <div 
              ref={scrollRef}
              onWheel={handleWheel}
              className="w-full h-full flex items-center gap-2 px-4 overflow-x-auto custom-scrollbar pb-1"
          >
              <SortableContext items={bookmarks.map(b => b.id)} strategy={horizontalListSortingStrategy}>
                  {bookmarks.map((b) => (
                      <SortableBookmark 
                        key={b.id} 
                        bookmark={b} 
                        variant="pill" 
                        onRemove={removeBookmark} 
                        onEdit={(bookmark) => setEditingBookmark(bookmark)}
                      />
                  ))}
              </SortableContext>

              <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 shrink-0
                             hover:bg-white/10 text-white/50 hover:text-white border border-transparent hover:border-white/5 group"
              >
                  <Plus size={12} className="group-hover:rotate-90 transition-transform"/>
              </button>
              
              <div className="w-8 shrink-0" />
          </div>
      </div>

      {/* Add Modal */}
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

      {/* Edit Modal with Animation */}
      <AnimatePresence>
        {editingBookmark && (
            <EditBookmarkModal 
                key="edit-modal-top"
                bookmark={editingBookmark} 
                onClose={() => setEditingBookmark(null)}
                onSave={updateBookmark}
            />
        )}
      </AnimatePresence>
    </>
  );
};

export default InfiniteBar;