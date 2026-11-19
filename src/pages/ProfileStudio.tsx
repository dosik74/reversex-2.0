import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";

/**
 * Полная копия прототипа reversex_profile_studio.html.
 * Файл лежит в public/profile-studio.html и работает как автономное
 * приложение: все его функции (конструктор блоков, детали, текст,
 * шрифты, фоны, инспектор, undo, JSON) доступны один-в-один.
 */
const ProfileStudio = () => (
  <div className="fixed inset-0 z-[100] flex flex-col bg-[#090a0f]">
    <div className="flex h-11 shrink-0 items-center gap-4 border-b border-white/10 bg-[#0b0d13] px-4">
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Назад на сайт
      </Link>
      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-300">
        <Sparkles className="h-3.5 w-3.5" />
        Конструктор профиля
      </span>
      <span className="ml-auto hidden text-[11px] text-zinc-500 sm:block">
        Изменения сохраняются в этом браузере
      </span>
    </div>

    <iframe
      src="/profile-studio.html"
      title="Конструктор профиля ReverseX"
      className="min-h-0 w-full flex-1 border-0 bg-[#090a0f]"
    />
  </div>
);

export default ProfileStudio;
