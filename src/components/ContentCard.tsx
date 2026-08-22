import { ContentBookmark, CONTENT_STATUS_CONFIG } from "@/types/anime";
import { Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContentCardProps {
  bookmark: ContentBookmark;
  onUpdate: (bookmark: ContentBookmark) => void;
  onDelete: (id: string) => void;
  onFavorite: (id: string, isFav: boolean) => void;
}

const ContentCard = ({ bookmark, onUpdate, onDelete, onFavorite }: ContentCardProps) => {
  const statusConfig = CONTENT_STATUS_CONFIG[bookmark.status];
  const contentTypeLabel = {
    anime: "Аниме",
    movie: "Кино",
    series: "Сериал",
    game: "Игра",
  }[bookmark.contentType];

  const handleProgressChange = (newProgress: number) => {
    onUpdate({
      ...bookmark,
      progress: Math.min(newProgress, bookmark.totalItems || 1),
    });
  };

  const handleRatingChange = (newRating: number) => {
    onUpdate({
      ...bookmark,
      userRating: newRating,
    });
  };

  return (
    <div
      className={`group rounded-lg border-2 overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/20 ${statusConfig.borderColor} ${statusConfig.bgColor}`}
    >
      {/* Poster Image */}
      <div className="relative w-full h-48 sm:h-56 bg-muted overflow-hidden">
        {bookmark.posterUrl ? (
          <img
            src={bookmark.posterUrl}
            alt={bookmark.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span className="text-3xl opacity-20">{statusConfig.icon}</span>
          </div>
        )}

        {/* Status Badge */}
        <div
          className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold text-white ${
            statusConfig.color.replace("text-", "bg-")
          }`}
        >
          {statusConfig.label}
        </div>

        {/* Favorite Button */}
        <button
          onClick={() => onFavorite(bookmark.id, !bookmark.isFavorite)}
          className={`absolute top-2 left-2 p-2 rounded-full transition-all duration-200 ${
            bookmark.isFavorite
              ? "bg-yellow-400 text-yellow-900 shadow-lg"
              : "bg-black/40 text-white hover:bg-black/60"
          }`}
        >
          <Star
            size={18}
            className={bookmark.isFavorite ? "fill-current" : ""}
          />
        </button>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(bookmark.id)}
          className="absolute bottom-2 right-2 p-2 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Content Info */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* Title and Type */}
        <div>
          <h3 className="font-bold text-sm sm:text-base line-clamp-2 text-foreground">
            {bookmark.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 flex gap-2">
            <span>{contentTypeLabel}</span>
            {bookmark.releaseYear && <span>• {bookmark.releaseYear}</span>}
            {bookmark.genre && <span>• {bookmark.genre}</span>}
          </p>
        </div>

        {/* Rating */}
        {bookmark.externalRating && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rating:</span>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-lg ${
                    i < Math.floor(bookmark.externalRating! / 2)
                      ? "text-yellow-400"
                      : "text-gray-400"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs font-semibold ml-1">
              {bookmark.externalRating}/10
            </span>
          </div>
        )}

        {/* User Rating */}
        {bookmark.status !== "planned" && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Your rating:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingChange(star * 2)}
                    className={`transition-colors duration-200 ${
                      bookmark.userRating && bookmark.userRating >= star * 2
                        ? "text-amber-400"
                        : "text-gray-400 hover:text-amber-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {bookmark.totalItems && bookmark.status === "watching" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-semibold">
                {bookmark.progress || 0}/{bookmark.totalItems}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${statusConfig.color.replace(
                  "text-",
                  "bg-"
                )}`}
                style={{
                  width: `${Math.min(
                    ((bookmark.progress || 0) / bookmark.totalItems) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
            <div className="flex gap-1">
              <button
                onClick={() =>
                  handleProgressChange(Math.max((bookmark.progress || 0) - 1, 0))
                }
                className="text-xs px-2 py-1 bg-muted rounded hover:bg-primary/20 transition-colors"
              >
                −
              </button>
              <button
                onClick={() => handleProgressChange((bookmark.progress || 0) + 1)}
                className="text-xs px-2 py-1 bg-muted rounded hover:bg-primary/20 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Notes */}
        {bookmark.notes && (
          <p className="text-xs text-muted-foreground italic line-clamp-2">
            {bookmark.notes}
          </p>
        )}
      </div>
    </div>
  );
};

export default ContentCard;
