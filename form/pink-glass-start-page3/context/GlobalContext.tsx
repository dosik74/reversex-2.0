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
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateBookmark: (id: string, updates: Partial<Bookmark>) => void;
  isSyncing: boolean;
  lastSynced: Date | null;
  logout: () => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// Helper to hydrate Apps from JSON (restore React Components for icons)
const hydrateApps = (items: any[]): AppItem[] => {
    return items.map(savedItem => {
        const original = ALL_APPS.find(a => a.id === savedItem.id);
        return original || null;
    }).filter((item): item is AppItem => item !== null);
};

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- Local State Initialization ---
  const [settings, setSettingsState] = useState<AppSettings>(() => {
    try {
        const saved = localStorage.getItem('pink_glass_settings');
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
        const saved = localStorage.getItem('pink_glass_bookmarks');
        return saved ? JSON.parse(saved) : DEFAULT_BOOKMARKS;
    } catch { return DEFAULT_BOOKMARKS; }
  });

  const [topLinks, setTopLinks] = useState<Bookmark[]>(() => {
      try {
          const saved = localStorage.getItem('pink_glass_top_bar');
          return saved ? JSON.parse(saved) : DEFAULT_TOP_LINKS;
      } catch { return DEFAULT_TOP_LINKS; }
  });

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

  const [bgIndex, setBgIndex] = useState(() => {
    const saved = localStorage.getItem('pink_glass_bg_index');
    return saved ? parseInt(saved) : 0;
  });

  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // --- Helpers for cleaner updates ---
  const setSettings = (s: AppSettings) => setSettingsState(s);
  const updateSettings = (partial: Partial<AppSettings>) => setSettingsState(prev => ({ ...prev, ...partial }));
  
  const updateBookmark = (id: string, updates: Partial<Bookmark>) => {
      // Check Top Links
      if (topLinks.some(b => b.id === id)) {
          setTopLinks(topLinks.map(b => b.id === id ? { ...b, ...updates } : b));
          return;
      }
      // Check Center Bookmarks
      if (bookmarks.some(b => b.id === id)) {
          setBookmarks(bookmarks.map(b => b.id === id ? { ...b, ...updates } : b));
          return;
      }
  };

  // --- Persistence to LocalStorage ---
  useEffect(() => {
    localStorage.setItem('pink_glass_settings', JSON.stringify(settings));
    localStorage.setItem('pink_glass_bookmarks', JSON.stringify(bookmarks));
    localStorage.setItem('pink_glass_top_bar', JSON.stringify(topLinks));
    localStorage.setItem('pink_glass_bg_index', bgIndex.toString());
    
    const replacer = (key: string, value: any) => (key === 'icon' ? undefined : value);
    localStorage.setItem('pink_glass_favorites', JSON.stringify(favorites, replacer));
    localStorage.setItem('pink_glass_others', JSON.stringify(others, replacer));
  }, [settings, bookmarks, topLinks, favorites, others, bgIndex]);


  // --- Auth Listener ---
  useEffect(() => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
              setUser(session.user);
              // Trigger sync immediately upon login
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

  // --- Cloud Sync Logic ---
  const fetchCloudData = async (userId: string, retries = 3) => {
      setIsSyncing(true);
      try {
          // Attempt to fetch user profile data
          const { data, error } = await supabase
              .from('user_profiles')
              .select('data')
              .eq('id', userId)
              .single();

          // Retry Logic: If profile is missing (common with new Google Auth users), wait and retry.
          // This allows the Database Trigger time to create the row.
          if ((!data || error) && retries > 0) {
              console.log(`Profile not found yet. Retrying sync... (${retries} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds
              return fetchCloudData(userId, retries - 1);
          }

          if (data && data.data) {
              const cloudData = data.data as GlobalState;
              // Only overwrite if cloud data exists, otherwise keep local defaults
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

  // Debounced Save to Cloud
  useEffect(() => {
      if (!user) return;
      
      setIsSyncing(true);

      const timeoutId = setTimeout(async () => {
          const payload = {
              settings,
              bookmarks,
              topLinks,
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
  }, [settings, bookmarks, topLinks, favorites, others, user]);


  // --- Export / Import ---
  const exportData = () => {
      const dataToExport = {
          settings,
          bookmarks,
          topLinks,
          favorites: favorites.map(f => ({ id: f.id, name: f.name, url: f.url })),
          others: others.map(o => ({ id: o.id, name: o.name, url: o.url })),
          bgIndex
      };
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "pink-glass-backup.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const importData = (jsonString: string): boolean => {
      try {
          const parsed = JSON.parse(jsonString);
          if (!parsed.settings || !parsed.bookmarks) return false;

          localStorage.setItem('pink_glass_settings', JSON.stringify(parsed.settings));
          localStorage.setItem('pink_glass_bookmarks', JSON.stringify(parsed.bookmarks));
          if(parsed.topLinks) localStorage.setItem('pink_glass_top_bar', JSON.stringify(parsed.topLinks));
          if(parsed.bgIndex !== undefined) localStorage.setItem('pink_glass_bg_index', parsed.bgIndex.toString());
          
          if(parsed.favorites) localStorage.setItem('pink_glass_favorites', JSON.stringify(parsed.favorites));
          if(parsed.others) localStorage.setItem('pink_glass_others', JSON.stringify(parsed.others));

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