import { useState, useEffect } from "react";
import { Heart, Share2, BookmarkPlus, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import supabase from "@/utils/supabase";
import { Link } from "react-router-dom";
import { useIMDbRating } from "@/hooks/useIMDbRating";

interface MovieCardComponentProps {
  movie: {
    id: number;
    title: string;
    russian?: string;
    poster: string;
    rating: number;
    year: string;
    description: string;
  };
  onAction?: (action: string) => void;
}

const MovieCardComponent = ({ movie, onAction }: MovieCardComponentProps) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [loading, setLoading] = useState(false);
  const { rating: imdbRating, loading: imdbLoading } = useIMDbRating({
    tmdbId: movie.id,
    mediaType: 'movie'
  });

  useEffect(() => {
    checkUserActions();
  }, [movie.id]);

  const checkUserActions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Здесь должны быть запросы к таблицам favorite_movies и bookmarks
      // Пока оставляем значения по умолчанию
    } catch (error) {
      console.error("Error checking user actions:", error);
    }
  };

  const toggleFavorite = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to favorite movies");
        return;
      }

      // Здесь должна быть логика добавления/удаления из избранного
      setIsFavorited(!isFavorited);
      toast.success(isFavorited ? "Removed from favorites" : "Added to favorites");
      onAction?.("favorite");
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorite");
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to bookmark movies");
        return;
      }

      // Здесь должна быть логика добавления/удаления закладки
      setIsBookmarked(!isBookmarked);
      toast.success(isBookmarked ? "Removed bookmark" : "Bookmarked movie");
      onAction?.("bookmark");
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast.error("Failed to update bookmark");
    } finally {
      setLoading(false);
    }
  };

  const shareMovie = async () => {
    try {
      const movieUrl = `${window.location.origin}/movie/${movie.id}`;
      const shareText = `Check out "${movie.title}" on ReverseX!`;

      if (navigator.share) {
        await navigator.share({
          title: movie.title,
          text: shareText,
          url: movieUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(movieUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Image Container */}
      <Link to={`/movie/${movie.id}`}>
        <div className="relative aspect-[2/3] overflow-hidden bg-muted">
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />

          {/* Rating Badge */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            <Badge
              variant={movie.rating >= 7 ? "default" : "secondary"}
              className="gap-1"
            >
              ★ {movie.rating}
            </Badge>
            {imdbRating && imdbRating.imdbRating !== null && !imdbLoading && (
              <Badge className="gap-1 bg-yellow-600 text-black hover:bg-yellow-700">
                IMDb {imdbRating.imdbRating.toFixed(1)}
              </Badge>
            )}
            {imdbLoading && !imdbRating && (
              <Badge className="opacity-50">
                IMDb...
              </Badge>
            )}
          </div>

          {/* Year Badge */}
          {movie.year && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="opacity-90">
                {movie.year}
              </Badge>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <Link to={`/movie/${movie.id}`}>
          <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors">
            {movie.title}
          </h3>
        </Link>

        {movie.russian && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
            {movie.russian}
          </p>
        )}

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
          {movie.description}
        </p>

        {/* Actions */}
        <div className="flex gap-1 mt-3">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={toggleFavorite}
            disabled={loading}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground"
              }`}
            />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={toggleBookmark}
            disabled={loading}
            title={isBookmarked ? "Remove bookmark" : "Bookmark"}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-4 h-4 text-primary" />
            ) : (
              <BookmarkPlus className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={shareMovie}
            title="Share"
          >
            <Share2 className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MovieCardComponent;
