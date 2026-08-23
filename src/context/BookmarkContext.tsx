import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import supabase from '@/lib/supabase';
import { ContentBookmark, ContentStatus, ContentType } from '@/types/anime';
import { toast } from 'sonner';

interface Top50Item {
  itemId: string;
  listId: string;
  title: string;
}

interface BookmarkContextValue {
  userId: string | null;
  bookmarks: ContentBookmark[];
  loading: boolean;
  getBookmark: (contentType: ContentType, contentId: string) => ContentBookmark | null;
  isBookmarked: (contentType: ContentType, contentId: string) => boolean;
  isInTop50: (mediaType: string, itemId: string) => boolean;
  setStatus: (data: {
    contentType: ContentType;
    contentId: string;
    title: string;
    posterUrl?: string;
    externalRating?: number;
    genre?: string;
    releaseYear?: string;
    synopsis?: string;
    status: ContentStatus;
    userRating?: number;
  }) => void;
  removeBookmark: (contentType: ContentType, contentId: string) => void;
  updateRating: (id: string, rating: number) => void;
  toggleTop50: (mediaType: string, item: { id: string; title: string; posterUrl?: string }) => void;
  refresh: () => Promise<void>;
}

const BookmarkContext = createContext<BookmarkContextValue | undefined>(undefined);

function toCamel(row: any): ContentBookmark {
  return {
    id: row.id,
    userId: row.user_id,
    contentType: row.content_type,
    contentId: String(row.content_id),
    title: row.title,
    posterUrl: row.poster_url,
    status: row.status,
    userRating: row.user_rating ?? 0,
    externalRating: row.external_rating,
    progress: row.progress ?? 0,
    totalItems: row.total_items ?? 0,
    isFavorite: row.is_favorite ?? false,
    notes: row.notes ?? '',
    synopsis: row.synopsis,
    genre: row.genre,
    releaseYear: row.release_year,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<ContentBookmark[]>([]);
  const [top50, setTop50] = useState<Record<string, Map<string, Top50Item>>>({});
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const [bmRes, listsRes] = await Promise.all([
        supabase.from('content_bookmarks').select('*').eq('user_id', uid).order('updated_at', { ascending: false }),
        supabase.from('top_lists').select('id, media_type').eq('user_id', uid),
      ]);
      if (bmRes.error) throw bmRes.error;
      setBookmarks((bmRes.data || []).map(toCamel));

      const map: Record<string, Map<string, Top50Item>> = {};
      const lists = listsRes.data || [];
      if (lists.length > 0) {
        const listIds = lists.map((l: any) => l.id);
        const itemsRes = await supabase
          .from('top_list_items')
          .select('id, top_list_id, item_id, title')
          .in('top_list_id', listIds);
        if (!itemsRes.error) {
          const listById = Object.fromEntries(lists.map((l: any) => [l.id, l.media_type]));
          for (const item of itemsRes.data || []) {
            const mt = listById[item.top_list_id];
            if (!mt) continue;
            if (!map[mt]) map[mt] = new Map();
            map[mt].set(String(item.item_id), { itemId: String(item.item_id), listId: item.top_list_id, title: item.title });
          }
        }
      }
      setTop50(map);
    } catch (e) {
      console.error('BookmarkContext load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const uid = data.user?.id || null;
      setUserId(uid);
      if (uid) loadAll(uid);
      else setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      if (uid) loadAll(uid);
      else {
        setBookmarks([]);
        setTop50({});
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [loadAll]);

  const getBookmark = useCallback(
    (contentType: ContentType, contentId: string) =>
      bookmarks.find((b) => b.contentType === contentType && b.contentId === String(contentId)) || null,
    [bookmarks]
  );

  const isBookmarked = useCallback(
    (contentType: ContentType, contentId: string) => !!getBookmark(contentType, contentId),
    [getBookmark]
  );

  const isInTop50 = useCallback(
    (mediaType: string, itemId: string) => !!top50[mediaType]?.has(String(itemId)),
    [top50]
  );

  const setStatus: BookmarkContextValue['setStatus'] = useCallback(
    (data) => {
      if (!userId) {
        toast.error('Требуется вход');
        return;
      }
      const now = new Date().toISOString();
      const existing = bookmarks.find(
        (b) => b.contentType === data.contentType && b.contentId === String(data.contentId)
      );

      // Optimistic instant update
      let optimisticRow: ContentBookmark;
      if (existing) {
        optimisticRow = {
          ...existing,
          status: data.status,
          isFavorite: data.status === 'favorite',
          userRating: data.userRating !== undefined ? data.userRating : existing.userRating,
          updatedAt: now,
        };
        setBookmarks((prev) => prev.map((b) => (b.id === existing.id ? optimisticRow : b)));
      } else {
        optimisticRow = {
          id: `temp-${Date.now()}`,
          userId,
          contentType: data.contentType,
          contentId: String(data.contentId),
          title: data.title,
          posterUrl: data.posterUrl,
          status: data.status,
          userRating: data.userRating ?? 0,
          externalRating: data.externalRating,
          progress: 0,
          totalItems: 0,
          isFavorite: data.status === 'favorite',
          synopsis: data.synopsis,
          genre: data.genre,
          releaseYear: data.releaseYear,
          createdAt: now,
          updatedAt: now,
        };
        setBookmarks((prev) => [optimisticRow, ...prev]);
      }

      // Background sync
      const sync = async () => {
        if (existing) {
          const updates: any = { status: data.status, is_favorite: data.status === 'favorite', updated_at: now };
          if (data.userRating !== undefined) updates.user_rating = data.userRating;
          const { error } = await supabase.from('content_bookmarks').update(updates).eq('id', existing.id);
          if (error) throw error;
        } else {
          const insertData: Record<string, any> = {
            user_id: userId,
            content_type: data.contentType,
            content_id: String(data.contentId),
            title: data.title,
            status: data.status,
            is_favorite: data.status === 'favorite',
            user_rating: data.userRating ?? 0,
            progress: 0,
            total_items: 0,
          };
          if (data.posterUrl) insertData.poster_url = data.posterUrl;
          if (data.externalRating != null) insertData.external_rating = data.externalRating;
          if (data.genre) insertData.genre = data.genre;
          if (data.releaseYear) insertData.release_year = data.releaseYear;
          if (data.synopsis) insertData.synopsis = data.synopsis;

          // Upsert-style guard against duplicates from race conditions
          const { data: rows, error } = await supabase
            .from('content_bookmarks')
            .upsert(insertData, { onConflict: 'user_id,content_id,content_type' })
            .select()
            .single();
          if (error) throw error;

          // Replace temp row with real DB row
          if (rows) {
            const real = toCamel(rows);
            setBookmarks((prev) => prev.map((b) => (b.id === optimisticRow.id ? real : b)));
          }
        }
      };

      sync().catch(async (err: any) => {
        console.error('Bookmark sync error:', err);
        // Revert on failure
        await loadAll(userId);
        toast.error('Не удалось сохранить закладку');
      });
    },
    [userId, bookmarks, loadAll]
  );

  const removeBookmark: BookmarkContextValue['removeBookmark'] = useCallback(
    (contentType, contentId) => {
      const existing = bookmarks.find(
        (b) => b.contentType === contentType && b.contentId === String(contentId)
      );
      if (!existing) return;
      const snapshot = bookmarks;
      setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
      supabase
        .from('content_bookmarks')
        .delete()
        .eq('id', existing.id)
        .then(({ error }) => {
          if (error) {
            console.error('Bookmark delete error:', error);
            setBookmarks(snapshot);
            toast.error('Не удалось удалить закладку');
          }
        });
    },
    [bookmarks]
  );

  const updateRating: BookmarkContextValue['updateRating'] = useCallback(
    (id, rating) => {
      const existing = bookmarks.find((b) => b.id === id);
      if (!existing) return;
      const snapshot = bookmarks;
      setBookmarks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, userRating: rating, updatedAt: new Date().toISOString() } : b))
      );
      supabase
        .from('content_bookmarks')
        .update({ user_rating: rating, updated_at: new Date().toISOString() })
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.error('Rating update error:', error);
            setBookmarks(snapshot);
            toast.error('Не удалось обновить оценку');
          }
        });
    },
    [bookmarks]
  );

  const toggleTop50: BookmarkContextValue['toggleTop50'] = useCallback(
    (mediaType, item) => {
      if (!userId) {
        toast.error('Требуется вход');
        return;
      }
      const currentList = top50[mediaType];
      const existingItem = currentList?.get(String(item.id));

      // Optimistic remove
      if (existingItem) {
        setTop50((prev) => {
          const copy = { ...prev };
          const m = new Map(copy[mediaType]);
          m.delete(String(item.id));
          copy[mediaType] = m;
          return copy;
        });
        supabase
          .from('top_list_items')
          .delete()
          .eq('top_list_id', existingItem.listId)
          .eq('item_id', String(item.id))
          .then(({ error }) => {
            if (error) {
              console.error('Top50 remove error:', error);
              toast.error('Не удалось убрать из Топ-50');
              loadAll(userId);
            } else {
              toast.success('Убрано из Топ-50');
            }
          });
        return;
      }

      // Optimistic add — find or create list first in memory
      const ensureAndAdd = async () => {
        let listId: string | undefined;
        const knownLists = Object.entries(top50)
          .filter(([mt]) => mt === mediaType)
          .flatMap(([, m]) => Array.from(m.values()));
        listId = knownLists[0]?.listId;

        if (!listId) {
          const { data: found } = await supabase
            .from('top_lists')
            .select('id')
            .eq('user_id', userId)
            .eq('media_type', mediaType)
            .maybeSingle();
          listId = found?.id;
          if (!listId) {
            const titles: Record<string, string> = {
              movie: 'Top 50 Movies',
              game: 'Top 50 Games',
              anime: 'Top 50 Anime',
              series: 'Top 50 Series',
            };
            const { data: created, error: createErr } = await supabase
              .from('top_lists')
              .insert({ user_id: userId, title: titles[mediaType] || 'Top 50', media_type: mediaType })
              .select('id')
              .single();
            if (createErr) throw createErr;
            listId = created!.id;
          }
        }

        const { data: maxRank } = await supabase
          .from('top_list_items')
          .select('rank')
          .eq('top_list_id', listId)
          .order('rank', { ascending: false })
          .limit(1);
        const nextRank = ((maxRank?.[0]?.rank as number) || 0) + 1;

        const { data: inserted, error } = await supabase
          .from('top_list_items')
          .insert({
            top_list_id: listId,
            item_id: String(item.id),
            rank: nextRank,
            title: item.title,
            poster_url: item.posterUrl,
          })
          .select()
          .single();
        if (error) throw error;

        setTop50((prev) => {
          const copy = { ...prev };
          const m = new Map(copy[mediaType] || []);
          m.set(String(item.id), { itemId: String(item.id), listId: listId!, title: item.title });
          copy[mediaType] = m;
          return copy;
        });
        return inserted;
      };

      // Optimistic UI immediately
      setTop50((prev) => {
        const copy = { ...prev };
        const m = new Map(copy[mediaType] || []);
        m.set(String(item.id), { itemId: String(item.id), listId: 'pending', title: item.title });
        copy[mediaType] = m;
        return copy;
      });

      ensureAndAdd()
        .then(() => toast.success('Добавлено в Топ-50'))
        .catch((err) => {
          console.error('Top50 add error:', err);
          setTop50((prev) => {
            const copy = { ...prev };
            const m = new Map(copy[mediaType] || []);
            m.delete(String(item.id));
            copy[mediaType] = m;
            return copy;
          });
          toast.error('Не удалось добавить в Топ-50');
        });
    },
    [userId, top50, loadAll]
  );

  const refresh = useCallback(async () => {
    if (userId) await loadAll(userId);
  }, [userId, loadAll]);

  const value = useMemo(
    () => ({
      userId,
      bookmarks,
      loading,
      getBookmark,
      isBookmarked,
      isInTop50,
      setStatus,
      removeBookmark,
      updateRating,
      toggleTop50,
      refresh,
    }),
    [userId, bookmarks, loading, getBookmark, isBookmarked, isInTop50, setStatus, removeBookmark, updateRating, toggleTop50, refresh]
  );

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}

export function useBookmarks() {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error('useBookmarks must be used within BookmarkProvider');
  return ctx;
}
