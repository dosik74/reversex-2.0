import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useIMDbRating } from "@/hooks/useIMDbRating";
import ContentActionsButton from "@/components/ContentActionsButton";

interface Series {
  id: number;
  title: string;
  year: string;
  rating: number;
  poster: string;
  description?: string;
}

const FALLBACK_IMAGE = 'https://placehold.co/342x513/1a1a2e/ffffff?text=No+Image';

const SeriesCard = ({ series }: { series: Series }) => {
  const { rating: imdbRating, loading: imdbLoading } = useIMDbRating({
    tmdbId: series.id,
    mediaType: 'tv'
  });

  const posterUrl = useMemo(() => {
    if (!series.poster) return FALLBACK_IMAGE;
    return series.poster.replace('/w500/', '/w342/');
  }, [series.poster]);

  return (
    <Link to={`/series/${series.id}`}>
      <Card className="overflow-hidden hover-lift cursor-pointer group relative">
        <div className="aspect-[2/3] relative overflow-hidden bg-muted">
          <img
            src={posterUrl}
            alt={series.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
          <div className="absolute top-2 right-2 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
            <ContentActionsButton
              contentId={series.id.toString()}
              contentType="series"
              top50MediaType="anime"
              title={series.title}
              posterUrl={posterUrl}
              externalRating={series.rating}
              releaseYear={series.year}
              synopsis={series.description}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex items-center gap-2 text-yellow-400 mb-1">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-semibold">{Number(series.rating).toFixed(1)}</span>
              </div>
              {imdbRating && imdbRating.imdbRating !== null && (
                <div className="flex items-center gap-1 text-yellow-300">
                  <span className="text-xs font-bold">|</span>
                  <span className="text-xs font-bold">IMDb</span>
                  <span className="text-sm font-semibold">{imdbRating.imdbRating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <h3 className="text-sm font-semibold text-white line-clamp-2">{series.title}</h3>
            <p className="text-xs text-white/70">{series.year}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default SeriesCard;
