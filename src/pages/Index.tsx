import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Film, TrendingUp, Gamepad2, ArrowRight, Bookmark, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
  const [searchQuery, setSearchQuery] = useState("");

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

        <div className="relative z-10 grid md:grid-cols-[1.25fr_1fr] items-center gap-8 px-6 md:px-14 py-14 md:py-20">
          {/* Левая часть */}
          <div>
            <motion.img
              src="/logo.png"
              alt="ReverseX"
              className="h-16 md:h-20 w-auto object-contain mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            />

            <motion.h1
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mb-5"
            >
              <span className="block font-grotesk font-bold tracking-tight leading-none text-4xl sm:text-5xl md:text-6xl">
                Персональный трекер
              </span>
              <span className="block font-script leading-none mt-1 text-6xl sm:text-7xl md:text-8xl gradient-text drop-shadow-sm select-none">
                и рекомендации
              </span>
            </motion.h1>

            <motion.p
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="text-muted-foreground text-lg mb-9 max-w-lg"
            >
              Фильмы, сериалы и игры — в одном месте. Отмечайте просмотренное,
              собирайте личные топы и делитесь ими с друзьями.
            </motion.p>

            {/* Поиск */}
            <motion.div
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="relative max-w-2xl mb-8 group"
            >
              {/* анимированное градиентное свечение вокруг поиска */}
              <motion.div
                aria-hidden
                className="absolute -inset-[3px] rounded-2xl bg-gradient-to-r from-primary via-accent to-primary opacity-50 blur-[6px]"
                animate={{ opacity: [0.25, 0.55, 0.25] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative flex items-center">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6 z-20" />
                <Input
                  type="text"
                  placeholder="Поиск фильмов, сериалов и игр..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-14 pr-32 h-16 text-lg md:text-xl bg-card/90 backdrop-blur-md border-white/10 focus-visible:border-transparent focus-visible:ring-0 relative z-10 rounded-2xl"
                />
                <Button
                  size="sm"
                  className="absolute right-2.5 z-20 h-11 px-5 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
                >
                  Искать
                </Button>
              </div>
            </motion.div>

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
