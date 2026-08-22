import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Search, Tv } from 'lucide-react';
import { showsData } from './data/shows';
import WSShowCard from './components/WSShowCard';

export default function WSHome() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Все');

  const genres = ['Все', ...Array.from(new Set(showsData.map((s) => s.genre)))].sort();

  const filteredShows = useMemo(() => {
    return showsData.filter((show) => {
      const matchesSearch = show.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === 'Все' || show.genre === selectedGenre;
      return matchesSearch && matchesGenre;
    });
  }, [searchQuery, selectedGenre]);

  return (
    <div className="min-h-screen font-sans selection:bg-pink-500/30 pt-8 pb-24 md:pb-8 bg-[#050505]">
      {/* Hero section with reversex logo */}
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 py-8">
          <div className="flex-shrink-0">
            <img
              src="/logo.png"
              alt="ReverseX"
              className="h-24 md:h-32 w-auto drop-shadow-[0_0_30px_rgba(255,0,255,0.3)]"
            />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-lg">
              Топ-40 Сериалов
            </h1>
            <p className="text-gray-400 text-lg">
              Официальный рейтинг ReverseX. Выбирайте лучшее.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4">
        {/* Search */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Поиск сериалов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-white/5 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 focus:bg-white/10 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 overflow-x-auto pb-6 mb-6 scrollbar-hide snap-x">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`snap-start whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] border ${
                selectedGenre === genre
                  ? 'bg-pink-500/20 border-pink-500/50 text-pink-300 shadow-[0_0_15px_rgba(255,0,255,0.2)]'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredShows.map((show) => {
              const rank = showsData.findIndex(s => s.id === show.id) + 1;
              return (
                <WSShowCard key={show.id} show={show} rank={rank} />
              );
            })}
          </AnimatePresence>
        </div>

        {filteredShows.length === 0 && (
          <div className="py-20 text-center bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] rounded-3xl mt-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
              <Tv className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Ничего не найдено</h3>
            <p className="text-gray-400">Попробуйте изменить поисковый запрос или жанр</p>
          </div>
        )}
      </main>

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
}
