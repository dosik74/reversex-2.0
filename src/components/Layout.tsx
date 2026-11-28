import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Film, Home, Tv, Gamepad, Music, Book, Bookmark, Bell, MessageSquare, Crown, ChevronRight, ChevronLeft, Lightbulb, Sun, Moon, Users, History } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import supabase, { ensureSession } from "@/utils/supabase";
import { VisitTracker, historyPath } from '@/pages/VisitHistory';
import NotificationsPanel from "./NotificationsPanel";
import MessagesPanel from "./MessagesPanel";
import { useTheme } from "@/context/ThemeContext";
import { useBeta } from "@/context/BetaContext";

const Layout = () => {
  const { isDark, toggleTheme } = useTheme();
  const { isBetaEnabled } = useBeta();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  // Вернулись из OAuth или по magic-ссылке из письма с незавершённым
  // QR-подтверждением — везём обратно на экран approve, раз сессия уже есть.
  // Слушаем и смену роутов, и позднее появление сессии (обмен кода идёт асинхронно).
  useEffect(() => {
    if (location.pathname === '/qr-auth') return;
    let cancelled = false;
    const rescue = async () => {
      const pending = sessionStorage.getItem('qr_pending_session');
      if (!pending || cancelled) return;
      try {
        const session = await ensureSession();
        if (session?.user && !cancelled) {
          sessionStorage.removeItem('qr_pending_session');
          navigate(`/qr-auth?session=${pending}`);
        }
      } catch {
        /* ignore */
      }
    };
    rescue();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') rescue();
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [location.pathname, navigate]);

  // Основные разделы для всех обычных зрителей
  const baseNavItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Film, label: 'Movies', path: '/movies' },
    { icon: Film, label: 'Explore', path: '/explore-movies' },
    { icon: Tv, label: 'Series', path: '/series' },
    { icon: Gamepad, label: 'Games', path: '/games' },
    { icon: Bookmark, label: 'Bookmarks', path: '/bookmarks' },
    { icon: History, label: 'История', path: historyPath },
    { icon: Users, label: 'Друзья', path: '/friends' },
    { icon: Music, label: 'Music', path: '/music' },
    { icon: Book, label: 'Books', path: '/books' },
  ];

  // Скрытые экспериментальные разделы (только для зарегистрированных с бета-режимом)
  const betaNavItems = [
    { icon: Tv, label: 'Watch', path: '/ws' },
    { icon: Lightbulb, label: 'Recommendations', path: '/recommendations' },
    { icon: Crown, label: 'Tier Lists', path: '/tier-lists' },
  ];

  const navItems = isBetaEnabled
    ? [
        ...baseNavItems.slice(0, 4), // Home, Movies, Explore, Series
        ...betaNavItems,             // Watch, Recommendations, Tier Lists
        ...baseNavItems.slice(4),    // Games, Bookmarks, Music, Books
      ]
    : baseNavItems;

  useEffect(() => {
    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id);
        }
      }).catch((err) => {
        console.warn("⚠️  Error getting session:", err);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      });

      return () => subscription?.unsubscribe();
    } catch (err) {
      console.warn("⚠️  Auth not available:", err);
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const hideMobileNav = location.pathname.startsWith('/tusau');

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('mobile-nav-scroll');
    if (container) {
      const scrollAmount = 100;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      container.scrollLeft = newPosition;
      setScrollPosition(newPosition);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-clip bg-background text-foreground">
      {/* Mobile Top Bar — удобный доступ к лого, истории, уведомлениям, сообщениям, теме и профилю */}
      <header className="md:hidden sticky top-0 z-40 px-3 pt-2 pb-2 bg-background/85 backdrop-blur-xl border-b border-border/60">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <Link to="/" className="flex items-center gap-2 min-w-0 shrink-0">
            <img src="/logo.png" alt="ReverseX" className="h-7 w-auto object-contain" />
            <span className="font-grotesk font-bold text-base tracking-tight truncate">ReverseX</span>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              title="История посещений"
            >
              <Link to={historyPath}>
                <History className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-full"
              title={isDark ? "Светлая тема" : "Тёмная тема"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {session?.user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="h-9 w-9 rounded-full"
                  title="Уведомления"
                >
                  <Bell className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMessages(!showMessages)}
                  className="h-9 w-9 rounded-full"
                  title="Сообщения"
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ml-0.5">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback>{profile?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium truncate">{profile?.display_name || profile?.username || 'User'}</p>
                        <p className="text-xs text-muted-foreground">Level {profile?.level || 1}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={profile?.username ? `/${profile.username}` : `/profile/${session.user.id}`}>
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/bookmarks">
                        Мои закладки
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/rated">
                        Оценённые
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/top50">
                        Мой Топ 50
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/friends">
                        Друзья
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings">
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild size="sm" className="h-8 px-3 text-xs rounded-full">
                <Link to="/auth">Войти</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Header — floating frosted pill */}
      <nav className="hidden md:flex sticky top-0 z-50 px-4 md:px-8 pt-3 pb-1 bg-gradient-to-b from-background via-background/80 to-transparent pointer-events-none">
        <div className="w-full mx-auto">
          <div className="flex items-center justify-between h-14 pl-3 pr-2.5 rounded-full border border-white/10 bg-black/60 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_24px_hsl(190_90%_50%/0.12)] pointer-events-auto">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src="/logo.png"
                alt="ReverseX"
                className="h-7 md:h-8 w-auto object-contain"
              />
            </Link>

            <div className="hidden lg:flex items-center gap-0.5">
              {[
                { to: '/', icon: Home, label: 'Home' },
                { to: '/movies', icon: Film, label: 'Movies' },
                { to: '/series', icon: Tv, label: 'Series' },
                ...(isBetaEnabled ? [
                  { to: '/ws', icon: Tv, label: 'Watch', isBeta: true },
                  { to: '/recommendations', icon: Lightbulb, label: 'Recs', isBeta: true },
                  { to: '/tier-lists', icon: Crown, label: 'Tier Lists', isBeta: true },
                ] : []),
                { to: '/games', icon: Gamepad, label: 'Games' },
                { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
                { to: '/music', icon: Music, label: 'Music' },
                { to: '/books', icon: Book, label: 'Books' },
              ].map(({ to, icon: Icon, label, isBeta }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                      isActive
                        ? 'bg-white text-black shadow-[0_0_16px_rgba(255,255,255,0.25)]'
                        : isBeta
                        ? 'text-pink-300/80 hover:text-pink-200 hover:bg-pink-500/10'
                        : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {isBeta && (
                    <span className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-pink-500/20 text-pink-300 leading-none">
                      β
                    </span>
                  )}
                </NavLink>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="icon">
                <Link to={historyPath} aria-label="История посещений" title="История посещений"><History className="w-5 h-5" /></Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                title={isDark ? "Светлая тема" : "Темная тема"}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              {session?.user ? (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowNotifications(!showNotifications)}
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowMessages(!showMessages)}
                    title="Messages"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="relative h-10 w-10 rounded-full hover:bg-secondary transition-colors">
                        <Avatar>
                          <AvatarImage src={profile?.avatar_url} />
                          <AvatarFallback>{profile?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">{profile?.display_name || profile?.username || 'User'}</p>
                          <p className="text-xs text-muted-foreground">Level {profile?.level || 1}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={profile?.username ? `/${profile.username}` : `/profile/${session.user.id}`}>
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/bookmarks">
                          Мои закладки
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/rated">
                          Оценённые
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/top50">
                          Мой Топ 50
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/friends">
                          Друзья
                        </Link>
                      </DropdownMenuItem>
                      {isBetaEnabled && (
                        <DropdownMenuItem asChild>
                          <Link to="/tier-lists" className="flex items-center justify-between text-pink-400">
                            <span>Tier Lists</span>
                            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300">
                              BETA
                            </span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to="/settings">
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button asChild size="sm">
                  <Link to="/auth">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 min-w-0 w-full max-w-full overflow-x-clip pb-24 md:pb-0">
        <VisitTracker />
        <Outlet />
      </main>

      {/* Notifications Panel (works on both desktop and mobile) */}
      {showNotifications && session?.user?.id && (
        <NotificationsPanel
          open={showNotifications}
          onClose={() => setShowNotifications(false)}
          userId={session.user.id}
        />
      )}

      {/* Messages Panel (works on both desktop and mobile) */}
      {showMessages && session?.user?.id && (
        <MessagesPanel
          open={showMessages}
          onClose={() => setShowMessages(false)}
          userId={session.user.id}
        />
      )}

      {/* Mobile Bottom Navigation */}
      {!hideMobileNav && (
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center h-16">
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Прокрутить влево"
            className="flex-shrink-0 px-1.5 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable Navigation */}
          <div
            id="mobile-nav-scroll"
            className="flex-1 overflow-x-auto scrollbar-hide"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="flex items-center gap-1 px-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[60px] shrink-0 ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] font-medium leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Прокрутить вправо"
            className="flex-shrink-0 px-1.5 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      )}

      {/* CSS для скрытия scrollbar */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Layout;