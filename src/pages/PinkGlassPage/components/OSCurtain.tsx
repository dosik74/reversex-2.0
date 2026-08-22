import React, { useState, useEffect, useRef } from 'react';
import { X, Folder, Plus, Globe, ChevronRight, LayoutGrid, List, Settings2, Trash2, Edit2, Check, Download, Upload } from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

interface FolderItem {
  id: string;
  name: string;
  links: LinkItem[];
}

interface OSCurtainProps {
  isOpen: boolean;
  onClose: () => void;
}

// Sortable Link Item Component
const SortableLink = ({ 
  link, 
  viewMode, 
  isEditMode, 
  editingLinkId, 
  editingLinkTitle, 
  editingLinkUrl, 
  setEditingLinkTitle, 
  setEditingLinkUrl, 
  handleSaveEditLink, 
  handleEditLink, 
  handleDeleteLink,
  folderId
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative group/card h-full ${isDragging ? 'scale-105' : ''}`}>
      {editingLinkId === link.id ? (
        <div className={`bg-black/60 border border-[var(--theme-color)] rounded-2xl p-4 flex flex-col gap-3 ${viewMode === 'list' ? 'flex-row items-center' : ''}`}>
          <input
            type="text"
            value={editingLinkTitle}
            onChange={(e) => setEditingLinkTitle(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            placeholder="Название"
          />
          <input
            type="text"
            value={editingLinkUrl}
            onChange={(e) => setEditingLinkUrl(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            placeholder="URL"
          />
          <button onClick={(e) => handleSaveEditLink(folderId, link.id, e)} className="bg-[var(--theme-color)] text-white px-3 py-2 rounded-lg text-sm font-medium w-full mt-2">
            Сохранить
          </button>
        </div>
      ) : (
        <a
          href={isEditMode ? undefined : link.url}
          target={isEditMode ? undefined : "_blank"}
          rel="noopener noreferrer"
          onClick={(e) => isEditMode && e.preventDefault()}
          {...(isEditMode ? { ...attributes, ...listeners } : {})}
          className={`group block bg-white/5 border border-white/5 hover:border-[var(--theme-color)]/50 rounded-2xl transition-all hover:bg-white/10 hover:shadow-xl hover:shadow-[var(--theme-color)]/10 h-full ${viewMode === 'grid' ? 'p-6 flex flex-col items-center text-center hover:-translate-y-1' : 'p-4 flex items-center gap-5'} ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
          <div className={`relative rounded-2xl bg-black/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner ${viewMode === 'grid' ? 'w-20 h-20 mb-5' : 'w-12 h-12 shrink-0'}`}>
            <img 
              src={`https://icon.horse/icon/${new URL(link.url).hostname}`}
              alt={link.title}
              className={`${viewMode === 'grid' ? 'w-10 h-10' : 'w-6 h-6'} rounded-md drop-shadow-md`}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
            <Globe size={viewMode === 'grid' ? 32 : 20} className="hidden text-white/30" />
          </div>
          <div className={`${viewMode === 'list' ? 'flex-1 min-w-0' : 'w-full'}`}>
            <h3 className="text-white/90 font-medium truncate w-full text-base group-hover:text-white transition-colors">{link.title}</h3>
            {viewMode === 'list' && <p className="text-white/40 text-sm truncate w-full mt-1">{link.url}</p>}
          </div>
          
          {viewMode === 'list' && !isEditMode && <ChevronRight size={18} className="text-white/20 group-hover:text-[var(--theme-color)] transition-colors shrink-0" />}
          
          {isEditMode && (
            <div className="absolute top-3 right-3 flex flex-col gap-2 z-10" onPointerDown={e => e.stopPropagation()}>
              <button 
                onClick={(e) => handleEditLink(link, e)}
                className="p-2 rounded-xl bg-black/60 hover:bg-white/20 text-white/70 hover:text-white transition-colors shadow-lg backdrop-blur-md"
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={(e) => handleDeleteLink(folderId, link.id, e)}
                className="p-2 rounded-xl bg-black/60 hover:bg-red-500/90 text-white/70 hover:text-white transition-colors shadow-lg backdrop-blur-md"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </a>
      )}
    </div>
  );
};

const OSCurtain: React.FC<OSCurtainProps> = ({ isOpen, onClose }) => {
  const [folders, setFolders] = useState<FolderItem[]>(() => {
    const saved = localStorage.getItem('reversex_os_folders');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: '1',
        name: 'Мои',
        links: [
          { id: '1-1', title: 'Google', url: 'https://google.com' },
          { id: '1-2', title: 'YouTube', url: 'https://youtube.com' },
        ],
      },
      {
        id: '2',
        name: 'Работа',
        links: [
          { id: '2-1', title: 'GitHub', url: 'https://github.com' },
        ],
      },
    ];
  });

  const [activeFolderId, setActiveFolderId] = useState<string>(folders[0]?.id || '1');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const [showSettings, setShowSettings] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Edit states
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editingLinkTitle, setEditingLinkTitle] = useState('');
  const [editingLinkUrl, setEditingLinkUrl] = useState('');

  const [curtainTheme, setCurtainTheme] = useState(() => {
    const saved = localStorage.getItem('reversex_os_theme');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      gradient: 'bg-black/80',
      font: 'font-sans',
      animation: 'duration-700',
    };
  });

  useEffect(() => {
    localStorage.setItem('reversex_os_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('reversex_os_theme', JSON.stringify(curtainTheme));
  }, [curtainTheme]);

  const activeFolder = folders.find((f) => f.id === activeFolderId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    const data = JSON.stringify({ folders, curtainTheme }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workspace_settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.folders) setFolders(parsed.folders);
          if (parsed.curtainTheme) setCurtainTheme(parsed.curtainTheme);
        } catch (error) {
          alert('Ошибка при чтении файла');
        }
      };
      reader.readAsText(file);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (activeFolder && over && active.id !== over.id) {
      setFolders((prevFolders) => {
        return prevFolders.map((folder) => {
          if (folder.id === activeFolderId) {
            const oldIndex = folder.links.findIndex((l) => l.id === active.id);
            const newIndex = folder.links.findIndex((l) => l.id === over.id);
            return {
              ...folder,
              links: arrayMove(folder.links, oldIndex, newIndex),
            };
          }
          return folder;
        });
      });
    }
  };

  const handleDeleteFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFolders(folders.filter(f => f.id !== id));
    if (activeFolderId === id) setActiveFolderId(folders[0]?.id || '');
  };

  const handleEditFolder = (folder: FolderItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  };

  const handleSaveEditFolder = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingFolderName.trim()) {
      setFolders(folders.map(f => f.id === id ? { ...f, name: editingFolderName.trim() } : f));
    }
    setEditingFolderId(null);
  };

  const handleDeleteLink = (folderId: string, linkId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFolders(folders.map(f => f.id === folderId ? { ...f, links: f.links.filter(l => l.id !== linkId) } : f));
  };

  const handleEditLink = (link: LinkItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingLinkId(link.id);
    setEditingLinkTitle(link.title);
    setEditingLinkUrl(link.url);
  };

  const handleSaveEditLink = (folderId: string, linkId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingLinkTitle.trim() && editingLinkUrl.trim()) {
      let finalUrl = editingLinkUrl.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
      }
      setFolders(folders.map(f => f.id === folderId ? {
        ...f,
        links: f.links.map(l => l.id === linkId ? { ...l, title: editingLinkTitle.trim(), url: finalUrl } : l)
      } : f));
    }
    setEditingLinkId(null);
  };

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      const newFolder: FolderItem = {
        id: Date.now().toString(),
        name: newFolderName.trim(),
        links: [],
      };
      setFolders([...folders, newFolder]);
      setActiveFolderId(newFolder.id);
      setNewFolderName('');
      setIsAddingFolder(false);
    }
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLinkTitle.trim() && newLinkUrl.trim() && activeFolder) {
      let finalUrl = newLinkUrl.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
      }
      
      const newLink: LinkItem = {
        id: Date.now().toString(),
        title: newLinkTitle.trim(),
        url: finalUrl,
      };

      setFolders(folders.map(f => 
        f.id === activeFolderId 
          ? { ...f, links: [...f.links, newLink] } 
          : f
      ));
      
      setNewLinkTitle('');
      setNewLinkUrl('');
      setIsAddingLink(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes popInStagger {
          0% { opacity: 0; transform: scale(0.9) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-stagger-item {
          animation: popInStagger 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* Background overlay to close by clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          style={{ animation: 'fadeIn 0.3s ease-out forwards' }}
        />
      )}

      <div 
        className={`fixed top-0 right-0 h-full w-[85vw] md:w-[75vw] ${curtainTheme.gradient} backdrop-blur-3xl border-l border-white/10 z-[100] shadow-[-20px_0_50px_rgba(0,0,0,0.5)] transition-transform ${curtainTheme.animation} cubic-bezier(0.16, 1, 0.3, 1) flex flex-col ${curtainTheme.font} ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Prominent Close Button */}
        <button 
          onClick={onClose}
          className={`absolute -left-12 top-1/2 -translate-y-1/2 w-12 h-24 bg-black/40 backdrop-blur-xl border border-white/10 border-r-0 rounded-l-2xl flex items-center justify-center hover:bg-white/10 hover:-translate-x-2 transition-all group shadow-[-10px_0_20px_rgba(0,0,0,0.3)] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          title="Закрыть Workspace"
        >
          <ChevronRight size={24} className="text-white/50 group-hover:text-white transition-colors" />
        </button>

        {/* Top Bar */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/20">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button onClick={onClose} className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-400 transition-colors shadow-lg flex items-center justify-center group">
                <X size={8} className="opacity-0 group-hover:opacity-100 text-black/50" />
              </button>
              <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 hover:bg-yellow-400 shadow-lg"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-green-500 hover:bg-green-400 shadow-lg"></div>
            </div>
            <span className="text-white/70 text-sm font-semibold tracking-wide flex items-center gap-2">
              <LayoutGrid size={16} className="text-[var(--theme-color)]" />
              REVERSEX OS
            </span>
          </div>
          
          <div className="flex items-center gap-3 bg-black/30 p-1.5 rounded-xl border border-white/5">
            <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/5 mr-2">
              <button onClick={handleExportJSON} className="p-1 text-white/50 hover:text-white transition-colors" title="Скачать настройки (JSON)">
                <Download size={14} />
              </button>
              <div className="w-px h-3 bg-white/20"></div>
              <button onClick={() => fileInputRef.current?.click()} className="p-1 text-white/50 hover:text-white transition-colors" title="Загрузить настройки (JSON)">
                <Upload size={14} />
              </button>
              <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImportJSON} />
            </div>

            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-all ${showSettings ? 'bg-[var(--theme-color)] text-white shadow-lg' : 'text-white/50 hover:bg-white/10 hover:text-white'}`}
              title="Настройки"
            >
              <Settings2 size={16} />
            </button>
            <div className="w-px h-6 bg-white/10"></div>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-inner' : 'text-white/50 hover:bg-white/5'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-inner' : 'text-white/50 hover:bg-white/5'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Enhanced Settings Panel */}
          {showSettings && (
            <div className="absolute top-0 right-0 bottom-0 w-80 bg-[#0f0f13] border-l border-white/5 z-50 p-6 overflow-y-auto animate-fade-in-down shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg text-white font-medium flex items-center gap-2">
                  <Settings2 size={20} className="text-[var(--theme-color)]" />
                  Настройки
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-8">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white/80 text-sm font-medium">Режим редактирования</label>
                    <button 
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${isEditMode ? 'bg-[var(--theme-color)]' : 'bg-black/50 border border-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isEditMode ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                  <p className="text-white/40 text-xs mt-2">Позволяет перемещать (Drag & Drop), изменять названия и удалять сайты.</p>
                </div>

                <div>
                  <label className="text-white/80 text-sm font-medium block mb-3">Стиль фона</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setCurtainTheme({...curtainTheme, gradient: 'bg-black/80'})} className={`h-16 rounded-xl flex items-center justify-center text-xs font-medium border-2 transition-all ${curtainTheme.gradient === 'bg-black/80' ? 'border-[var(--theme-color)]' : 'border-transparent hover:border-white/20'} bg-black`}>Тёмный</button>
                    <button onClick={() => setCurtainTheme({...curtainTheme, gradient: 'bg-gradient-to-br from-indigo-900/80 to-purple-900/80'})} className={`h-16 rounded-xl flex items-center justify-center text-xs font-medium border-2 transition-all ${curtainTheme.gradient.includes('indigo') ? 'border-white' : 'border-transparent hover:border-white/20'} bg-gradient-to-br from-indigo-900 to-purple-900`}>Неоновый</button>
                    <button onClick={() => setCurtainTheme({...curtainTheme, gradient: 'bg-gradient-to-tr from-emerald-900/80 to-teal-900/80'})} className={`h-16 rounded-xl flex items-center justify-center text-xs font-medium border-2 transition-all ${curtainTheme.gradient.includes('emerald') ? 'border-white' : 'border-transparent hover:border-white/20'} bg-gradient-to-tr from-emerald-900 to-teal-900`}>Изумрудный</button>
                    <button onClick={() => setCurtainTheme({...curtainTheme, gradient: 'bg-gradient-to-bl from-rose-900/80 to-pink-900/80'})} className={`h-16 rounded-xl flex items-center justify-center text-xs font-medium border-2 transition-all ${curtainTheme.gradient.includes('rose') ? 'border-white' : 'border-transparent hover:border-white/20'} bg-gradient-to-bl from-rose-900 to-pink-900`}>Розовый</button>
                  </div>
                </div>

                <div>
                  <label className="text-white/80 text-sm font-medium block mb-3">Шрифт</label>
                  <div className="space-y-2">
                    {['font-sans', 'font-serif', 'font-mono'].map(font => (
                      <button
                        key={font}
                        onClick={() => setCurtainTheme({...curtainTheme, font})}
                        className={`w-full p-3 rounded-xl flex items-center justify-between border ${curtainTheme.font === font ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-white/50 hover:bg-white/5'}`}
                      >
                        <span className={font}>{font === 'font-sans' ? 'System Sans' : font === 'font-serif' ? 'System Serif' : 'System Mono'}</span>
                        {curtainTheme.font === font && <Check size={16} className="text-[var(--theme-color)]" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-white/80 text-sm font-medium block mb-3">Скорость анимации</label>
                  <div className="bg-black/30 rounded-xl p-1 flex border border-white/5">
                    {[{v: 'duration-300', l: 'X1'}, {v: 'duration-700', l: 'X2'}, {v: 'duration-1000', l: 'X3'}].map(speed => (
                      <button
                        key={speed.v}
                        onClick={() => setCurtainTheme({...curtainTheme, animation: speed.v})}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${curtainTheme.animation === speed.v ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white/80'}`}
                      >
                        {speed.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sidebar (Folders) */}
          <div className="w-64 border-r border-white/5 bg-black/20 p-4 flex flex-col gap-2 overflow-y-auto">
            <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4 px-2 mt-2">Папки</div>
            
            {folders.map(folder => (
              <div key={folder.id} className="relative group">
                {editingFolderId === folder.id ? (
                  <form onSubmit={(e) => handleSaveEditFolder(folder.id, e)} className="flex items-center gap-2 px-2 py-1.5 bg-black/40 border border-[var(--theme-color)] rounded-lg">
                    <input
                      autoFocus
                      type="text"
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      className="w-full bg-transparent text-sm text-white focus:outline-none"
                      onBlur={() => handleSaveEditFolder(folder.id)}
                    />
                  </form>
                ) : (
                  <button
                    onClick={() => setActiveFolderId(folder.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${activeFolderId === folder.id ? 'bg-[var(--theme-color)] text-white shadow-lg shadow-[var(--theme-color)]/20' : 'text-white/70 hover:bg-white/5'}`}
                  >
                    <Folder size={18} className={activeFolderId === folder.id ? 'text-white' : 'text-[var(--theme-color)] opacity-70'} />
                    <span className="flex-1 truncate text-sm font-medium">{folder.name}</span>
                    
                    {isEditMode ? (
                      <div className="flex items-center gap-1">
                        <div onClick={(e) => handleEditFolder(folder, e)} className="p-1.5 rounded hover:bg-white/20 text-white/60 hover:text-white transition-colors">
                          <Edit2 size={14} />
                        </div>
                        <div onClick={(e) => handleDeleteFolder(folder.id, e)} className="p-1.5 rounded hover:bg-red-500/80 text-white/60 hover:text-white transition-colors">
                          <Trash2 size={14} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs opacity-50 bg-black/20 px-2 py-0.5 rounded-full">{folder.links.length}</span>
                    )}
                  </button>
                )}
              </div>
            ))}

            {isAddingFolder ? (
              <form onSubmit={handleAddFolder} className="mt-4">
                <input
                  autoFocus
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Имя новой папки..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--theme-color)]"
                  onBlur={() => setIsAddingFolder(false)}
                />
              </form>
            ) : (
              <button
                onClick={() => setIsAddingFolder(true)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/5 border border-dashed border-white/10 hover:border-white/20 transition-all mt-4 text-sm font-medium"
              >
                <Plus size={16} /> Создать папку
              </button>
            )}
          </div>

          {/* Main Content (Links) */}
          <div className="flex-1 p-8 overflow-y-auto relative">
            {activeFolder && (
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-10 bg-white/5 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--theme-color)]/20 flex items-center justify-center border border-[var(--theme-color)]/30 text-[var(--theme-color)]">
                      <Folder size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-white tracking-wide">{activeFolder.name}</h2>
                      <p className="text-white/40 text-sm mt-1">{activeFolder.links.length} сохраненных сайтов</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAddingLink(!isAddingLink)}
                    className="px-5 py-2.5 rounded-xl bg-[var(--theme-color)] text-white text-sm font-medium hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-[var(--theme-color)]/20"
                  >
                    <Plus size={18} /> Добавить сайт
                  </button>
                </div>

                {isAddingLink && (
                  <form onSubmit={handleAddLink} className="bg-black/20 border border-white/10 rounded-2xl p-5 mb-10 flex gap-4 animate-fade-in-down">
                    <input
                      type="text"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      placeholder="Название (напр. Google)"
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                      required
                    />
                    <input
                      type="text"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="URL (напр. google.com)"
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                      required
                    />
                    <button type="submit" className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors text-sm font-semibold">
                      Сохранить
                    </button>
                  </form>
                )}

                {activeFolder.links.length === 0 ? (
                  <div className="text-center py-32 text-white/30 flex flex-col items-center border border-dashed border-white/5 rounded-3xl bg-black/10">
                    <Globe size={64} className="mb-6 opacity-20" />
                    <h3 className="text-xl font-medium text-white/50 mb-2">Здесь пока пусто</h3>
                    <p className="text-sm max-w-sm">Нажмите кнопку «Добавить сайт», чтобы сохранить полезные ссылки в эту папку.</p>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={activeFolder.links.map(l => l.id)} strategy={rectSortingStrategy}>
                      <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" : "flex flex-col gap-3"}>
                        {activeFolder.links.map((link, index) => (
                          <div key={link.id} className="animate-stagger-item h-full" style={{ animationDelay: `${index * 0.05}s` }}>
                            <SortableLink 
                              link={link}
                              viewMode={viewMode}
                              isEditMode={isEditMode}
                              editingLinkId={editingLinkId}
                              editingLinkTitle={editingLinkTitle}
                              editingLinkUrl={editingLinkUrl}
                              setEditingLinkTitle={setEditingLinkTitle}
                              setEditingLinkUrl={setEditingLinkUrl}
                              handleSaveEditLink={handleSaveEditLink}
                              handleEditLink={handleEditLink}
                              handleDeleteLink={handleDeleteLink}
                              folderId={activeFolder.id}
                            />
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OSCurtain;