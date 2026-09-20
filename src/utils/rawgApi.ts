// RAWG API — студии (developers) и издатели (publishers) для вики-страниц
export const RAWG_API_KEY = 'c33c648c0d8f45c494af8da025d7b862';
const RAWG_BASE = 'https://api.rawg.io/api';

export type StudioType = 'developer' | 'publisher';

export interface RawgStudio {
  id: number;
  name: string;
  slug: string;
  games_count: number;
  image_background: string | null;
  description: string;
}

export interface RawgGameShort {
  id: number;
  name: string;
  slug: string;
  released: string | null;
  rating: number;
  background_image: string | null;
}

const endpoint = (type: StudioType) => (type === 'developer' ? 'developers' : 'publishers');

export const getStudioDetails = async (type: StudioType, id: string | number): Promise<RawgStudio> => {
  return fetchRawg(`${RAWG_BASE}/${endpoint(type)}/${id}?key=${RAWG_API_KEY}`);
};

export const getStudioGames = async (
  type: StudioType,
  id: string | number,
  page: number = 1
): Promise<{ games: RawgGameShort[]; hasMore: boolean }> => {
  const param = type === 'developer' ? 'developers' : 'publishers';
  const data = await fetchRawg(
    `${RAWG_BASE}/games?key=${RAWG_API_KEY}&${param}=${id}&page_size=40&page=${page}&ordering=-rating`
  );
  return { games: data.results || [], hasMore: !!data.next };
};

/** RAWG любит отдавать 429 — ретраим с паузой, прежде чем сдаться */
export const fetchRawg = async (url: string, retries: number = 2): Promise<any> => {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 900 * (attempt + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`RAWG API error: ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  throw lastErr;
};

/** Английские жанры RAWG → русские подписи */
export const GAME_GENRE_RU: Record<string, string> = {
  Action: 'Экшен',
  Adventure: 'Приключения',
  RPG: 'РПГ',
  Strategy: 'Стратегии',
  Simulation: 'Симуляторы',
  Sports: 'Спорт',
  Racing: 'Гонки',
  Puzzle: 'Головоломки',
  Shooter: 'Шутеры',
  Fighting: 'Файтинги',
  Indie: 'Инди',
  Horror: 'Хорроры',
};

export const gameGenreRu = (en: string): string => GAME_GENRE_RU[en] || en;

/** 2400 → «2.4k» */
export const formatVotes = (n?: number): string => {
  if (!n || n <= 0) return '';
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.', ',')} тыс.`;
  return `${n}`;
};
