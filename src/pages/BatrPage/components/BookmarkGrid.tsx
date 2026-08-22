import React, { useState } from 'react';
import { Plus, X, Link } from 'lucide-react';
import { Bookmark } from '../types';
import { TRANSLATIONS } from '../constants';
import { useGlobal } from '../context/GlobalContext';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import SortableBookmark from './SortableBookmark';
import EditBookmarkModal from './EditBookmarkModal';
import { AnimatePresence } from 'framer-motion';

interface BookmarkGridProps {
    language: 'en' | 'ru';
}

const BookmarkGrid: React.FC<BookmarkGridProps> = ({ language }) => {
  const { bookmarks, setBookmarks, updateBookmark } = useGlobal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const t = TRANSLATIONS[language];

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

  const removeBookmark = (id: string) => {
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  return (
    <>
      {/* Speed Dial Grid Area */}
      <div className="mt-12 w-full max-w-5xl px-4 flex justify-center">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
            <SortableContext items={bookmarks.map(b => b.id)} strategy={rectSortingStrategy}>
                {bookmarks.map((b) => (
                    <SortableBookmark 
                        key={b.id} 
                        bookmark={b} 
                        variant="card" 
                        onRemove={removeBookmark}
                        onEdit={(bookmark) => setEditingBookmark(bookmark)} 
                    />
                ))}
            </SortableContext>

            {/* Add Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="flex flex-col items-center gap-3 group transition-transform duration-300 hover:scale-105"
            >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] border-2 border-dashed border-white/20 flex items-center justify-center 
                                group-hover:bg-white/5 group-hover:border-white/40 transition-all duration-300">
                    <Plus size={24} className="text-white/40 group-hover:text-white/80" />
                </div>
            </button>
        </div>
      </div>

      {/* Add Modal */}
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

      {/* Edit Modal with Animation */}
      <AnimatePresence>
        {editingBookmark && (
            <EditBookmarkModal 
                key="edit-modal"
                bookmark={editingBookmark} 
                onClose={() => setEditingBookmark(null)}
                onSave={updateBookmark}
            />
        )}
      </AnimatePresence>
    </>
  );
};

export default BookmarkGrid;