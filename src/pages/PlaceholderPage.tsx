import { Music, BookOpen } from 'lucide-react';

const SECTIONS: Record<string, { script: string; glow: string; accent: string; icon: any; desc: string }> = {
  Music: {
    script: 'Мелодия',
    glow: 'from-pink-400 to-rose-500',
    accent: 'text-pink-400',
    icon: Music,
    desc: 'Треки, альбомы и исполнители — оценка и коллекция появятся здесь совсем скоро.',
  },
  Books: {
    script: 'Библиотека',
    glow: 'from-amber-400 to-orange-500',
    accent: 'text-amber-400',
    icon: BookOpen,
    desc: 'Книги, авторы и чтение с отслеживанием прогресса — уже в разработке.',
  },
};

const PlaceholderPage = ({ title, icon: Icon }: { title: string; icon: any }) => {
  const s = SECTIONS[title] || {
    script: title,
    glow: 'from-purple-500 to-violet-600',
    accent: 'text-purple-400',
    icon: Icon,
    desc: `Раздел «${title}» находится в разработке.`,
  };

  return (
    <div className="min-h-screen">
      <style>{`
        .ph-in { animation: ph-fade .5s cubic-bezier(.16,1,.3,1) both; }
        .ph-pop { animation: ph-pop .6s cubic-bezier(.16,1,.3,1) both; }
        @keyframes ph-fade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ph-pop { from { opacity: 0; transform: scale(.85) rotate(-4deg); } to { opacity: 1; transform: scale(1) rotate(3deg); } }
      `}</style>

      <div className="relative overflow-hidden">
        <div className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full blur-[130px] opacity-[0.18] bg-gradient-to-br ${s.glow} pointer-events-none`} />

        <div className="relative container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
          <p className={`font-script text-3xl ${s.accent} ph-in`}>{s.script}</p>
          <h1 className="font-grotesk text-5xl sm:text-6xl font-bold text-white tracking-tight mt-2 mb-4 ph-in" style={{ animationDelay: '60ms' }}>
            {title}
          </h1>
          <p className="text-sm text-zinc-500 max-w-md mb-10 ph-in" style={{ animationDelay: '120ms' }}>
            {s.desc}
          </p>

          <div className={`w-32 h-32 rounded-[2rem] bg-gradient-to-br ${s.glow} flex items-center justify-center shadow-2xl ph-pop`} style={{ animationDelay: '200ms' }}>
            <Icon className="w-14 h-14 text-black/80" />
          </div>

          <span className="mt-10 px-4 py-2 rounded-full text-xs font-semibold bg-white/[0.04] border border-white/[0.06] text-zinc-400 ph-in" style={{ animationDelay: '280ms' }}>
            Скоро · Coming soon
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
