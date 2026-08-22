import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Gamepad, Music, Book } from "lucide-react";

import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";

import Auth from "./pages/Auth";
import QRAuthPage from "./pages/QRAuthPage";
import Layout from "./components/Layout";
import Movies from "./pages/Movies";
import ExploreMovies from "./pages/ExploreMovies";
import MovieDetail from "./pages/MovieDetail";
import SeriesPage from "./pages/Series";
import SeriesDetail from "./pages/SeriesDetail";
import WSHome from "./pages/ws/WSHome";
import WSShowPage from "./pages/ws/WSShowPage";
import Games from "./pages/Games";
import GameDetail from "./pages/GameDetail";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import TierLists from "./pages/TierLists";
import BookmarksNew from "./pages/BookmarksNew";
import Recommendations from "./pages/Recommendations";
import FileDownload from "./pages/FileDownload";
import FileDownload2 from "./pages/FileDownload2";
import FileDownload3 from "./pages/FileDownload3";
import FileBrowserDownload from "./pages/FileBrowserDownload";
import YouTubeDownloader from "./pages/YouTubeDownloader";
import Shop from "./pages/Shop/Shop";
import ShopDetail from "./pages/Shop/ShopDetail";
import ShopAdmin from "./pages/Shop/ShopAdmin";
import ProfileCard from "./pages/ProfileCard";
import AdminDashboard from "./pages/AdminDashboard";
import Tusau from "./pages/Tusau";
import ErrorBoundary from "./components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";

// Task Pages imports
import Task20 from "./pages/Task20";
import Task21 from "./pages/Task21";
import Task22 from "./pages/Task22";
import Task23 from "./pages/Task23";
import Task24 from "./pages/Task24";
import Task25 from "./pages/Task25";

// Workspace imports
import Workspace from "./pages/Workspace";
import WorkspaceAuth from "./pages/WorkspaceAuth";
import WorkspaceProject from "./pages/WorkspaceProject";
import WorkspaceSettings from "./pages/WorkspaceSettings";
import WorkspaceInvite from "./pages/WorkspaceInvite";

// Pink Glass Start Page
import PinkGlassPage from "./pages/PinkGlassPage";

// Batyrhan Start Page
import BatrPage from "./pages/BatrPage";

import supabase from "@/lib/supabase";
import { useAnalytics } from "@/hooks/useAnalytics";
import "./App.css";

const AnalyticsTracker = () => {
  useAnalytics();
  return null;
};

const queryClient = new QueryClient();

const App = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("🚀 App component mounted");
    
    async function checkSupabase() {
      try {
        // Only check Supabase if environment variables are configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey) {
          console.warn("⚠️  Supabase переменные окружения не установлены");
          return;
        }
        
        console.log("🔍 Проверка подключения Supabase...");
        const { data, error } = await supabase.from("comments").select("*").limit(1);
        if (error) {
          console.error("❌ Ошибка Supabase:", error.message);
        } else {
          console.log("✅ Подключение к Supabase успешно:", data);
        }
      } catch (err) {
        console.error("❌ Ошибка при подключении к Supabase:", err);
      }
    }

    checkSupabase();
  }, []);

  if (error) {
    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <AppProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
              <BrowserRouter>
              <AnalyticsTracker />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/qr-auth" element={<QRAuthPage />} />
                <Route path="/br" element={<PinkGlassPage />} />
                <Route path="/br-batyrhan" element={<BatrPage />} />

                {/* Task Pages Routes */}
                <Route path="/tasks/20" element={<Task20 />} />
                <Route path="/tasks/21" element={<Task21 />} />
                <Route path="/tasks/22" element={<Task22 />} />
                <Route path="/tasks/23" element={<Task23 />} />
                <Route path="/tasks/24" element={<Task24 />} />
                <Route path="/tasks/25" element={<Task25 />} />

                {/* Workspace Routes - Hidden/Secret */}
                <Route path="/workspace-auth" element={<WorkspaceAuth />} />
                <Route path="/workspace" element={<Workspace />} />
                <Route path="/workspace/project/:projectId" element={<WorkspaceProject />} />
                <Route path="/workspace/settings" element={<WorkspaceSettings />} />
                <Route path="/workspace/invite/:inviteCode" element={<WorkspaceInvite />} />

                {/* File Download Routes - Hidden/Secret */}
                <Route path="/download/file" element={<FileDownload />} />
                <Route path="/download/file2" element={<FileDownload2 />} />
                <Route path="/download/file3" element={<FileDownload3 />} />
                <Route path="/download/file_browser" element={<FileBrowserDownload />} />
                <Route path="/youtube-downloader" element={<YouTubeDownloader />} />
                <Route path="/de" element={<ProfileCard />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:id" element={<ShopDetail />} />
                <Route path="/shop/admin" element={<ShopAdmin />} />

                <Route element={<Layout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/movies" element={<Movies />} />
                  <Route path="/explore-movies" element={<ExploreMovies />} />
                  <Route path="/movie/:id" element={<MovieDetail />} />
                  <Route path="/series" element={<SeriesPage />} />
                  <Route path="/series/:id" element={<SeriesDetail />} />
                  <Route path="/ws" element={<WSHome />} />
                  <Route path="/ws/show/:id" element={<WSShowPage />} />
                  <Route path="/profile/:userId" element={<Profile />} />
                  <Route path="/profile/:userId/edit" element={<ProfileEdit />} />
                  <Route path="/bookmarks" element={<BookmarksNew />} />
                  <Route path="/recommendations" element={<Recommendations />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/tier-lists" element={<TierLists />} />
                  <Route path="/games" element={<Games />} />
                  <Route path="/game/:id" element={<GameDetail />} />
                  <Route path="/music" element={<PlaceholderPage title="Music" icon={Music} />} />
                  <Route path="/books" element={<PlaceholderPage title="Books" icon={Book} />} />
                  <Route path="/tusau" element={<Tusau />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
            </AppProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;