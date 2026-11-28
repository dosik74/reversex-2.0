import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search, Film, TrendingUp, Gamepad2, ArrowRight, Bookmark, Sparkles, Users, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import GlobalSearchResults from "@/components/GlobalSearchResults";
import {
  searchEverything,
  EMPTY_GLOBAL_RESULTS,
  GlobalSearchResultsData,
} from "@/services/globalSearchService";
import { useBookmarks } from "@/context/BookmarkContext";
import { useBeta } from "@/context/BetaContext";
import { useAppContext } from "@/context/AppContext";
import "@/styles/profile-fonts.css";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<GlobalSearchResultsData>(EMPTY_GLOBAL_RESULTS);
  const [searchLoading, setSearchLoading] = useState(false);

  const { bookmarks } = useBookmarks();
  const { isBetaEnabled } = useBeta();
  const { profile } = useAppContext();

  const requestSeqRef = useRef(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(
    async (raw: string, syncUrl = true) => {
      const trimmed = raw.trim();
      const seq = ++requestSeqRef.current;

      if (!trimmed) {
        setActiveQuery("");
        setSearchResults(EMPTY_GLOBAL_RESULTS);
        setSearchLoading(false);
        if (syncUrl && searchParams.has("q")) {
          const next = new URLSearchParams(searchParams);
          next.delete("q");
          setSearchParams(next, { replace: true });
        }
        return;
      }

      setActiveQuery(trimmed);
      setSearchLoading(true);

      if (syncUrl && searchParams.get("q") !== trimmed) {
        const next = new URLSearchParams(searchParams);
        next.set("q", trimmed);
        setSearchParams(next, { replace: true });
      }

      try {
        const data = await searchEverything(trimmed, {
          bookmarks,
          isBetaEnabled,
          currentProfile: profile,
        });
        if (requestSeqRef.current === seq) {
          setSearchResults(data);
        }
      } finally {
        if (requestSeqRef.current === seq) {
          setSearchLoading(false);
        }
      }
    },
    [bookmarks, isBetaEnabled, profile, searchParams, setSearchParams]
  );

  // Живой поиск с debounce при вводе (>= 2 символов) и очистка при пустом поле
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      if (activeQuery) {
        runSearch("", true);
      }
      return;
    }
    if (trimmed.length < 2 || trimmed === activeQuery) return;

    const timer = setTimeout(() => {
      runSearch(trimmed, true);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, activeQuery, runSearch]);

  // Поиск при первом рендере, если в URL уже есть ?q=...
  useEffect(() => {
    if (initialQuery.trim()) {
      runSearch(initialQuery, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    runSearch(searchQuery, true);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    runSearch("", true);
  };

  const features = [
    { icon: Bookmark, label: "Трекинг просмотренного" },
    { icon: Sparkles, label: "Умные рекомендации" },
    { icon: Users, label: "Профили и друзья" },
  ];

  return (
    <div className="w-full px-4 md:px-8 py-8">
      {/* ===== HERO ===== */}
      <div className="relative mb-16 overflow-hidden rounded-3xl border border-border shadow-xl bg-gradient-to-br from-primary/20 via-accent/10 to-background">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />

      {/* Абстрактные плавающие формы */}
        <motion.div
          aria-hidden
          className="absolute -top-24 right-[15%] w-80 h-80 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 blur-3xl"
          animate={{ y: [0, -34, 0], x: [0, 24, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute bottom-[-6rem] left-[38%] w-72 h-72 rounded-full bg-gradient-to-tr from-accent/35 to-primary/25 blur-3xl"
          animate={{ y: [0, 28, 0], x: [0, -20, 0], scale: [1, 1.18, 1] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        />
        {/* Вращающиеся кольца */}
        <motion.div
          aria-hidden
          className="absolute top-10 right-[8%] w-56 h-56 rounded-full border border-accent/40"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <span className="absolute top-1/2 left-1/2 w-2.5 h-2.5 -mt-1.5 -ml-1.5 rounded-full bg-accent shadow-[0_0_18px_hsl(25_100%_74%)]" />
        </motion.div>
        <motion.div
          aria-hidden
          className="absolute top-24 right-[14%] w-36 h-36 rounded-full border border-dashed border-primary/50"
          animate={{ rotate: -360 }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        >
          <span className="absolute -top-1 left-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_14px_hsl(256_45%_55%)]" />
        </motion.div>

        <div className="relative z-10 grid md:grid-cols-[1.25fr_1fr] items-center gap-8 px-4 sm:px-6 md:px-14 py-8 sm:py-14 md:py-20">
          {/* Левая часть */}
          <div className="min-w-0">
            <motion.img
              src="/logo.png"
              alt="ReverseX"
              className="h-12 sm:h-16 md:h-20 w-auto object-contain mb-4 sm:mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            />

            <motion.h1
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mb-4 sm:mb-5"
            >
              <span className="block font-grotesk font-bold tracking-tight leading-none text-3xl sm:text-5xl md:text-6xl">
                Персональный трекер
              </span>
              <span className="block font-script leading-none mt-1 text-5xl sm:text-7xl md:text-8xl gradient-text drop-shadow-sm select-none">
                и рекомендации
              </span>
            </motion.h1>

            <motion.p
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="text-muted-foreground text-sm sm:text-lg mb-6 sm:mb-9 max-w-lg"
            >
              Фильмы, сериалы и игры — в одном месте. Отмечайте просмотренное,
              собирайте личные топы и делитесь ими с друзьями.
            </motion.p>

            {/* Поиск */}
            <motion.form
              onSubmit={handleSearchSubmit}
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="relative max-w-2xl mb-6 sm:mb-8 group"
            >
              {/* анимированное градиентное свечение вокруг поиска */}
              <motion.div
                aria-hidden
                className="absolute -inset-[3px] rounded-2xl bg-gradient-to-r from-primary via-accent to-primary opacity-50 blur-[6px]"
                animate={{ opacity: [0.25, 0.55, 0.25] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 sm:left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 sm:w-6 sm:h-6 z-20 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Поиск по всему сайту..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 pr-24 sm:pl-14 sm:pr-40 h-14 sm:h-16 text-sm sm:text-base md:text-lg bg-card/90 backdrop-blur-md border-white/10 focus-visible:border-transparent focus-visible:ring-0 relative z-10 rounded-2xl"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Очистить поиск"
                    className="absolute right-[84px] sm:right-[104px] z-20 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  disabled={!searchQuery.trim() || searchLoading}
                  className="absolute right-2 sm:right-2.5 z-20 h-10 sm:h-11 px-3.5 sm:px-5 text-xs sm:text-sm rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
                >
                  {searchLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Искать"
                  )}
                </Button>
              </div>
            </motion.form>

            {/* Фичи */}
            <div className="flex flex-wrap gap-x-7 gap-y-2">
              {features.map(({ icon: Icon, label }, i) => (
                <motion.span
                  key={label}
                  custom={3 + i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Icon className="w-4 h-4 text-primary" />
                  {label}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Правая часть — абстрактная композиция */}
          <motion.div
            className="hidden md:flex relative h-96 items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-primary to-accent opacity-25 blur-3xl"
              animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.35, 0.2] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* орбита */}
            <motion.div
              aria-hidden
              className="absolute w-[22rem] h-[22rem] rounded-full border border-dashed border-accent/40"
              animate={{ rotate: 360 }}
              transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
            >
              <span className="absolute top-0 left-1/2 w-3 h-3 -ml-1.5 rounded-full bg-accent shadow-[0_0_20px_hsl(25_100%_74%)]" />
              <span className="absolute bottom-4 right-8 w-2 h-2 rounded-full bg-primary shadow-[0_0_16px_hsl(256_45%_58%)]" />
            </motion.div>
            <motion.img
              src="/logo.png"
              alt=""
              className="relative w-60 object-contain drop-shadow-2xl"
              animate={{ y: [0, -16, 0], rotate: [0, 2, 0, -2, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </div>

      {/* ===== РЕЗУЛЬТАТЫ ГЛОБАЛЬНОГО ПОИСКА ===== */}
      <div ref={resultsRef} className="scroll-mt-20">
        {activeQuery && (
          <GlobalSearchResults
            query={activeQuery}
            loading={searchLoading}
            results={searchResults}
            onClear={handleClearSearch}
          />
        )}
      </div>

      {/* ===== НАВИГАЦИЯ: bento-сетка ===== */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold tracking-tight">Перейти к</h2>
        <p className="text-muted-foreground mt-1">Выберите раздел каталога</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Movies Card — широкая */}
        <Link to="/movies" className="group md:col-span-2">
          <div className="relative h-64 md:h-full md:min-h-[280px] rounded-2xl overflow-hidden bg-gradient-to-br from-violet-700 to-violet-950 hover:scale-[1.02] transition-transform duration-300 shadow-lg">
            <Film className="absolute -right-6 -bottom-8 w-48 h-48 text-white/10 rotate-[-12deg] group-hover:rotate-0 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors" />
            <div className="absolute inset-0 p-7 flex flex-col justify-between z-10">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Film className="w-6 h-6 text-white" />
                </div>
                <span className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <ArrowRight className="w-5 h-5 text-white" />
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Фильмы</h3>
                <p className="text-white/80 mt-1">Найди свой любимый фильм</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Series Card */}
        <Link to="/series" className="group">
          <div className="relative h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-800 to-purple-950 hover:scale-[1.02] transition-transform duration-300 shadow-lg">
            <TrendingUp className="absolute -right-6 -bottom-8 w-44 h-44 text-white/10 rotate-[10deg] group-hover:rotate-0 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors" />
            <div className="absolute inset-0 p-7 flex flex-col justify-between z-10">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <ArrowRight className="w-5 h-5 text-white" />
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Сериалы</h3>
                <p className="text-white/80 mt-1">Смотри лучшие сериалы</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Games Card — широкая снизу */}
        <Link to="/games" className="group md:col-span-3">
          <div className="relative h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 hover:scale-[1.01] transition-transform duration-300 shadow-lg">
            <Gamepad2 className="absolute right-8 top-1/2 -translate-y-1/2 w-36 h-36 text-white/15 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-colors" />
            <div className="absolute inset-0 px-7 flex items-center justify-between gap-6 z-10">
              <div className="flex items-center gap-5 min-w-0">
                <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-2xl font-bold text-white truncate drop-shadow-sm">Игры</h3>
                  <p className="text-white/85 mt-1 truncate drop-shadow-sm">Исследуй популярные игры</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex bg-white/15 border-white/40 text-white hover:bg-white/25 hover:text-white flex-shrink-0"
              >
                Смотреть
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Index;
