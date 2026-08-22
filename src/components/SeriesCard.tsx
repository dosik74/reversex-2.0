import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Star, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import supabase from "@/utils/supabase";
import { toast } from "sonner";
import { useIMDbRating } from "@/hooks/useIMDbRating";
import AddToBookmarksButton from "@/components/AddToBookmarksButton";
import QuickAddContentButton from "@/components/QuickAddMovieButton";

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
  const [loading, setLoading] = useState(false);
  const { rating: imdbRating, loading: imdbLoading } = useIMDbRating({
    tmdbId: series.id,
    mediaType: 'tv'
  });

  const handleAddToTop50 = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Проверим пользователя еще раз перед добавлением
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;

      if (!userId) {
        toast.error('Please sign in to add to Top 50');
        return;
      }

      setLoading(true);
      try {
        let topListId: string | undefined;

        const { data: existingList, error: listError } = await supabase
          .from('top_lists')
          .select('id')
          .eq('user_id', userId)
          .eq('media_type', 'anime')
          .single();

        if (existingList) {
          topListId = existingList.id;
        } else if (!listError || listError.code === 'PGRST116') {
          const { data: newList, error: createError } = await supabase
            .from('top_lists')
            .insert({ user_id: userId, title: 'Top 50 Anime', media_type: 'anime' })
            .select('id')
            .single();

          if (createError) throw createError;
          topListId = newList?.id;
        }

        if (!topListId) throw new Error('Failed to create or find top list');

        const { data: existingItem } = await supabase
          .from('top_list_items')
          .select('id')
          .eq('top_list_id', topListId)
          .eq('item_id', series.id.toString())
          .single();

        if (existingItem) {
          toast.info('Already in Top 50');
          return;
        }

        const { data: items } = await supabase
          .from('top_list_items')
          .select('rank')
          .eq('top_list_id', topListId)
          .order('rank', { ascending: false })
          .limit(1);

        const nextRank = (items?.[0]?.rank || 0) + 1;

        const { error: insertError } = await supabase.from('top_list_items').insert({
          top_list_id: topListId,
          item_id: series.id.toString(),
          rank: nextRank,
          title: series.title,
          poster_url: series.poster,
        });

        if (insertError) throw insertError;
        toast.success('Added to Top 50');
      } catch (error) {
        console.error(error);
        toast.error('Failed to add to Top 50');
      } finally {
        setLoading(false);
      }
    },
    [series.id, series.title, series.poster]
  );

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
          <div className="absolute top-2 right-2 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 flex flex-col gap-2">
            <QuickAddContentButton
              contentId={series.id.toString()}
              contentType="series"
              title={series.title}
              posterUrl={posterUrl}
              externalRating={series.rating}
              releaseYear={series.year}
              synopsis={series.description}
            />
            <AddToBookmarksButton
              contentId={series.id.toString()}
              contentType="series"
              title={series.title}
              posterUrl={posterUrl}
              externalRating={series.rating}
              releaseYear={series.year}
              synopsis={series.description}
            />
          </div>
          <button
            onClick={handleAddToTop50}
            disabled={loading}
            className="absolute top-12 right-2 z-10 bg-black/50 hover:bg-black/70 p-2 rounded-full transition-all duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-50"
            title="Add to Top 50"
          >
            <Plus className="w-5 h-5 transition-colors text-white" />
          </button>
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
