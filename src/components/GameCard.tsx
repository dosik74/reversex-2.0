import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import ContentActionsButton from "@/components/ContentActionsButton";
import { formatVotes } from "@/utils/rawgApi";

interface Game {
  id: number;
  title: string;
  year: string;
  rating: number;
  ratingsCount?: number;
  poster: string;
  description: string;
}

/** RAWG-шкала 0–5 (не 0–10 как у TMDB) */
const ratingColor = (r: number) =>
  r >= 4.3 ? 'bg-green-500' : r >= 3.4 ? 'bg-yellow-500' : 'bg-red-500';

const FALLBACK_IMAGE = 'https://placehold.co/342x513/1a1a2e/ffffff?text=No+Image';

const GameCard = ({ game }: { game: Game }) => {

  const posterUrl = useMemo(() => {
    if (!game.poster) return FALLBACK_IMAGE;
    return game.poster.replace('/w500/', '/w342/');
  }, [game.poster]);

  return (
    <Link to={`/game/${game.id}`}>
      <Card className="overflow-hidden hover-lift cursor-pointer group relative">
        <div className="aspect-[2/3] relative overflow-hidden bg-muted">
          <img
            src={posterUrl}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
          {/* Бейдж — только если оценок достаточно, иначе это шум */}
          {(() => {
            const votes = game.ratingsCount || 0;
            if (votes < 10) return null;
            const r = Number(game.rating);
            return (
              <span className={`absolute bottom-2 right-2 z-10 ${ratingColor(r)} text-black text-sm font-bold px-2 py-0.5 rounded-md shadow-lg group-hover:opacity-0 transition-opacity`}>
                {r.toFixed(1)}
              </span>
            );
          })()}
          <div className="absolute top-2 right-2 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
            <ContentActionsButton
              contentId={game.id.toString()}
              contentType="game"
              top50MediaType="game"
              title={game.title}
              posterUrl={posterUrl}
              externalRating={game.rating}
              releaseYear={game.year}
              synopsis={game.description}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex items-center gap-1 text-yellow-400 mb-1">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-semibold">{Number(game.rating).toFixed(1)}</span>
              {(game.ratingsCount || 0) > 0 && (
                <span className="text-xs text-white/60">· {formatVotes(game.ratingsCount)} оценок</span>
              )}
            </div>
            <h3 className="text-base font-semibold text-white line-clamp-2">{game.title}</h3>
            <p className="text-xs text-white/70">{game.year}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default GameCard;
