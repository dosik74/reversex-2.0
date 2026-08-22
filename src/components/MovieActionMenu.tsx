import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, Check, Clock, BookmarkPlus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MovieActionMenuProps {
  movieId: number;
  movieTitle: string;
  currentRating?: number;
  currentStatus?: 'watched' | 'planned' | 'abandoned' | null;
  onRatingChange?: (rating: number) => void;
  onStatusChange?: (status: 'watched' | 'planned' | 'abandoned' | null) => void;
}

const MovieActionMenu = ({
  movieId,
  movieTitle,
  currentRating = 0,
  currentStatus = null,
  onRatingChange,
  onStatusChange
}: MovieActionMenuProps) => {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleRatingClick = (rating: number) => {
    onRatingChange?.(rating);
    // Auto-move to "watched" when rating is set
    if (rating > 0 && currentStatus !== 'watched') {
      onStatusChange?.('watched');
    }
    setShowMenu(false);
  };

  const handleStatusClick = (status: 'watched' | 'planned' | 'abandoned') => {
    onStatusChange?.(status);
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setShowMenu(!showMenu)}
        variant="outline"
        size="sm"
        className="w-full bg-yellow-600/20 border-yellow-600/50 hover:bg-yellow-600/30 text-yellow-400"
      >
        + Добавить
      </Button>

      {showMenu && (
        <div className="absolute top-full mt-2 right-0 z-50 bg-gray-900 border border-yellow-600/50 rounded-lg p-3 w-80 shadow-2xl">
          {/* Rating Section */}
          <div className="mb-4 pb-4 border-b border-gray-700">
            <p className="text-sm text-gray-300 mb-2 font-semibold">Оценить фильм</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <button
                  key={rating}
                  onMouseEnter={() => setHoveredRating(rating)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => handleRatingClick(rating)}
                  className={`flex items-center justify-center w-7 h-7 rounded transition-all ${
                    rating <= (hoveredRating || currentRating)
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  <span className="text-xs font-bold">{rating}</span>
                </button>
              ))}
            </div>
            {currentRating > 0 && (
              <p className="text-xs text-yellow-400 mt-2">
                ⭐ Ваша оценка: {currentRating}/10
              </p>
            )}
          </div>

          {/* Status Section */}
          <div className="space-y-2">
            <p className="text-sm text-gray-300 font-semibold mb-2">Статус просмотра</p>
            
            <button
              onClick={() => handleStatusClick('watched')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                currentStatus === 'watched'
                  ? 'bg-green-600/50 text-green-300 border border-green-600'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }`}
            >
              <Check size={16} />
              <span className="text-sm">Просмотрено</span>
            </button>

            <button
              onClick={() => handleStatusClick('planned')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                currentStatus === 'planned'
                  ? 'bg-blue-600/50 text-blue-300 border border-blue-600'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }`}
            >
              <Clock size={16} />
              <span className="text-sm">В планах</span>
            </button>

            <button
              onClick={() => handleStatusClick('abandoned')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                currentStatus === 'abandoned'
                  ? 'bg-red-600/50 text-red-300 border border-red-600'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }`}
            >
              <Trash2 size={16} />
              <span className="text-sm">Отложено</span>
            </button>
          </div>

          {/* Clear Button */}
          {(currentRating > 0 || currentStatus) && (
            <button
              onClick={() => {
                onRatingChange?.(0);
                onStatusChange?.(null);
                setShowMenu(false);
              }}
              className="w-full mt-3 px-3 py-2 text-xs text-gray-400 hover:text-gray-300 border border-gray-600 rounded hover:bg-gray-700/50 transition-colors"
            >
              Очистить
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MovieActionMenu;
