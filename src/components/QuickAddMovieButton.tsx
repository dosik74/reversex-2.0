import { useState } from 'react';
import { ChevronDown, Star, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ContentStatus, ContentType, CONTENT_STATUS_CONFIG } from '@/types/anime';
import * as bookmarkService from '@/services/bookmarkService';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';

interface QuickAddContentButtonProps {
  contentId: string;
  contentType: ContentType;
  title: string;
  posterUrl?: string;
  externalRating?: number;
  releaseYear?: string;
  synopsis?: string;
  genre?: string;
}

export default function QuickAddContentButton({
  contentId,
  contentType,
  title,
  posterUrl,
  externalRating,
  releaseYear,
  synopsis,
  genre,
}: QuickAddContentButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const statuses: ContentStatus[] = ['watched', 'watching', 'planned', 'postponed', 'dropped'];

  const handleAddWithStatus = async (status: ContentStatus) => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) {
        toast.error('Требуется вход');
        return;
      }

      await bookmarkService.addToBookmarks(userData.user.id, {
        contentType,
        contentId,
        title,
        posterUrl,
        status,
        externalRating,
        genre,
        releaseYear,
        synopsis,
        totalItems: 0,
        isFavorite: false,
        userRating: 0,
        progress: 0,
        notes: '',
      });

      setShowMenu(false);
      toast.success(`Добавлено в "${CONTENT_STATUS_CONFIG[status].label}"`);
    } catch (error) {
      console.error('Error adding content:', error);
      toast.error('Ошибка при добавлении');
    } finally {
      setLoading(false);
    }
  };

  const handleRateAndWatch = async () => {
    try {
      const rating = parseFloat(userRating);
      if (isNaN(rating) || rating < 0 || rating > 10) {
        toast.error('Рейтинг должен быть от 0 до 10');
        return;
      }

      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) {
        toast.error('Требуется вход');
        return;
      }

      // Automatically add to "watched" (просмотрено) when rating
      await bookmarkService.addToBookmarks(userData.user.id, {
        contentType,
        contentId,
        title,
        posterUrl,
        status: 'watched',
        externalRating,
        genre,
        releaseYear,
        synopsis,
        totalItems: 0,
        isFavorite: false,
        userRating: rating,
        progress: 0,
        notes: '',
      });

      setShowRatingModal(false);
      setUserRating('');
      setShowMenu(false);
      toast.success('Добавлено в "Просмотрено" с оценкой');
    } catch (error) {
      console.error('Error rating content:', error);
      toast.error('Ошибка при оценке');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className="gap-1"
        disabled={loading}
      >
        <span>Добавить</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
      </Button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-20 min-w-[220px]">
          <div className="py-1">
            {/* Rate Option */}
            <button
              onClick={() => {
                setShowRatingModal(true);
              }}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700 transition-colors flex items-center gap-2"
            >
              <Star className="w-4 h-4" />
              Оценить
            </button>

            <div className="border-t border-zinc-700 my-1" />

            {/* Status Options */}
            <div className="px-2 py-1">
              <p className="text-xs text-zinc-400 font-semibold px-2 py-1">Добавить в:</p>
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => handleAddWithStatus(status)}
                  disabled={loading}
                  className={`w-full text-left px-4 py-2 text-xs transition-colors rounded ${
                    CONTENT_STATUS_CONFIG[status].bgColor
                  } text-white hover:opacity-80`}
                >
                  {CONTENT_STATUS_CONFIG[status].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowRatingModal(false)}
        >
          <Card 
            className="bg-zinc-900 border-zinc-800 w-80 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-4">Оценить</h3>

            <div className="mb-6">
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={userRating}
                onChange={(e) => setUserRating(e.target.value)}
                placeholder="Введите оценку (0-10)"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-center text-2xl font-bold"
                autoFocus
              />
              <p className="text-center text-xs text-zinc-400 mt-2">
                Например: 5.5, 7.6, 8.0
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors text-sm font-medium"
                disabled={loading}
              >
                Отмена
              </button>
              <button
                onClick={handleRateAndWatch}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={loading || !userRating}
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Добавляю...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Оценить
                  </>
                )}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
