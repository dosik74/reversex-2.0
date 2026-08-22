import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Globe, Pencil } from 'lucide-react';
import { Bookmark } from '../types';

interface SortableBookmarkProps {
  bookmark: Bookmark;
  variant: 'pill' | 'card';
  onRemove: (id: string) => void;
  onEdit?: (bookmark: Bookmark) => void;
  isOverlay?: boolean;
}

const SortableBookmark: React.FC<SortableBookmarkProps> = ({ bookmark, variant, onRemove, onEdit, isOverlay }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: bookmark.id,
    data: {
      type: 'bookmark',
      bookmark,
      originZone: variant === 'pill' ? 'top' : 'center'
    },
    disabled: isOverlay
  });

  const style: React.CSSProperties = {
    // CRITICAL FIX: Ensure transform is stringified correctly
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 'auto',
    // CRITICAL FIX: Prevent browser scrolling/gestures while dragging
    touchAction: 'none', 
    position: 'relative',
  };

  const getFaviconUrl = (url: string, size: number) => {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
    } catch { return null; }
  };

  // Logic to determine icon source: Custom > Google Favicon > Fallback Globe
  const iconSrc = bookmark.customIconUrl || getFaviconUrl(bookmark.url, variant === 'pill' ? 32 : 64);

  // --- Variant: TOP BAR PILL ---
  if (variant === 'pill') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={(e) => {
            if (!isDragging && !isOverlay && !(e.target as HTMLElement).closest('button')) {
                window.location.href = bookmark.url;
            }
        }}
        className={`group relative flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-200 shrink-0
                   cursor-grab active:cursor-grabbing border border-transparent 
                   ${isOverlay ? 'bg-white/20 border-white/30 scale-105 shadow-xl' : 'hover:bg-white/10 hover:border-white/5'}`}
      >
        {!isOverlay && (
             <>
                 {/* Delete Button (Top Right) */}
                 <button 
                    onPointerDown={(e) => { e.stopPropagation(); onRemove(bookmark.id); }}
                    className="absolute -top-1 -right-1 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 scale-75 hover:scale-110"
                    title="Remove"
                >
                    <X size={8} />
                </button>
                
                {/* Edit Button (Top Left) */}
                <button 
                    onPointerDown={(e) => { e.stopPropagation(); if (onEdit) onEdit(bookmark); }}
                    className="absolute -top-1 -left-1 p-0.5 rounded-full bg-white text-black opacity-0 group-hover:opacity-100 transition-opacity z-20 scale-75 hover:scale-110"
                    title="Edit"
                >
                    <Pencil size={8} />
                </button>
            </>
        )}

        <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            <img 
                src={iconSrc || undefined} 
                alt="" 
                draggable={false} // Prevent native drag conflict
                className="w-3.5 h-3.5 object-contain pointer-events-none"
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
            />
            <div className="hidden w-3.5 h-3.5 flex items-center justify-center">
                <Globe size={12} className="text-white/80"/>
            </div>
        </div>
        
        <a 
          href={bookmark.url} 
          draggable={false} // Prevent native drag conflict
          onClick={(e) => { if(isDragging || isOverlay) e.preventDefault(); e.stopPropagation(); }} 
          className="text-[11px] font-medium text-white/80 whitespace-nowrap group-hover:text-white drop-shadow-sm transition-colors"
        >
            {bookmark.title}
        </a>
      </div>
    );
  }

  // --- Variant: CENTER GRID CARD ---
  return (
    <div 
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={(e) => {
            if (!isDragging && !isOverlay && !(e.target as HTMLElement).closest('button')) {
                window.location.href = bookmark.url;
            }
        }}
        className={`group relative flex flex-col items-center cursor-grab active:cursor-grabbing ${isOverlay ? 'scale-110 z-50' : ''}`}
    >
        <div className="flex flex-col items-center gap-3 transition-transform duration-300 group-hover:scale-105">
            {/* Icon Box */}
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[2rem] glass-panel flex items-center justify-center relative overflow-hidden transition-all duration-300 shadow-lg border border-white/10
                            ${isOverlay ? 'bg-white/20 border-white/40 shadow-2xl' : 'group-hover:bg-white/20 group-hover:shadow-[0_0_20px_rgba(var(--theme-rgb),0.3)] group-hover:border-white/30'}`}>
                
                {!isOverlay && (
                    <>
                        {/* Delete Button */}
                        <button 
                            onPointerDown={(e) => { e.stopPropagation(); onRemove(bookmark.id); }}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/40 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all z-20"
                            title="Remove"
                        >
                            <X size={12} />
                        </button>

                         {/* Edit Button */}
                         <button 
                            onPointerDown={(e) => { e.stopPropagation(); if (onEdit) onEdit(bookmark); }}
                            className="absolute top-1 left-1 p-1 rounded-full bg-black/40 hover:bg-white hover:text-black text-white opacity-0 group-hover:opacity-100 transition-all z-20"
                            title="Edit"
                        >
                            <Pencil size={12} />
                        </button>
                    </>
                )}

                <img 
                    src={iconSrc || undefined} 
                    alt={bookmark.title}
                    draggable={false} // Prevent native drag conflict
                    className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md z-10 pointer-events-none"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                />
                <div className="hidden w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
                    <span className="text-xl font-bold text-white/80">{bookmark.initials}</span>
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
            </div>
            
            <a 
              href={bookmark.url} 
              draggable={false} // Prevent native drag conflict
              onClick={(e) => { if(isDragging || isOverlay) e.preventDefault(); e.stopPropagation(); }} 
              className="text-sm font-medium text-white/80 group-hover:text-white text-shadow-sm truncate max-w-[100px] text-center"
            >
                {bookmark.title}
            </a>
        </div>
    </div>
  );
};

export default SortableBookmark;