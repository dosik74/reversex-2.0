import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Show } from '../data/shows';
import { useTMDB } from '../hooks/useTMDB';

interface WSShowCardProps {
  show: Show;
  rank: number;
}

export default function WSShowCard({ show, rank }: WSShowCardProps) {
  const { posterUrl, loading } = useTMDB(show.title);

  return (
    <Link to={`/ws/show/${show.id}`}>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.3 }}
        className="group relative rounded-2xl overflow-hidden cursor-pointer bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-pink-500/50 hover:shadow-[0_0_30px_rgba(255,0,255,0.3)]"
      >
        {/* Rank Badge */}
        <div className="absolute top-2 left-2 z-20 flex items-center justify-center w-12 h-12 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.8)]">
          <span className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-pink-400 to-pink-600 drop-shadow-[0_0_10px_rgba(255,0,255,0.5)]">
            {rank}
          </span>
        </div>

        <div className="aspect-[2/3] w-full relative overflow-hidden bg-[#0a0a0a]">
          {!loading && posterUrl ? (
            <img
              src={posterUrl}
              alt={show.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20 text-sm font-medium">
              Загрузка...
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-14 h-14 rounded-full bg-pink-600/90 backdrop-blur-md flex items-center justify-center shadow-[0_0_25px_rgba(255,0,255,0.8)] transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
              <Play className="w-6 h-6 text-white fill-white ml-1" />
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <div className="text-xs font-bold text-pink-400 mb-1 drop-shadow-md uppercase tracking-wider">
            {show.genre}
          </div>
          <h3 className="text-white font-black text-lg leading-tight line-clamp-2 drop-shadow-lg">
            {show.title}
          </h3>
        </div>
      </motion.div>
    </Link>
  );
}
