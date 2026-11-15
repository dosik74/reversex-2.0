import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useIMDbRating } from "@/hooks/useIMDbRating";
import ContentActionsButton from "@/components/ContentActionsButton";
import PosterImage from "@/components/PosterImage";

interface Series {
  id: number;
  title: string;
  year: string;
  rating: number;
  poster: string;
  description?: string;
}

const SeriesCard = ({ series }: { series: Series }) => {
  const { rating: imdbRating, loading: imdbLoading } = useIMDbRating({
    tmdbId: series.id,
    mediaType: 'tv'
  });

  const posterUrl = useMemo(() => {
    if (!series.poster) return null;
    return series.poster.replace('/w500/', '/w342/');
  }, [series.poster]);

  return (
    <Link to={`/series/${series.id}`}>
      <Card className="overflow-hidden hover-lift cursor-pointer group relative">
        <div className="aspect-[2/3] relative overflow-hidden bg-zinc-950">
          <PosterImage
            src={posterUrl}
            alt={series.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {(() => {
            const r = Number(series.rating);
            const color = r >= 7 ? 'bg-green-500' : r >= 5 ? 'bg-yellow-500' : 'bg-red-500';
            return (
              <span className={`absolute bottom-2 right-2 z-10 ${color} text-black text-sm font-bold px-2 py-0.5 rounded-md shadow-lg group-hover:opacity-0 transition-opacity`}>
                {r.toFixed(1)}
              </span>
            );
          })()}
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
              <span className="text-sm font-semibold">{Number(series.rating).toFixed(1)}</span>
              {imdbRating && imdbRating.imdbRating !== null && (
                <div className="flex items-center gap-1 text-yellow-300">
                  <span className="text-xs font-bold">|</span>
                  <span className="text-xs font-bold">IMDb</span>
                  <span className="text-sm font-semibold">{imdbRating.imdbRating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <h3 className="font-script text-base font-semibold text-white line-clamp-2">{series.title}</h3>
            <p className="text-xs text-white/70">{series.year}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default SeriesCard;
