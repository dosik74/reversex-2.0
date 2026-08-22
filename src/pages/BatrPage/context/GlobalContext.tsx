import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, Bookmark, AppItem } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_BOOKMARKS, INITIAL_FAVORITES, INITIAL_OTHERS, DEFAULT_TOP_LINKS, ALL_APPS } from '../constants';
import { supabase } from '../utils/supabaseClient';
import { User } from '@supabase/supabase-js';

interface GlobalState {
  settings: AppSettings;
  bookmarks: Bookmark[];
  topLinks: Bookmark[];
  favorites: AppItem[];
  others: AppItem[];
}

type SpaceWallpaper = {
  customBackground: string | null;
  customVideo: boolean;
};

interface GlobalContextType extends GlobalState {
  setSettings: (settings: AppSettings) => void;
  setBookmarks: (bookmarks: Bookmark[]) => void;
  setTopLinks: (links: Bookmark[]) => void;
  setFavorites: (favorites: AppItem[]) => void;
  setOthers: (others: AppItem[]) => void;
  importData: (jsonData: string) => boolean;
  exportData: () => void;
  user: User | null;
  bgIndex: number;
  setBgIndex: (index: number) => void;
  bgSpace: number;
  setBgSpace: (space: number) => void;
  spaceWallpaper: SpaceWallpaper;
  setSpaceCustomBackground: (value: string | null) => void;
  setSpaceCustomVideo: (value: boolean) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateBookmark: (id: string, updates: Partial<Bookmark>) => void;
  isSyncing: boolean;
  lastSynced: Date | null;
  logout: () => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

const hydrateApps = (items: any[]): AppItem[] => {
    return items.map(savedItem => {
        const original = ALL_APPS.find(a => a.id === savedItem.id);
        return original || null;
    }).filter((item): item is AppItem => item !== null);
};

// Use different localStorage keys so Batyrhan's settings are independent
const LS = {
  settings: 'batr_settings',
  bookmarks: 'batr_bookmarks',
  topBar: 'batr_top_bar',
  bgIndex: 'batr_bg_index',
  bgSpace: 'batr_bg_space',
  spaceWallpapers: 'batr_space_wallpapers',
  favorites: 'batr_favorites',
  others: 'batr_others',
};

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<AppSettings>(() => {
    try {
        const saved = localStorage.getItem(LS.settings);
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
        const saved = localStorage.getItem(LS.bookmarks);
        return saved ? JSON.parse(saved) : DEFAULT_BOOKMARKS;
    } catch { return DEFAULT_BOOKMARKS; }
  });

  const [topLinks, setTopLinks] = useState<Bookmark[]>(() => {
      try {
          const saved = localStorage.getItem(LS.topBar);
          return saved ? JSON.parse(saved) : DEFAULT_TOP_LINKS;
      } catch { return DEFAULT_TOP_LINKS; }
  });

  const [favorites, setFavorites] = useState<AppItem[]>(() => {
    try {
        const saved = localStorage.getItem(LS.favorites);
        return saved ? hydrateApps(JSON.parse(saved)) : INITIAL_FAVORITES;
    } catch { return INITIAL_FAVORITES; }
  });

  const [others, setOthers] = useState<AppItem[]>(() => {
    try {
        const saved = localStorage.getItem(LS.others);
        return saved ? hydrateApps(JSON.parse(saved)) : INITIAL_OTHERS;
    } catch { return INITIAL_OTHERS; }
  });

  const [bgIndex, setBgIndex] = useState(() => {
    const saved = localStorage.getItem(LS.bgIndex);
    return saved ? parseInt(saved) : 5; // Default to "Deep Space Mesh"
  });

  const [bgSpace, setBgSpace] = useState(() => {
    const saved = localStorage.getItem(LS.bgSpace);
    return saved ? parseInt(saved) : 0; // 0 = first space, 1 = second space
  });

  const [spaceWallpapers, setSpaceWallpapers] = useState<Record<number, SpaceWallpaper>>(() => {
    try {
      const saved = localStorage.getItem(LS.spaceWallpapers);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      0: { customBackground: null, customVideo: false },
      1: { customBackground: null, customVideo: false },
    };
  });

  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const setSettings = (s: AppSettings) => setSettingsState(s);
  const updateSettings = (partial: Partial<AppSettings>) => setSettingsState(prev => ({ ...prev, ...partial }));
  
  const updateBookmark = (id: string, updates: Partial<Bookmark>) => {
      if (topLinks.some(b => b.id === id)) {
          setTopLinks(topLinks.map(b => b.id === id ? { ...b, ...updates } : b));
          return;
      }
      if (bookmarks.some(b => b.id === id)) {
          setBookmarks(bookmarks.map(b => b.id === id ? { ...b, ...updates } : b));
          return;
      }
  };

  useEffect(() => {
    localStorage.setItem(LS.settings, JSON.stringify(settings));
    localStorage.setItem(LS.bookmarks, JSON.stringify(bookmarks));
    localStorage.setItem(LS.topBar, JSON.stringify(topLinks));
    localStorage.setItem(LS.bgIndex, bgIndex.toString());
    localStorage.setItem(LS.bgSpace, bgSpace.toString());
    localStorage.setItem(LS.spaceWallpapers, JSON.stringify(spaceWallpapers));
    
    const replacer = (key: string, value: any) => (key === 'icon' ? undefined : value);
    localStorage.setItem(LS.favorites, JSON.stringify(favorites, replacer));
    localStorage.setItem(LS.others, JSON.stringify(others, replacer));
  }, [settings, bookmarks, topLinks, favorites, others, bgIndex, bgSpace, spaceWallpapers]);

  useEffect(() => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
              setUser(session.user);
              await fetchCloudData(session.user.id);
          } else {
              setUser(null);
          }
      });
      return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
      await supabase.auth.signOut();
      setUser(null);
      setLastSynced(null);
  };

  const fetchCloudData = async (userId: string, retries = 3) => {
      setIsSyncing(true);
      try {
          const { data, error } = await supabase
              .from('user_profiles')
              .select('data')
              .eq('id', userId)
              .single();

          if ((!data || error) && retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1500));
              return fetchCloudData(userId, retries - 1);
          }

          if (data && data.data) {
              const cloudData = data.data as GlobalState;
              if (cloudData.settings) setSettingsState(prev => ({ ...prev, ...cloudData.settings }));
              if (cloudData.bookmarks) setBookmarks(cloudData.bookmarks);
              if (cloudData.topLinks) setTopLinks(cloudData.topLinks);
              if (cloudData.favorites) setFavorites(hydrateApps(cloudData.favorites));
              if (cloudData.others) setOthers(hydrateApps(cloudData.others));
              setLastSynced(new Date());
          }
      } catch (err) {
          console.error("Error fetching cloud data:", err);
      } finally {
          setIsSyncing(false);
      }
  };

  useEffect(() => {
      if (!user) return;
      setIsSyncing(true);
      const timeoutId = setTimeout(async () => {
          const payload = {
              settings,
              bookmarks,
              topLinks,
              spaceWallpapers,
              favorites: favorites.map(f => ({ id: f.id, name: f.name, url: f.url })), 
              others: others.map(o => ({ id: o.id, name: o.name, url: o.url }))
          };
          await supabase.from('user_profiles').upsert({
              id: user.id,
              data: payload,
              updated_at: new Date().toISOString()
          });
          setIsSyncing(false);
          setLastSynced(new Date());
      }, 2000); 
      return () => clearTimeout(timeoutId);
  }, [settings, bookmarks, topLinks, favorites, others, user, spaceWallpapers]);

  const exportData = () => {
      const dataToExport = { settings, bookmarks, topLinks,
          spaceWallpapers,
          favorites: favorites.map(f => ({ id: f.id, name: f.name, url: f.url })),
          others: others.map(o => ({ id: o.id, name: o.name, url: o.url })), bgIndex
      };
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "batr-backup.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const importData = (jsonString: string): boolean => {
      try {
          const parsed = JSON.parse(jsonString);
          if (!parsed.settings || !parsed.bookmarks) return false;
          localStorage.setItem(LS.settings, JSON.stringify(parsed.settings));
          localStorage.setItem(LS.bookmarks, JSON.stringify(parsed.bookmarks));
          if(parsed.topLinks) localStorage.setItem(LS.topBar, JSON.stringify(parsed.topLinks));
          if(parsed.bgIndex !== undefined) localStorage.setItem(LS.bgIndex, parsed.bgIndex.toString());
          if(parsed.spaceWallpapers) localStorage.setItem(LS.spaceWallpapers, JSON.stringify(parsed.spaceWallpapers));
          if(parsed.favorites) localStorage.setItem(LS.favorites, JSON.stringify(parsed.favorites));
          if(parsed.others) localStorage.setItem(LS.others, JSON.stringify(parsed.others));
          window.location.reload();
          return true;
      } catch (e) {
          console.error("Import failed", e);
          return false;
      }
  };

  return (
    <GlobalContext.Provider value={{
      settings, setSettings, updateSettings,
      bookmarks, setBookmarks,
      topLinks, setTopLinks,
      favorites, setFavorites,
      others, setOthers,
      user,
      bgIndex, setBgIndex,
      bgSpace, setBgSpace,
      spaceWallpaper: spaceWallpapers[bgSpace] ?? { customBackground: null, customVideo: false },
      setSpaceCustomBackground: (value) => setSpaceWallpapers(prev => ({
        ...prev,
        [bgSpace]: { ...(prev[bgSpace] ?? { customBackground: null, customVideo: false }), customBackground: value }
      })),
      setSpaceCustomVideo: (value) => setSpaceWallpapers(prev => ({
        ...prev,
        [bgSpace]: { ...(prev[bgSpace] ?? { customBackground: null, customVideo: false }), customVideo: value }
      })),
      importData, exportData,
      isSyncing,
      lastSynced,
      logout,
      updateBookmark
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};
