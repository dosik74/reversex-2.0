import { useState, useCallback, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import supabase from "@/utils/supabase";
import { toast } from "sonner";
import AddToBookmarksButton from "@/components/AddToBookmarksButton";
import QuickAddContentButton from "@/components/QuickAddMovieButton";

interface Game {
  id: number;
  title: string;
  year: string;
  rating: number;
  poster: string;
  description: string;
}

const FALLBACK_IMAGE = 'https://placehold.co/342x513/1a1a2e/ffffff?text=No+Image';

const GameCard = ({ game }: { game: Game }) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentUser = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
      return data.user?.id;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  }, []);

  const handleAddToTop50 = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!currentUserId) {
        toast.error('Войдите в аккаунт чтобы добавить в Top 50');
        return;
      }

      setLoading(true);
      try {
        let topListId: string | undefined;

        const { data: existingList, error: listError } = await supabase
          .from('top_lists')
          .select('id')
          .eq('user_id', currentUserId)
          .eq('media_type', 'game')
          .single();

        if (existingList) {
          topListId = existingList.id;
        } else if (!listError || listError.code === 'PGRST116') {
          const { data: newList, error: createError } = await supabase
            .from('top_lists')
            .insert({ user_id: currentUserId, title: 'Top 50 Games', media_type: 'game' })
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
          .eq('item_id', game.id.toString())
          .single();

        if (existingItem) {
          toast.info('Уже в Top 50');
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
          item_id: game.id.toString(),
          rank: nextRank,
          title: game.title,
          poster_url: game.poster,
        });

        if (insertError) throw insertError;
        toast.success('Добавлено в Top 50');
      } catch (error) {
        console.error(error);
        toast.error('Ошибка при добавлении в Top 50');
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, game.id]
  );

  const posterUrl = useMemo(() => {
    if (!game.poster) return FALLBACK_IMAGE;
    return game.poster.replace('/w500/', '/w342/');
  }, [game.poster]);

  // Initialize user on mount
  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

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
          <div className="absolute top-2 right-2 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 flex flex-col gap-2">
            <QuickAddContentButton
              contentId={game.id.toString()}
              contentType="game"
              title={game.title}
              posterUrl={posterUrl}
              externalRating={game.rating}
              releaseYear={game.year}
              synopsis={game.description}
            />
            <AddToBookmarksButton
              contentId={game.id.toString()}
              contentType="game"
              title={game.title}
              posterUrl={posterUrl}
              externalRating={game.rating}
              releaseYear={game.year}
              synopsis={game.description}
            />
          </div>
          <button
            onClick={handleAddToTop50}
            disabled={loading}
            className="absolute top-12 right-2 z-10 bg-black/50 hover:bg-black/70 p-2 rounded-full transition-all duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-50"
            title="Добавить в Top 50"
          >
            <Plus className="w-5 h-5 transition-colors text-white" />
          </button>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex items-center gap-1 text-yellow-400 mb-1">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-semibold">{Number(game.rating).toFixed(1)}</span>
            </div>
            <h3 className="text-sm font-semibold text-white line-clamp-2">{game.title}</h3>
            <p className="text-xs text-white/70">{game.year}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default GameCard;
