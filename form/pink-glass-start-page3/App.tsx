import React, { useState, useEffect, useRef } from 'react';
import { Settings, User, LogOut, Cloud, CloudUpload } from 'lucide-react';
import { BACKGROUNDS } from './constants';
import { useGlobal } from './context/GlobalContext';
import SearchBar from './components/SearchBar';
import AppMenu from './components/AppMenu';
import BookmarkGrid from './components/BookmarkGrid';
import InfiniteBar from './components/InfiniteBar';
import BackgroundSwitcher from './components/BackgroundSwitcher';
import SettingsModal from './components/SettingsModal';
import AuthModal from './components/AuthModal';
import TopNav from './components/TopNav';
import Clock from './components/Clock';
import { getVideo } from './utils/db';
import { supabase } from './utils/supabaseClient';
import { WhiteWaveSvg, DarkWaveSvg, DotWavesSvg, CarbonSvg, CircuitSvg } from './components/SvgBackgrounds';
import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  closestCenter,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import SortableBookmark from './components/SortableBookmark';
import { Bookmark } from './types';

// Helper to convert hex to RGB
const hexToRgb = (hex: string) => {
    let c: any;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return [(c>>16)&255, (c>>8)&255, c&255].join(',');
    }
    return '255,105,180'; // fallback pink
}

const App: React.FC = () => {
  const { 
    settings, updateSettings, bgIndex, setBgIndex, user, isSyncing,
    topLinks, setTopLinks,
    bookmarks, setBookmarks
  } = useGlobal();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<Bookmark | null>(null);

  // --- Drag & Drop Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // --- DND LOGIC ---

  const findContainer = (id: string) => {
    if (topLinks.find((i) => i.id === id)) return 'top-bar';
    if (bookmarks.find((i) => i.id === id)) return 'center-grid';
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;
    setActiveId(id);
    const item = topLinks.find(i => i.id === id) || bookmarks.find(i => i.id === id);
    if (item) setActiveItem(item);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) return;

    const activeContainer = findContainer(active.id as string);
    // Determine target container: if over an item, use that item's container.
    // If over the InfiniteBar wrapper (we need to tag it in InfiniteBar later, 
    // or assume if overId matches an item in topLinks).
    // Simplified: Check if overId is in a list, or if over.data.current?.sortable.containerId matches
    let overContainer = findContainer(overId as string);

    if (!overContainer) {
        // Fallback: Check if we are hovering over the empty area of a container? 
        // For now, simple swapping requires hovering over an item or using sortable context ID if mapped
        return;
    }

    if (activeContainer && overContainer && activeContainer !== overContainer) {
       // --- TELEPORT LOGIC ---
       // We are moving between zones!
       
       const activeItems = activeContainer === 'top-bar' ? topLinks : bookmarks;
       const overItems = overContainer === 'top-bar' ? topLinks : bookmarks;
       
       const activeIndex = activeItems.findIndex(i => i.id === active.id);
       const overIndex = overItems.findIndex(i => i.id === overId);

       let newIndex;
       if (overIndex >= 0) {
           newIndex = overIndex + (active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height ? 1 : 0);
       } else {
           newIndex = overItems.length + 1;
       }

       const itemToMove = activeItems[activeIndex];

       if (activeContainer === 'top-bar') {
           // Move Top -> Center
           setTopLinks(topLinks.filter(i => i.id !== active.id));
           setBookmarks([
               ...bookmarks.slice(0, newIndex),
               itemToMove,
               ...bookmarks.slice(newIndex, bookmarks.length)
           ]);
       } else {
           // Move Center -> Top
           setBookmarks(bookmarks.filter(i => i.id !== active.id));
           setTopLinks([
               ...topLinks.slice(0, newIndex),
               itemToMove,
               ...topLinks.slice(newIndex, topLinks.length)
           ]);
       }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeContainer = findContainer(active.id as string);
    const overContainer = over ? findContainer(over.id as string) : null;

    if (
        activeContainer &&
        overContainer &&
        activeContainer === overContainer &&
        over && active.id !== over.id
    ) {
        // Reordering within the same container
        if (activeContainer === 'top-bar') {
            const oldIndex = topLinks.findIndex((i) => i.id === active.id);
            const newIndex = topLinks.findIndex((i) => i.id === over.id);
            setTopLinks(arrayMove(topLinks, oldIndex, newIndex));
        } else {
            const oldIndex = bookmarks.findIndex((i) => i.id === active.id);
            const newIndex = bookmarks.findIndex((i) => i.id === over.id);
            setBookmarks(arrayMove(bookmarks, oldIndex, newIndex));
        }
    }

    setActiveId(null);
    setActiveItem(null);
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.4',
        },
      },
    }),
  };

  // --- End DND Logic ---

  // Handle Video Loading from IDB
  useEffect(() => {
    let active = true;
    if (settings.customVideo) {
        getVideo().then((blob) => {
            if (active && blob) {
                const url = URL.createObjectURL(blob);
                setVideoUrl(url);
            } else if (active && !blob) {
                updateSettings({ customVideo: false });
            }
        }).catch(err => {
            console.error("Failed to load video", err);
            updateSettings({ customVideo: false });
        });
    } else {
        setVideoUrl(null);
    }
    
    return () => {
        active = false;
        if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [settings.customVideo]);

  // Ensure video plays when URL updates
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.load();
      videoRef.current.play().catch(e => console.log("Auto-play blocked", e));
    }
  }, [videoUrl]);

  const handleLogout = async () => {
      await supabase.auth.signOut();
  };

  const currentBgValue = settings.customBackground || BACKGROUNDS[bgIndex].value;
  const currentSvgId = !settings.customBackground && !settings.customVideo ? BACKGROUNDS[bgIndex].svgId : null;
  const themeRgb = hexToRgb(settings.themeColor);

  return (
    <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
    >
        <div className={`relative w-full h-screen overflow-hidden text-white selection:bg-[rgba(var(--theme-rgb),0.4)] selection:text-white ${settings.isAnimationEnabled ? '' : 'disable-animations'}`}>
        
        {/* Dynamic CSS Variables & Animation Styles */}
        <style>{`
            :root {
                --glass-blur: ${settings.blurAmount}px;
                --theme-color: ${settings.themeColor};
                --theme-rgb: ${themeRgb};
            }
            .glass-panel {
                backdrop-filter: blur(var(--glass-blur)) !important;
                -webkit-backdrop-filter: blur(var(--glass-blur)) !important;
            }
            .theme-text { color: var(--theme-color); }
            .theme-text-accent { color: rgba(var(--theme-rgb), 0.8); }
            .theme-bg { background-color: var(--theme-color); }
            .theme-bg-accent { background-color: rgba(var(--theme-rgb), 0.3); }
            .theme-bg-glass { background-color: rgba(var(--theme-rgb), 0.15); }
            .theme-border { border-color: rgba(var(--theme-rgb), 0.25); }
            .theme-hover:hover { background-color: rgba(var(--theme-rgb), 0.2); }
            
            @keyframes gradient-xy {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            .animate-gradient-slow {
                background-size: 400% 400%;
                animation: gradient-xy 20s ease infinite;
            }
            ${!settings.isAnimationEnabled ? `
                *, *::before, *::after {
                    animation: none !important;
                    transition: none !important;
                }
            ` : ''}
        `}</style>

        {/* Background Layer System */}
        <div className="absolute inset-0 overflow-hidden z-0 bg-[#000]">
            <video 
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${videoUrl ? 'opacity-100' : 'opacity-0'}`}
            src={videoUrl || undefined}
            autoPlay muted loop playsInline
            />
            <div className={`absolute inset-0 bg-black/40 transition-opacity duration-1000 ${videoUrl ? 'opacity-100' : 'opacity-0'}`} />
            <div 
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${videoUrl ? 'opacity-0' : 'opacity-100'}`}
                style={{ 
                    background: settings.customBackground ? `url(${settings.customBackground}) center/cover no-repeat` : currentBgValue 
                }}
            >
                {currentSvgId === 'white-wave' && <WhiteWaveSvg />}
                {currentSvgId === 'dark-wave' && <DarkWaveSvg />}
                {currentSvgId === 'dot-waves' && <DotWavesSvg />}
                {currentSvgId === 'carbon' && <CarbonSvg />}
                {currentSvgId === 'circuit' && <CircuitSvg />}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
                <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none ${!settings.customBackground && settings.isAnimationEnabled && !currentSvgId ? 'animate-gradient-slow' : ''}`} />
            </div>
        </div>

        {/* Fixed Infinite Bar at absolute top */}
        <InfiniteBar language={settings.language} />

        {/* Main Content Area */}
        <div className="relative z-10 w-full h-full flex flex-col pt-12">
            
            <Clock format={settings.timeFormat} />

            <header className="flex justify-end items-center p-4 pr-6 gap-2 mt-2">
                <TopNav language={settings.language} />
                
                {user ? (
                    <div className="flex items-center gap-3">
                        <div className="text-white/50" title={isSyncing ? "Syncing..." : "Synced"}>
                            {isSyncing ? (
                                <CloudUpload size={18} className="animate-pulse text-[var(--theme-color)]" />
                            ) : (
                                <Cloud size={18} />
                            )}
                        </div>

                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-white/5 glass-panel">
                            <div className="w-6 h-6 rounded-full theme-bg flex items-center justify-center text-xs font-bold text-white shadow-lg">
                                {user.email?.charAt(0).toUpperCase()}
                            </div>
                            <button 
                                onClick={handleLogout}
                                title="Logout"
                                className="text-white/70 hover:text-white transition-colors"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAuthOpen(true)}
                        className="p-3 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                        title="Login"
                    >
                        <User size={20} />
                    </button>
                )}

                <AppMenu language={settings.language} />
            </header>

            <main className="flex-1 flex flex-col items-center justify-center -mt-8 px-4 w-full">
            <div className="mb-8 animate-fade-in-down flex justify-center">
                <a 
                href="https://reversex.vercel.app/" 
                className="cursor-pointer block group"
                title="ReverseX"
                >
                    <img 
                    src="./logo.png" 
                    alt="Logo" 
                    className="h-24 md:h-28 w-auto drop-shadow-[0_0_15px_rgba(var(--theme-rgb),0.4)] transition-transform duration-500 group-hover:scale-105"
                    />
                </a>
            </div>
            
            <SearchBar engine={settings.searchEngine} language={settings.language} />
            
            <div className="animate-fade-in-up w-full flex justify-center">
                <BookmarkGrid language={settings.language} />
            </div>
            </main>

            <footer className="p-8 flex justify-center animate-fade-in-up pb-12 relative">
            {!settings.lockBackground && !settings.customBackground && !settings.customVideo && (
                <BackgroundSwitcher 
                    currentIndex={bgIndex}
                    onSwitch={setBgIndex}
                />
            )}
            </footer>
        </div>

        <button 
            onClick={() => setIsSettingsOpen(true)}
            className="fixed bottom-6 right-6 p-3 rounded-full bg-black/20 hover:bg-[rgba(var(--theme-rgb),0.4)] backdrop-blur-md text-white/70 hover:text-white transition-all duration-300 z-40 border border-white/5 hover:rotate-90"
            title="Settings"
        >
            <Settings size={20} />
        </button>

        {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
        {isAuthOpen && <AuthModal language={settings.language} onClose={() => setIsAuthOpen(false)} />}

        <style>{`
            @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-30px); }
            to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-down {
            animation: fadeInDown 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            }
            .animate-fade-in-up {
            animation: fadeInUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            }
        `}</style>
        
        {/* DRAG OVERLAY: Shows the item while dragging */}
        <DragOverlay dropAnimation={dropAnimation}>
            {activeId && activeItem ? (
                <SortableBookmark 
                    bookmark={activeItem} 
                    // If moving over the top bar, show pill, otherwise show card
                    variant={findContainer(activeId) === 'top-bar' ? 'pill' : 'card'} 
                    onRemove={() => {}} 
                    isOverlay 
                />
            ) : null}
        </DragOverlay>
        </div>
    </DndContext>
  );
};

export default App;