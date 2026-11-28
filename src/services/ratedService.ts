import supabase from '@/lib/supabase';
import { getMovieDetails, getSeriesDetails, getMoviePosterUrl } from '@/utils/tmdbApi';
import { fetchRawg, RAWG_API_KEY } from '@/utils/rawgApi';
import { ContentStatus, ContentType } from '@/types/anime';

export interface RatedItem {
  key: string;
  contentId: string;
  contentType: ContentType;
  title: string;
  posterUrl?: string | null;
  userRating: number;
  externalRating?: number;
  releaseYear?: string;
  genre?: string;
  status?: ContentStatus;
  notes?: string;
  updatedAt: string;
  source: 'bookmark' | 'community' | 'legacy';
}

/**
 * Загружает все оценки указанного пользователя из content_bookmarks,
 * community_ratings и legacy-таблиц (user_movies / user_series / user_games) без дубликатов.
 */
export async function loadUserRatedItems(
  userId: string,
  existingBookmarkRated: RatedItem[] = []
): Promise<RatedItem[]> {
  const map = new Map<string, RatedItem>();
  for (const item of existingBookmarkRated) {
    map.set(item.key, item);
  }

  const [bmRes, commRes, legacyMoviesRes, legacySeriesRes, legacyGamesRes] = await Promise.allSettled([
    existingBookmarkRated.length === 0
      ? supabase
          .from('content_bookmarks')
          .select('content_id, content_type, title, poster_url, user_rating, external_rating, release_year, genre, status, notes, updated_at, created_at')
          .eq('user_id', userId)
          .gt('user_rating', 0)
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('community_ratings')
      .select('content_id, content_type, rating, updated_at, created_at')
      .eq('user_id', userId)
      .gt('rating', 0),
    supabase
      .from('user_movies')
      .select('movie_id, title, poster_path, release_date, rating, updated_at, created_at')
      .eq('user_id', userId)
      .gt('rating', 0),
    supabase
      .from('user_series')
      .select('series_id, title, poster_path, release_date, rating, updated_at, created_at')
      .eq('user_id', userId)
      .gt('rating', 0),
    supabase
      .from('user_games')
      .select('game_id, title, background_image, released, rating, updated_at, created_at')
      .eq('user_id', userId)
      .gt('rating', 0),
  ]);

  if (bmRes.status === 'fulfilled' && !bmRes.value.error && Array.isArray(bmRes.value.data)) {
    for (const b of bmRes.value.data as any[]) {
      const type = (b.content_type || 'movie') as ContentType;
      const id = String(b.content_id);
      const key = `${type}:${id}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          contentId: id,
          contentType: type,
          title: b.title,
          posterUrl: b.poster_url || null,
          userRating: Number(b.user_rating),
          externalRating: b.external_rating != null ? Number(b.external_rating) : undefined,
          releaseYear: b.release_year || undefined,
          genre: b.genre || undefined,
          status: b.status as ContentStatus,
          notes: b.notes || undefined,
          updatedAt: b.updated_at || b.created_at || '',
          source: 'bookmark',
        });
      }
    }
  }

  const addIfMissing = (item: RatedItem) => {
    if (!map.has(item.key)) {
      map.set(item.key, item);
    }
  };

  if (legacyMoviesRes.status === 'fulfilled' && !legacyMoviesRes.value.error) {
    for (const m of (legacyMoviesRes.value.data || []) as any[]) {
      addIfMissing({
        key: `movie:${m.movie_id}`,
        contentId: String(m.movie_id),
        contentType: 'movie',
        title: m.title || `Фильм #${m.movie_id}`,
        posterUrl: m.poster_path
          ? m.poster_path.startsWith('http')
            ? m.poster_path
            : getMoviePosterUrl(m.poster_path, 'w342')
          : null,
        userRating: Number(m.rating),
        releaseYear: m.release_date?.split('-')[0],
        updatedAt: m.updated_at || m.created_at || '',
        source: 'legacy',
      });
    }
  }

  if (legacySeriesRes.status === 'fulfilled' && !legacySeriesRes.value.error) {
    for (const s of (legacySeriesRes.value.data || []) as any[]) {
      addIfMissing({
        key: `series:${s.series_id}`,
        contentId: String(s.series_id),
        contentType: 'series',
        title: s.title || `Сериал #${s.series_id}`,
        posterUrl: s.poster_path
          ? s.poster_path.startsWith('http')
            ? s.poster_path
            : getMoviePosterUrl(s.poster_path, 'w342')
          : null,
        userRating: Number(s.rating),
        releaseYear: s.release_date?.split('-')[0],
        updatedAt: s.updated_at || s.created_at || '',
        source: 'legacy',
      });
    }
  }

  if (legacyGamesRes.status === 'fulfilled' && !legacyGamesRes.value.error) {
    for (const g of (legacyGamesRes.value.data || []) as any[]) {
      addIfMissing({
        key: `game:${g.game_id}`,
        contentId: String(g.game_id),
        contentType: 'game',
        title: g.title || `Игра #${g.game_id}`,
        posterUrl: g.background_image || null,
        userRating: Number(g.rating),
        releaseYear: g.released?.split('-')[0],
        updatedAt: g.updated_at || g.created_at || '',
        source: 'legacy',
      });
    }
  }

  if (commRes.status === 'fulfilled' && !commRes.value.error) {
    const rows = ((commRes.value.data || []) as any[]).filter(
      (r) => !map.has(`${r.content_type}:${r.content_id}`)
    );

    const enriched = await Promise.allSettled(
      rows.slice(0, 40).map(async (r): Promise<RatedItem> => {
        const type = (r.content_type || 'movie') as ContentType;
        const id = String(r.content_id);
        const base: RatedItem = {
          key: `${type}:${id}`,
          contentId: id,
          contentType: type,
          title: `${type === 'game' ? 'Игра' : type === 'series' ? 'Сериал' : 'Фильм'} #${id}`,
          posterUrl: null,
          userRating: Number(r.rating),
          updatedAt: r.updated_at || r.created_at || '',
          source: 'community',
        };

        try {
          if (type === 'movie' || type === 'anime') {
            const d = await getMovieDetails(Number(id));
            return {
              ...base,
              title: d.title || base.title,
              posterUrl: d.poster_path ? getMoviePosterUrl(d.poster_path, 'w342') : null,
              releaseYear: d.release_date?.split('-')[0],
              externalRating: d.vote_average ? Math.round(d.vote_average * 10) / 10 : undefined,
            };
          }
          if (type === 'series') {
            const d = await getSeriesDetails(Number(id));
            return {
              ...base,
              title: d.title || base.title,
              posterUrl: d.poster_path ? getMoviePosterUrl(d.poster_path, 'w342') : null,
              releaseYear: d.release_date?.split('-')[0],
              externalRating: d.vote_average ? Math.round(d.vote_average * 10) / 10 : undefined,
            };
          }
          if (type === 'game') {
            const d = await fetchRawg(`https://api.rawg.io/api/games/${id}?key=${RAWG_API_KEY}`);
            return {
              ...base,
              title: d.name || base.title,
              posterUrl: d.background_image || null,
              releaseYear: d.released?.split('-')[0],
              externalRating: d.rating ? Math.round(d.rating * 10) / 10 : undefined,
            };
          }
        } catch {
          // fallback
        }
        return base;
      })
    );

    for (const res of enriched) {
      if (res.status === 'fulfilled') {
        addIfMissing(res.value);
      }
    }
  }

  return Array.from(map.values());
}
