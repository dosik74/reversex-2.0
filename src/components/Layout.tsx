import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Film, Home, Tv, Gamepad, Music, Book, Bookmark, Bell, MessageSquare, User, LogOut, Settings, Crown, ChevronRight, ChevronLeft, Lightbulb, Sun, Moon, Smartphone, FlaskConical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import supabase, { ensureSession } from "@/utils/supabase";
import NotificationsPanelComponent from "./NotificationsPanelComponent";
import MessagesPanelComponent from "./MessagesPanelComponent";
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
    <div className="flex flex-col min-h-screen bg-background text-foreground">
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
                        <Link to={`/profile/${session.user.id}`} className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/qr-scan" className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          Привязать устройство
                        </Link>
                      </DropdownMenuItem>
                      {isBetaEnabled && (
                        <DropdownMenuItem asChild>
                          <Link to="/tier-lists" className="flex items-center gap-2 text-pink-400">
                            <Crown className="w-4 h-4" />
                            <span>Tier Lists</span>
                            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300">
                              BETA
                            </span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to={`/profile/${session.user.id}/edit`} className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Edit Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/settings" className="flex items-center gap-2">
                          <FlaskConical className="w-4 h-4 text-pink-400" />
                          <span>ReverseX Labs</span>
                          {isBetaEnabled && (
                            <span className="ml-auto w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                          )}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/settings" className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Notifications Panel */}
                  {showNotifications && (
                    <NotificationsPanelComponent 
                      onClose={() => setShowNotifications(false)}
                    />
                  )}

                  {/* Messages Panel */}
                  {showMessages && (
                    <MessagesPanelComponent 
                      onClose={() => setShowMessages(false)}
                    />
                  )}
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

      <main className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      {!hideMobileNav && (
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50">
        <div className="flex items-center h-20">
          {/* Scroll Left Button */}
          <button
            onClick={() => scroll('left')}
            className="flex-shrink-0 p-2 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Scrollable Navigation */}
          <div
            id="mobile-nav-scroll"
            className="flex-1 overflow-x-auto scrollbar-hide"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="flex gap-1 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-max ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-500'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Scroll Right Button */}
          <button
            onClick={() => scroll('right')}
            className="flex-shrink-0 p-2 hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Profile/Actions */}
          <div className="flex-shrink-0 flex items-center gap-2 px-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-10 w-10 rounded-full"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>{profile?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
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
                    <Link to={`/profile/${session.user.id}`} className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/qr-scan" className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      Привязать устройство
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="text-xs">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
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