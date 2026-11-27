import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Star, ArrowLeft, Info } from 'lucide-react';
import { showsData } from './data/shows';
import { useTMDB } from './hooks/useTMDB';
import EpisodeRatings from '@/components/EpisodeRatings';
import ContentActionsButton from '@/components/ContentActionsButton';

export default function WSShowPage() {
  const { id } = useParams();
  return <ShowPage key={id} id={id} />;
}

function ShowPage({ id }: { id?: string }) {
  const show = showsData.find(s => s.id === Number(id));
  const { posterUrl, backdropUrl, overview, rating, tmdbId, year, loading } = useTMDB(show?.title || '');

  if (!show) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white font-sans">
        <div className="text-center bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] p-10 rounded-3xl">
          <h1 className="text-3xl font-bold mb-4">Сериал не найден</h1>
          <Link to="/ws" className="text-pink-400 hover:text-pink-300 underline">
            Вернуться к сериалам
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative font-sans selection:bg-pink-500/30 pb-24 md:pb-8">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        {backdropUrl && (
          <img src={backdropUrl} alt="Backdrop" className="w-full h-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-8">
        <Link
          to="/ws"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors mb-8 bg-white/5 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>К списку сериалов</span>
        </Link>

        {/* Top Section */}
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full md:w-1/3 lg:w-1/4 shrink-0"
          >
            <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-white/10 bg-white/5 backdrop-blur-xl">
              {!loading && posterUrl ? (
                <img src={posterUrl} alt={show.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20">
                  Загрузка...
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 pt-4"
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="px-4 py-1.5 bg-pink-500/10 backdrop-blur-md rounded-full border border-pink-500/20 text-pink-400 font-bold uppercase tracking-wider text-sm shadow-[0_0_15px_rgba(255,0,255,0.1)]">
                {show.genre}
              </span>
              <span className="flex items-center gap-1.5 text-yellow-400 font-bold text-lg bg-black/40 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
                <Star className="fill-yellow-400 w-5 h-5" />
                {rating > 0 ? rating.toFixed(1) : '9.8'}
              </span>
            </div>

            <h1 className="font-script text-5xl md:text-7xl font-bold text-white mb-8 drop-shadow-lg leading-tight">
              {show.title}
            </h1>

            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-5 mb-8">
              {/* Закладки — первый акцент */}
              {tmdbId > 0 && (
                <ContentActionsButton
                  contentId={String(tmdbId)}
                  contentType="series"
                  top50MediaType="anime"
                  title={show.title}
                  posterUrl={posterUrl}
                  externalRating={rating}
                  releaseYear={year}
                  synopsis={overview}
                  variant="detail"
                />
              )}

              <a
                href={show.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center gap-4 w-full md:w-auto md:inline-flex bg-pink-600 hover:bg-pink-500 text-white font-bold py-5 px-10 rounded-2xl shadow-[0_0_40px_rgba(236,72,153,0.8)] transition-all transform hover:scale-105 border border-pink-400/50"
              >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out rounded-2xl" />
              <Play className="w-8 h-8 md:w-10 md:h-10 fill-white relative z-10" />
              <span className="relative z-10 text-2xl md:text-3xl uppercase tracking-wider">
                Смотреть сериал
              </span>
            </a>
            <p className="text-gray-400 text-sm md:ml-2 mt-3 md:mt-0">
              Откроется в новой вкладке (внешний плеер)
            </p>
            </div>
          </motion.div>
        </div>

        {/* Middle Section: Plot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] rounded-3xl p-8 md:p-10 mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Info className="w-6 h-6 text-pink-500" />
            О сюжете
          </h2>
          <p className="text-gray-300 text-lg md:text-xl leading-relaxed">
            {overview ||
              "Захватывающая история, которая держит в напряжении с первой до последней минуты. Главные герои сталкиваются с невероятными испытаниями, проверяющими их на прочность. Этот сериал — настоящий шедевр, который нельзя пропустить."}
          </p>
        </motion.div>

        {/* Bottom Section: Episodes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {tmdbId ? <EpisodeRatings key={tmdbId} seriesId={tmdbId} /> :
            <p className="text-gray-400">{loading ? 'Загружаем серии…' : 'Список серий недоступен'}</p>}
        </motion.div>
      </div>
    </div>
  );
}
