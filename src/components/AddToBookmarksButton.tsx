import { useState, useEffect } from 'react';
import { Bookmark, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import * as bookmarkService from '@/services/bookmarkService';
import { ContentStatus, ContentType, CONTENT_STATUS_CONFIG } from '@/types/anime';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';

interface AddToBookmarksButtonProps {
  contentId: string;
  contentType: ContentType;
  title: string;
  posterUrl?: string;
  externalRating?: number;
  genre?: string;
  releaseYear?: string;
  totalItems?: number;
  synopsis?: string;
}

export default function AddToBookmarksButton({
  contentId,
  contentType,
  title,
  posterUrl,
  externalRating,
  genre,
  releaseYear,
  totalItems,
  synopsis,
}: AddToBookmarksButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ContentStatus | null>(null);

  const statuses: ContentStatus[] = ['watching', 'planned', 'watched', 'postponed', 'dropped', 'favorite'];

  // Check if already bookmarked on mount
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user?.id || cancelled) return;
        const existing = await bookmarkService.checkBookmarkExists(userData.user.id, contentId, contentType);
        if (!cancelled && existing) {
          setIsAdded(true);
          setCurrentStatus(existing.status);
        }
      } catch {
        // silently fail
      }
    };
    check();
    return () => { cancelled = true; };
  }, [contentId, contentType]);

  const handleAddToBookmarks = async (status: ContentStatus) => {
    try {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) {
        toast.error('Требуется вход');
        return;
      }

      // Upsert handles duplicates automatically
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
        totalItems: totalItems || 0,
        isFavorite: status === 'favorite',
        userRating: 0,
        progress: 0,
        notes: '',
      });

      setIsAdded(true);
      setCurrentStatus(status);
      setIsOpen(false);

      const action = currentStatus ? 'Обновлено' : 'Добавлено';
      toast.success(`${action} → "${CONTENT_STATUS_CONFIG[status].label}"`);
    } catch (error) {
      console.error('Error adding to bookmarks:', error);
      toast.error('Ошибка при добавлении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant={isAdded ? 'default' : 'outline'}
          className={`gap-2 transition-all duration-300 ${isAdded
              ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg shadow-purple-500/25'
              : 'hover:border-purple-500/50'
            }`}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isAdded ? (
            <Check className="w-4 h-4" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
          {isAdded
            ? currentStatus
              ? CONTENT_STATUS_CONFIG[currentStatus].label
              : 'Добавлено'
            : 'В закладки'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-2 text-sm font-semibold text-muted-foreground">
          {isAdded ? 'Изменить статус:' : 'Выбери статус:'}
        </div>
        <DropdownMenuSeparator />
        {statuses.map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleAddToBookmarks(status)}
            disabled={loading}
            className={`cursor-pointer ${currentStatus === status ? 'bg-purple-500/15' : ''}`}
          >
            <div
              className={`w-3 h-3 rounded-full mr-2 ${CONTENT_STATUS_CONFIG[status].bgColor}`}
            />
            <span className={CONTENT_STATUS_CONFIG[status].color}>
              {CONTENT_STATUS_CONFIG[status].label}
            </span>
            {currentStatus === status && <Check className="w-3 h-3 ml-auto text-purple-400" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
