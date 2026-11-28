import supabase from '@/lib/supabase';
import { ContentBookmark, CONTENT_STATUS_CONFIG } from '@/types/anime';
import {
  searchMovies,
  searchSeries,
  searchPeople,
  searchCompanies,
  normalizeTvItem,
  getMoviePosterUrl,
} from '@/utils/tmdbApi';
import { searchGames, searchStudios } from '@/utils/rawgApi';
import { showsData } from '@/pages/ws/data/shows';

export interface SearchMovieItem {
  id: number;
  title: string;
  originalTitle?: string;
  year: string;
  rating: number;
  poster: string;
  description: string;
}

export interface SearchGameItem {
  id: number;
  title: string;
  year: string;
  rating: number;
  ratingsCount?: number;
  poster: string;
  description: string;
}

export interface SearchPersonItem {
  id: number;
  name: string;
  department: string;
  photoUrl: string | null;
  knownFor: string;
}

export interface SearchStudioItem {
  key: string;
  id: number;
  name: string;
  kind: 'company' | 'developer' | 'publisher';
  imageUrl: string | null;
  meta: string;
  to: string;
}

export interface SearchProfileItem {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  level: number;
  to: string;
}

export interface SearchExtraItem {
  key: string;
  kind: 'watch' | 'recommendation' | 'tier_list' | 'top_item' | 'section';
  title: string;
  subtitle: string;
  badge: string;
  to: string;
  imageUrl?: string | null;
  isBeta?: boolean;
}

export interface GlobalSearchResultsData {
  movies: SearchMovieItem[];
  series: SearchMovieItem[];
  games: SearchGameItem[];
  people: SearchPersonItem[];
  studios: SearchStudioItem[];
  profiles: SearchProfileItem[];
  bookmarks: ContentBookmark[];
  extras: SearchExtraItem[];
}

export const EMPTY_GLOBAL_RESULTS: GlobalSearchResultsData = {
  movies: [],
  series: [],
  games: [],
  people: [],
  studios: [],
  profiles: [],
  bookmarks: [],
  extras: [],
};

const DEPARTMENT_RU: Record<string, string> = {
  Acting: 'Актёр',
  Directing: 'Режиссёр',
  Writing: 'Сценарист',
  Production: 'Продюсер',
  Sound: 'Композитор',
  Camera: 'Оператор',
  Editing: 'Монтажёр',
  Art: 'Художник',
};

interface SiteSectionDef {
  id: string;
  title: string;
  subtitle: string;
  to: string;
  keywords: string[];
  isBeta?: boolean;
}

const SITE_SECTIONS: SiteSectionDef[] = [
  {
    id: 'home',
    title: 'Главная страница',
    subtitle: 'Персональный трекер, поиск и быстрая навигация',
    to: '/',
    keywords: ['главная', 'дом', 'home', 'старт', 'поиск', 'reversex'],
  },
  {
    id: 'movies',
    title: 'Фильмы',
    subtitle: 'Тренды, популярное и топ фильмов',
    to: '/movies',
    keywords: ['фильмы', 'кино', 'movies', 'film', 'cinema', 'новинки'],
  },
  {
    id: 'explore-movies',
    title: 'Каталог фильмов (Explore)',
    subtitle: 'Расширенный список фильмов с личными статусами',
    to: '/explore-movies',
    keywords: ['каталог', 'explore', 'обзор', 'все фильмы', 'подборка'],
  },
  {
    id: 'series',
    title: 'Сериалы',
    subtitle: 'Популярные и трендовые сериалы',
    to: '/series',
    keywords: ['сериалы', 'шоу', 'series', 'tv', 'эпизоды', 'сезоны'],
  },
  {
    id: 'games',
    title: 'Игры',
    subtitle: 'Каталог игр по жанрам и рейтингу RAWG',
    to: '/games',
    keywords: ['игры', 'гейминг', 'games', 'видеоигры', 'rawg'],
  },
  {
    id: 'bookmarks',
    title: 'Закладки',
    subtitle: 'Ваши списки: смотрю, в планах, просмотрено, избранное',
    to: '/bookmarks',
    keywords: ['закладки', 'списки', 'избранное', 'просмотрено', 'в планах', 'bookmarks'],
  },
  {
    id: 'rated',
    title: 'Оценённые',
    subtitle: 'Все ваши оценки фильмов, сериалов и игр по категориям',
    to: '/rated',
    keywords: ['оценённые', 'оцененные', 'оценки', 'рейтинги', 'мои оценки', 'rated'],
  },
  {
    id: 'music',
    title: 'Музыка',
    subtitle: 'Треки, альбомы и исполнители (скоро)',
    to: '/music',
    keywords: ['музыка', 'треки', 'альбомы', 'песни', 'исполнители', 'music'],
  },
  {
    id: 'books',
    title: 'Книги',
    subtitle: 'Библиотека книг и авторов (скоро)',
    to: '/books',
    keywords: ['книги', 'чтение', 'авторы', 'библиотека', 'books'],
  },
  {
    id: 'watch',
    title: 'Watch (WS)',
    subtitle: 'Каталог сериалов для просмотра и эпизодов',
    to: '/ws',
    keywords: ['watch', 'ws', 'смотреть', 'онлайн', 'сериалы'],
    isBeta: true,
  },
  {
    id: 'recommendations',
    title: 'Рекомендации сообщества',
    subtitle: 'Советы и подборки пользователей ReverseX',
    to: '/recommendations',
    keywords: ['рекомендации', 'советы', 'подборки', 'recommendations', 'отзывы'],
    isBeta: true,
  },
  {
    id: 'tier-lists',
    title: 'Тир-листы',
    subtitle: 'Конструктор рейтинговых таблиц SS / S / A / B / C',
    to: '/tier-lists',
    keywords: ['тир-листы', 'тирлисты', 'tier', 'рейтинг', 'топы', 'tier lists'],
    isBeta: true,
  },
  {
    id: 'settings',
    title: 'Настройки и ReverseX Labs',
    subtitle: 'Тема, уведомления, приватность и бета-режим',
    to: '/settings',
    keywords: ['настройки', 'settings', 'labs', 'бета', 'тема', 'приватность'],
  },
  {
    id: 'qr-scan',
    title: 'Привязать устройство (QR)',
    subtitle: 'Вход и синхронизация через QR-код',
    to: '/qr-scan',
    keywords: ['qr', 'устройство', 'привязать', 'сканер', 'телефон'],
  },
  {
    id: 'youtube-downloader',
    title: 'Загрузчик YouTube',
    subtitle: 'Скачивание видео с YouTube в нужном качестве',
    to: '/youtube-downloader',
    keywords: ['youtube', 'ютуб', 'скачать', 'видео', 'загрузчик'],
  },
];

function sanitizeForPostgrestOr(raw: string): string {
  return raw.replace(/[,()%*\\]/g, ' ').trim();
}

export async function searchEverything(
  rawQuery: string,
  options: {
    bookmarks?: ContentBookmark[];
    isBetaEnabled?: boolean;
    currentProfile?: { id?: string; username?: string | null; display_name?: string | null } | null;
  } = {}
): Promise<GlobalSearchResultsData> {
  const query = rawQuery.trim();
  if (!query) return EMPTY_GLOBAL_RESULTS;

  const qLower = query.toLowerCase();
  const safePostgrest = sanitizeForPostgrestOr(query);
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);

  // 1. Локальный мгновенный поиск по закладкам пользователя
  const matchedBookmarks = (options.bookmarks || []).filter((b) => {
    const statusLabel = CONTENT_STATUS_CONFIG[b.status]?.label?.toLowerCase() || '';
    return (
      b.title.toLowerCase().includes(qLower) ||
      (b.genre || '').toLowerCase().includes(qLower) ||
      (b.notes || '').toLowerCase().includes(qLower) ||
      (b.releaseYear || '').toLowerCase().includes(qLower) ||
      statusLabel.includes(qLower)
    );
  });

  // 2. Локальный поиск по разделам сайта + Watch-каталогу
  const extraSections: SearchExtraItem[] = [];
  for (const sec of SITE_SECTIONS) {
    const matches =
      sec.title.toLowerCase().includes(qLower) ||
      sec.subtitle.toLowerCase().includes(qLower) ||
      sec.keywords.some((kw) => kw.includes(qLower) || qLower.includes(kw));
    if (matches) {
      extraSections.push({
        key: `section-${sec.id}`,
        kind: 'section',
        title: sec.title,
        subtitle: sec.subtitle,
        badge: sec.isBeta ? 'Раздел · Beta' : 'Раздел сайта',
        to: sec.to,
        isBeta: sec.isBeta,
      });
    }
  }

  if (options.currentProfile?.id && ['профиль', 'аккаунт', 'мой профиль', 'profile'].some((k) => k.includes(qLower) || qLower.includes(k))) {
    extraSections.unshift({
      key: 'section-my-profile',
      kind: 'section',
      title: 'Мой профиль',
      subtitle: options.currentProfile.display_name || (options.currentProfile.username ? `@${options.currentProfile.username}` : 'Открыть страницу профиля'),
      badge: 'Профиль',
      to: options.currentProfile.username ? `/${options.currentProfile.username}` : `/profile/${options.currentProfile.id}`,
    });
  }

  const matchedShows: SearchExtraItem[] = showsData
    .filter(
      (s) =>
        s.title.toLowerCase().includes(qLower) ||
        s.genre.toLowerCase().includes(qLower)
    )
    .map((s) => ({
      key: `watch-${s.id}`,
      kind: 'watch' as const,
      title: s.title,
      subtitle: `Watch · ${s.genre}`,
      badge: options.isBetaEnabled ? 'Watch' : 'Watch · Beta',
      to: `/ws/show/${s.id}`,
      isBeta: true,
    }));

  // 3. Параллельный поиск по внешним API и базе Supabase
  const [
    moviesRes,
    seriesRes,
    gamesRes,
    peopleRes,
    companiesRes,
    devsRes,
    pubsRes,
    profilesRes,
    recsRes,
    tierListsRes,
    topItemsRes,
  ] = await Promise.allSettled([
    searchMovies(query, 1),
    searchSeries(query, 1),
    searchGames(query, 20),
    searchPeople(query, 1),
    searchCompanies(query, 1),
    searchStudios('developer', query, 8),
    searchStudios('publisher', query, 8),
    safePostgrest
      ? isUUID
        ? supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, custom_slug, bio, level')
            .eq('id', query)
            .limit(5)
        : supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, custom_slug, bio, level')
            .or(`username.ilike.%${safePostgrest}%,display_name.ilike.%${safePostgrest}%,custom_slug.ilike.%${safePostgrest}%`)
            .limit(12)
      : Promise.resolve({ data: [], error: null }),
    safePostgrest
      ? supabase
          .from('recommendations')
          .select('id, title, content, user_id')
          .or(`title.ilike.%${safePostgrest}%,content.ilike.%${safePostgrest}%`)
          .limit(8)
      : Promise.resolve({ data: [], error: null }),
    safePostgrest
      ? supabase
          .from('tier_lists')
          .select('id, title, description, is_public')
          .or(`title.ilike.%${safePostgrest}%,description.ilike.%${safePostgrest}%`)
          .limit(8)
      : Promise.resolve({ data: [], error: null }),
    safePostgrest
      ? supabase
          .from('top_list_items')
          .select('id, top_list_id, item_id, title, poster_url, rank, top_lists!inner(user_id, media_type, title)')
          .ilike('title', `%${safePostgrest}%`)
          .limit(8)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const movies: SearchMovieItem[] =
    moviesRes.status === 'fulfilled'
      ? (moviesRes.value.movies || []).map((m) => ({
          id: m.id,
          title: m.title,
          originalTitle: m.original_title,
          year: m.release_date?.split('-')[0] || '',
          rating: Math.round((m.vote_average || 0) * 10) / 10,
          poster: m.poster_path ? getMoviePosterUrl(m.poster_path, 'w342') : '',
          description: m.overview || '',
        }))
      : [];

  const series: SearchMovieItem[] =
    seriesRes.status === 'fulfilled'
      ? (seriesRes.value.results || []).map((raw) => {
          const s = normalizeTvItem(raw);
          return {
            id: s.id,
            title: s.title,
            originalTitle: s.original_title,
            year: s.release_date?.split('-')[0] || '',
            rating: Math.round((s.vote_average || 0) * 10) / 10,
            poster: s.poster_path ? getMoviePosterUrl(s.poster_path, 'w342') : '',
            description: s.overview || '',
          };
        })
      : [];

  const games: SearchGameItem[] =
    gamesRes.status === 'fulfilled'
      ? (gamesRes.value || []).map((g) => ({
          id: g.id,
          title: g.name,
          year: g.released?.split('-')[0] || '',
          rating: Math.round((g.rating || 0) * 10) / 10,
          ratingsCount: g.ratings_count || 0,
          poster: g.background_image || '',
          description: '',
        }))
      : [];

  const people: SearchPersonItem[] =
    peopleRes.status === 'fulfilled'
      ? (peopleRes.value.results || []).map((p) => ({
          id: p.id,
          name: p.name,
          department: DEPARTMENT_RU[p.known_for_department] || p.known_for_department || 'Киноперсона',
          photoUrl: p.profile_path ? `https://image.tmdb.org/t/p/w185${p.profile_path}` : null,
          knownFor: (p.known_for || [])
            .map((k) => k.title || k.name)
            .filter(Boolean)
            .slice(0, 3)
            .join(', '),
        }))
      : [];

  const studios: SearchStudioItem[] = [];
  if (companiesRes.status === 'fulfilled') {
    for (const c of companiesRes.value.results || []) {
      studios.push({
        key: `company-${c.id}`,
        id: c.id,
        name: c.name,
        kind: 'company',
        imageUrl: c.logo_path ? `https://image.tmdb.org/t/p/w185${c.logo_path}` : null,
        meta: c.origin_country ? `Киностудия · ${c.origin_country}` : 'Киностудия',
        to: `/company/${c.id}`,
      });
    }
  }
  if (devsRes.status === 'fulfilled') {
    for (const d of devsRes.value || []) {
      studios.push({
        key: `dev-${d.id}`,
        id: d.id,
        name: d.name,
        kind: 'developer',
        imageUrl: d.image_background,
        meta: `Разработчик игр · ${d.games_count} игр`,
        to: `/studio/developer/${d.id}`,
      });
    }
  }
  if (pubsRes.status === 'fulfilled') {
    for (const p of pubsRes.value || []) {
      studios.push({
        key: `pub-${p.id}`,
        id: p.id,
        name: p.name,
        kind: 'publisher',
        imageUrl: p.image_background,
        meta: `Издатель игр · ${p.games_count} игр`,
        to: `/studio/publisher/${p.id}`,
      });
    }
  }

  const profiles: SearchProfileItem[] =
    profilesRes.status === 'fulfilled' && !profilesRes.value.error
      ? ((profilesRes.value.data || []) as any[]).map((u) => ({
          id: u.id,
          username: u.username || '',
          displayName: u.display_name || null,
          avatarUrl: u.avatar_url || null,
          bio: u.bio || null,
          level: u.level || 1,
          to: u.custom_slug
            ? `/id/${u.custom_slug}`
            : u.username
            ? `/${u.username}`
            : `/profile/${u.id}`,
        }))
      : [];

  const recsExtras: SearchExtraItem[] =
    recsRes.status === 'fulfilled' && !recsRes.value.error
      ? ((recsRes.value.data || []) as any[]).map((r) => ({
          key: `rec-${r.id}`,
          kind: 'recommendation' as const,
          title: r.title || 'Рекомендация',
          subtitle: (r.content || '').slice(0, 90),
          badge: options.isBetaEnabled ? 'Рекомендация' : 'Рекомендация · Beta',
          to: '/recommendations',
          isBeta: true,
        }))
      : [];

  const tierExtras: SearchExtraItem[] =
    tierListsRes.status === 'fulfilled' && !tierListsRes.value.error
      ? ((tierListsRes.value.data || []) as any[]).map((tl) => ({
          key: `tier-${tl.id}`,
          kind: 'tier_list' as const,
          title: tl.title,
          subtitle: tl.description || 'Рейтинговый тир-лист',
          badge: options.isBetaEnabled ? 'Тир-лист' : 'Тир-лист · Beta',
          to: '/tier-lists',
          isBeta: true,
        }))
      : [];

  const topExtras: SearchExtraItem[] =
    topItemsRes.status === 'fulfilled' && !topItemsRes.value.error
      ? ((topItemsRes.value.data || []) as any[]).map((item) => {
          const list = Array.isArray(item.top_lists) ? item.top_lists[0] : item.top_lists;
          const mediaType = list?.media_type;
          const to =
            mediaType === 'movie'
              ? `/movie/${item.item_id}`
              : mediaType === 'series'
              ? `/series/${item.item_id}`
              : mediaType === 'game'
              ? `/game/${item.item_id}`
              : list?.user_id
              ? `/profile/${list.user_id}`
              : '/';
          return {
            key: `top-${item.id}`,
            kind: 'top_item' as const,
            title: item.title,
            subtitle: `Топ пользователя${list?.title ? ` · ${list.title}` : ''} (#${item.rank})`,
            badge: 'Личный топ',
            to,
            imageUrl: item.poster_url,
          };
        })
      : [];

  return {
    movies,
    series,
    games,
    people,
    studios,
    profiles,
    bookmarks: matchedBookmarks,
    extras: [...extraSections, ...matchedShows, ...recsExtras, ...tierExtras, ...topExtras],
  };
}
