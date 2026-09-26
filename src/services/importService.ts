// Универсальный импорт закладок из CSV/JSON/XML экспортов сторонних сервисов.
//
// Логика распределения по типам контента (авто):
//  - Letterboxd (diary.csv / ratings.csv / watchlist.csv) → всегда `movie`
//    (Letterboxd — это каталог фильмов; сериалов там нет).
//    diary/ratings → статус `watched`, watchlist → `planned`.
//  - IMDb (ratings.csv / watchlist.csv) → по колонке `Title Type`:
//    movie/tvMovie/tvShort → `movie`, tvSeries/tvMiniSeries/tvSpecial/tvEpisode → `series`,
//    videoGame → `game`. ratings → `watched`, watchlist → `planned`.
//  - Аниме (Anixart CSV, MyAnimeList XML, AniList JSON, Shikimori/общий anime-CSV)
//    → раскладываем по вкладкам сайта: сериалы → `series`, полнометражки → `movie`
//    (отдельного типа `anime` в прод-БД нет — CHECK допускает только
//    movie/series/game, поэтому хранить `anime` нельзя: строки отвергаются).
//    Логика определения фильма (classifyAnimeContentType):
//      1) явный формат источника (MAL series_type=3, AniList format=MOVIE) — приоритет;
//      2) маркеры в русском/оригинальном названии: «фильм», movie, film,
//         gekijouban, eiga — иначе считаем сериалом (TV/OVA/ONA/specials тоже сериалы).
//    Статусы маппятся: «Просмотрено»→watched, «Смотрю»→watching, «В планах»→planned,
//    «Отложено»→postponed, «Брошено»/«Не смотрю»→dropped;
//    оценка Anixart «N из 5» → шкала 0–10; «Добавлено в избранное» → is_favorite).
//  - Кинопоиск (CSV из расширений-экспортёров) → по колонке типа:
//    film → `movie`, serial/tv → `series`, anime → `anime`, иначе эвристика.
//  - Steam (CSV библиотеки: AppID, Name, Playtime) → всегда `game`:
//    наиграно 0 ч → `planned`, играл недавно → `watching`, иначе → `watched`.
//  - Auto: определяем источник по заголовкам/структуре, иначе generic-парсинг.
//
// Все сайты из списка умеют экспорт в CSV — поэтому входом везде является файл,
// выбранный пользователем вручную (file picker). Никаких логинов/паролей не нужно.

import supabase from '@/lib/supabase';
import type { ContentStatus, ContentType } from '@/types/anime';
import type { Enrichment } from '@/services/enrichService';

export type ImportSource =
  | 'auto'
  | 'letterboxd'
  | 'imdb'
  | 'anime'
  | 'kinopoisk'
  | 'steam'
  | 'generic';

export interface ParsedImportItem {
  title: string;
  /** Оригинальное (английское/японское) название — для мэтчинга с каталогом. */
  originalTitle?: string;
  year?: string;
  contentType: ContentType;
  status: ContentStatus;
  userRating?: number;
  externalRating?: number;
  genre?: string;
  notes?: string;
  sourceUrl?: string;
  posterUrl?: string;
  rawStatus?: string;
  /** Флаг "в избранном" на исходном сайте (например, Anixart "Добавлено в избранное"). */
  isFavorite?: boolean;
  /** Совпадение с каталогом (TMDB): привязывает постер/описание/страницу. */
  enriched?: Enrichment;
}

export interface ParseResult {
  items: ParsedImportItem[];
  detectedSource: Exclude<ImportSource, 'auto'>;
  warnings: string[];
  fileKind: 'csv' | 'json' | 'xml';
}

const STATUS_VALUES: ContentStatus[] = [
  'favorite',
  'watching',
  'planned',
  'watched',
  'postponed',
  'dropped',
];

export const IMPORT_SOURCE_LABEL: Record<ImportSource, string> = {
  auto: 'Автоопределение',
  letterboxd: 'Letterboxd (фильмы)',
  imdb: 'IMDb (фильмы + сериалы)',
  anime: 'Anixart / AniList / MAL / Shikimori (аниме)',
  kinopoisk: 'Кинопоиск (CSV)',
  steam: 'Steam (игры)',
  generic: 'Обычный CSV',
};

export const IMPORT_SOURCE_HINT: Record<ImportSource, string> = {
  auto: 'Сам определим формат по заголовкам файла.',
  letterboxd: 'Letterboxd → Settings → Import/Export → diary.csv, ratings.csv или watchlist.csv.',
  imdb: 'IMDb → Your Ratings / Watchlist → Export (ratings.csv, watchlist.csv).',
  anime: 'Anixart (Bookmarks CSV), AniList (Export JSON), MyAnimeList (Export XML), Shikimori CSV. Сериалы попадут во вкладку «Сериалы», полнометражки — в «Фильмы».',
  kinopoisk: 'CSV из расширений-экспортёров Кинопоиска (Название, Год, Тип, Оценка, Статус).',
  steam: 'Экспорт библиотеки (AppID, Name, Playtime) через SteamDB / export-расширения.',
  generic: 'Любой CSV с колонками title/name, year, rating, type, status.',
};

// ─────────────────────────── CSV parsing ───────────────────────────

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',' || ch === ';' || ch === '\t') {
        out.push(cur.trim());
        cur = '';
      } else cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  // strip BOM
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };
  // detect delimiter from header line
  const headerLine = lines[0];
  const counts = {
    ',': (headerLine.match(/,/g) || []).length,
    ';': (headerLine.match(/;/g) || []).length,
    '\t': (headerLine.match(/\t/g) || []).length,
  };
  const delim = counts[';'] > counts[','] && counts[';'] >= counts['\t'] ? ';' : counts['\t'] > counts[','] ? '\t' : ',';
  const split = (line: string): string[] => {
    if (delim === ',') return splitCsvLine(line);
    return line.split(delim).map((s) => s.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
  };
  const headers = split(headerLine).map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = split(lines[i]);
    if (cells.every((c) => c === '')) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? '';
    });
    rows.push(row);
  }
  return { headers, rows };
}

const normHeader = (h: string) => h.trim().toLowerCase().replace(/[\s_\-]+/g, ' ');

function getCol(row: Record<string, string>, names: string[]): string {
  const map: Record<string, string> = {};
  for (const k of Object.keys(row)) map[normHeader(k)] = k;
  for (const n of names) {
    const key = map[normHeader(n)];
    if (key !== undefined && row[key] !== undefined && row[key] !== '') return row[key].trim();
  }
  return '';
}

function clampRating(v: number): number | undefined {
  if (!isFinite(v)) return undefined;
  const r = Math.round(v * 10) / 10;
  if (r < 0 || r > 10) return undefined;
  return r;
}

function parseNum(s: string): number | undefined {
  if (!s) return undefined;
  const n = parseFloat(s.replace(',', '.'));
  return isFinite(n) ? n : undefined;
}

// ─────────────────────────── status mapping ───────────────────────────

const RU_STATUS_MAP: Record<string, ContentStatus> = {
  'просмотрено': 'watched',
  'просмотрен': 'watched',
  'посмотрено': 'watched',
  'завершено': 'watched',
  'завершён': 'watched',
  'completed': 'watched',
  'complete': 'watched',
  'watched': 'watched',
  'смотрю': 'watching',
  'смотря': 'watching',
  'watching': 'watching',
  'current': 'watching',
  'playing': 'watching',
  'играю': 'watching',
  'в планах': 'planned',
  'запланировано': 'planned',
  'буду смотреть': 'planned',
  'plan to watch': 'planned',
  'planning': 'planned',
  'planned': 'planned',
  'watchlist': 'planned',
  'отложено': 'postponed',
  'отложен': 'postponed',
  'on hold': 'postponed',
  'on-hold': 'postponed',
  'paused': 'postponed',
  'postponed': 'postponed',
  'брошено': 'dropped',
  'брошен': 'dropped',
  'dropped': 'dropped',
  'не смотрю': 'dropped',
  'не смотрит': 'dropped',
  'избранное': 'favorite',
  'любимое': 'favorite',
  'favorite': 'favorite',
  'favourite': 'favorite',
};

export function mapStatus(raw: string, fallback: ContentStatus): ContentStatus {
  if (!raw) return fallback;
  const key = raw.trim().toLowerCase();
  if (RU_STATUS_MAP[key]) return RU_STATUS_MAP[key];
  // MAL numeric codes: 1 watching, 2 completed, 3 on-hold, 4 dropped, 6 plan to watch
  if (key === '1') return 'watching';
  if (key === '2') return 'watched';
  if (key === '3') return 'postponed';
  if (key === '4') return 'dropped';
  if (key === '6') return 'planned';
  if (STATUS_VALUES.includes(key as ContentStatus)) return key as ContentStatus;
  return fallback;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'item'
  );
}

// ─────────────────────────── source parsers ───────────────────────────

type AnimeFormat = 'movie' | 'series';

/**
 * Раскладка аниме по вкладкам сайта: полнометражный фильм → `movie`, всё остальное → `series`.
 * @param formatHint явный формат от источника ('movie' | 'series'), если он его даёт — приоритет.
 * @param titles названия для эвристики (русское + оригинальное + альтернативные).
 */
export function classifyAnimeContentType(
  titles: (string | undefined)[],
  formatHint?: AnimeFormat | null
): 'movie' | 'series' {
  if (formatHint) return formatHint;
  const text = titles.filter(Boolean).join(' | ');
  // Маркеры полнометражки: «фильм», movie, film, gekijouban (Gekijouban = theatrical),
  // eiga (Eiga = кино, напр. «Eiga Koe no Katachi»).
  if (/фильм|movie|\bfilm\b|gekijouban|gekijoban|\beiga\b/i.test(text)) return 'movie';
  return 'series';
}

function parseLetterboxd(headers: string[], rows: Record<string, string>[]): ParsedImportItem[] {
  const hasRatingCol = headers.some((h) => normHeader(h) === 'rating');
  const isWatchlist = headers.some((h) => normHeader(h) === 'date added');
  return rows
    .map((r) => {
      const title = getCol(r, ['Name', 'Title', 'Film']);
      if (!title) return null;
      const year = getCol(r, ['Year']);
      const lbRating = parseNum(getCol(r, ['Rating']));
      const item: ParsedImportItem = {
        title,
        year: year || undefined,
        contentType: 'movie', // Letterboxd — только фильмы
        status: isWatchlist ? 'planned' : 'watched',
        sourceUrl: getCol(r, ['Letterboxd URI', 'Letterboxd URL', 'URL']) || undefined,
        rawStatus: isWatchlist ? 'watchlist' : 'diary',
      };
      if (lbRating != null) item.userRating = clampRating(lbRating * 2); // 0.5–5 → 0–10
      return item;
    })
    .filter((x): x is ParsedImportItem => !!x);
}

const IMDB_TYPE_MAP: Record<string, ContentType> = {
  movie: 'movie',
  tvmovie: 'movie',
  'tv movie': 'movie',
  tvshort: 'movie',
  tvspecial: 'series',
  'tv special': 'series',
  tvseries: 'series',
  'tv series': 'series',
  tvminiseries: 'series',
  'tv miniseries': 'series',
  tvepisode: 'series',
  'tv episode': 'series',
  series: 'series',
  videogame: 'game',
  'video game': 'game',
  game: 'game',
};

function parseImdb(headers: string[], rows: Record<string, string>[]): ParsedImportItem[] {
  const isRatings = headers.some((h) => normHeader(h) === 'your rating');
  return rows
    .map((r) => {
      const title = getCol(r, ['Title', 'Name']);
      if (!title) return null;
      const typeRaw = getCol(r, ['Title Type', 'TitleType']).toLowerCase();
      const contentType: ContentType = IMDB_TYPE_MAP[typeRaw] ?? 'movie';
      const item: ParsedImportItem = {
        title,
        year: getCol(r, ['Year', 'Release Date'])?.slice(0, 4) || undefined,
        contentType,
        status: isRatings ? 'watched' : 'planned',
        genre: getCol(r, ['Genres', 'Genre']) || undefined,
        sourceUrl: getCol(r, ['URL']) || undefined,
        rawStatus: isRatings ? 'rated' : 'watchlist',
      };
      const your = parseNum(getCol(r, ['Your Rating']));
      if (your != null) item.userRating = clampRating(your);
      const ext = parseNum(getCol(r, ['IMDb Rating', 'IMDB Rating']));
      if (ext != null) item.externalRating = clampRating(ext);
      return item;
    })
    .filter((x): x is ParsedImportItem => !!x);
}

function parseAnimeCsv(headers: string[], rows: Record<string, string>[]): ParsedImportItem[] {
  return rows
    .map((r) => {
      // Anixart: «Русское название» — основной тайтл, «Оригинальное название» — запасной.
      const title =
        getCol(r, ['Русское название', 'Anime Title', 'series_title', 'Title', 'Name', 'Название', 'name']) || '';
      if (!title) return null;
      const statusRaw = getCol(r, [
        'Статус просмотра',
        'My Status',
        'my_status',
        'Status',
        'Статус',
        'status',
      ]);
      // Anixart: «5 из 5» / «4 из 5» / «Не оценено»; MAL/Shikimori: 0–10; Shikimori бывает 1–5.
      const scoreRaw = getCol(r, ['Моя оценка', 'My Score', 'my_score', 'Score', 'Оценка', 'score', 'rating']);
      const origTitle = getCol(r, ['Оригинальное название', 'Original Title']);
      const favRaw = getCol(r, ['Добавлено в избранное', 'В избранном', 'favorite']).toLowerCase();
      const item: ParsedImportItem = {
        title,
        originalTitle: origTitle && origTitle !== title ? origTitle : undefined,
        contentType: classifyAnimeContentType([title, origTitle]),
        status: mapStatus(statusRaw, 'planned'),
        rawStatus: statusRaw || undefined,
        genre: getCol(r, ['Genres', 'Genre', 'Жанр']) || undefined,
        sourceUrl: getCol(r, ['URL', 'Link', 'Ссылка']) || undefined,
        notes: origTitle && origTitle !== title ? `Orig: ${origTitle}` : undefined,
        isFavorite: ['добавлено', 'да', 'yes', 'true'].includes(favRaw) ? true : undefined,
      };
      const year = getCol(r, ['Year', 'Год', 'Release Year']);
      if (year) item.year = year.slice(0, 4);
      const score = parseNum(scoreRaw);
      if (score != null && score > 0) {
        // «N из 5» (Anixart) → шкала 0–10; обычная 0–10 оставляем как есть.
        const isFiveScale = /из\s*5|\/\s*5/.test(scoreRaw);
        item.userRating = clampRating(isFiveScale ? score * 2 : score);
      }
      return item;
    })
    .filter((x): x is ParsedImportItem => !!x);
}

function parseKinopoisk(headers: string[], rows: Record<string, string>[]): ParsedImportItem[] {
  return rows
    .map((r) => {
      const title =
        getCol(r, ['Название', 'nameRus', 'Name', 'Title', 'name', 'film']) || '';
      if (!title) return null;
      const typeRaw = getCol(r, ['Тип', 'type', 'kind', 'Type']).toLowerCase();
      let contentType: ContentType = 'movie';
      if (/сериал|serial|series|tv|show|мини/.test(typeRaw)) contentType = 'series';
      // Аниме с Кинопоиска кладём в сериалы (отдельного типа anime в БД нет);
      // полнометражки там обычно идут с типом «фильм» → movie выше.
      else if (/аниме|anime/.test(typeRaw)) contentType = 'series';
      else if (/игра|game/.test(typeRaw)) contentType = 'game';
      const statusRaw = getCol(r, ['Статус', 'status', 'Status', 'my_status']);
      const scoreRaw = getCol(r, ['Оценка', 'rating', 'My Score', 'Score', 'userRating']);
      const item: ParsedImportItem = {
        title,
        contentType,
        status: mapStatus(statusRaw, 'watched'),
        rawStatus: statusRaw || undefined,
        genre: getCol(r, ['Жанр', 'genre', 'Genres']) || undefined,
        sourceUrl: getCol(r, ['URL', 'Ссылка', 'Link']) || undefined,
      };
      const year = getCol(r, ['Год', 'year', 'Year']);
      if (year) item.year = year.slice(0, 4);
      const score = parseNum(scoreRaw);
      if (score != null) item.userRating = clampRating(score);
      return item;
    })
    .filter((x): x is ParsedImportItem => !!x);
}

function parseSteam(headers: string[], rows: Record<string, string>[]): ParsedImportItem[] {
  return rows
    .map((r) => {
      const title = getCol(r, ['Name', 'name', 'Title', 'game', 'App Name']);
      if (!title) return null;
      const playtimeRaw = getCol(r, [
        'Playtime',
        'Playtime (hours)',
        'playtime_forever',
        'playtime',
        'Hours',
        'Часы',
      ]);
      const lastPlayed = getCol(r, ['Last Played', 'last_played', 'Last played']);
      // Эвристика статуса для игр:
      // 0 часов → planned (куплена, не играл); играл недавно → watching; иначе watched.
      const hours = playtimeRaw ? parseFloat(playtimeRaw.replace(',', '.')) : 0;
      // playtime_forever от Steam API — в минутах
      const minutesKey = headers.some((h) => normHeader(h) === 'playtime forever');
      const hoursNorm = minutesKey && isFinite(hours) ? hours / 60 : hours;
      let status: ContentStatus = 'watched';
      if (!isFinite(hoursNorm) || hoursNorm <= 0) status = 'planned';
      else if (lastPlayed) {
        const lp = Date.parse(lastPlayed);
        if (isFinite(lp) && Date.now() - lp < 30 * 24 * 3600 * 1000) status = 'watching';
      }
      const appId = getCol(r, ['AppID', 'appid', 'AppId', 'id']);
      const item: ParsedImportItem = {
        title,
        contentType: 'game',
        status,
        rawStatus: playtimeRaw ? `${playtimeRaw}h` : undefined,
        sourceUrl: appId ? `https://store.steampowered.com/app/${appId}` : undefined,
        notes: appId ? `Steam AppID: ${appId}` : undefined,
      };
      return item;
    })
    .filter((x): x is ParsedImportItem => !!x);
}

function parseGeneric(headers: string[], rows: Record<string, string>[]): ParsedImportItem[] {
  return rows
    .map((r) => {
      const title = getCol(r, ['Title', 'title', 'Name', 'name', 'Название', 'Anime Title', 'Film']);
      if (!title) return null;
      const typeRaw = getCol(r, ['Type', 'type', 'Kind', 'kind', 'Тип', 'content_type']).toLowerCase();
      let contentType: ContentType = 'movie';
      if (/serial|series|сериал|tv|show/.test(typeRaw)) contentType = 'series';
      // Тип «аниме» без уточнения — проверяем маркеры фильма в названии, иначе сериал
      // (отдельного типа anime в БД нет).
      else if (/anime|аниме/.test(typeRaw)) contentType = classifyAnimeContentType([title]);
      else if (/game|игра/.test(typeRaw)) contentType = 'game';
      const statusRaw = getCol(r, ['Status', 'status', 'Статус', 'My Status']);
      const item: ParsedImportItem = {
        title,
        contentType,
        status: mapStatus(statusRaw, 'planned'),
        rawStatus: statusRaw || undefined,
        genre: getCol(r, ['Genre', 'Genres', 'Жанр']) || undefined,
        sourceUrl: getCol(r, ['URL', 'url', 'Link', 'Ссылка']) || undefined,
      };
      const year = getCol(r, ['Year', 'year', 'Год']);
      if (year) item.year = year.slice(0, 4);
      const rating = parseNum(getCol(r, ['Rating', 'rating', 'Score', 'score', 'Оценка', 'My Score']));
      if (rating != null) item.userRating = clampRating(rating <= 5 && rating > 0 ? rating * 2 : rating);
      const ext = parseNum(getCol(r, ['External Rating', 'IMDb Rating']));
      if (ext != null) item.externalRating = clampRating(ext);
      return item;
    })
    .filter((x): x is ParsedImportItem => !!x);
}

// ── MAL XML / AniList JSON ──

function parseMalXml(text: string): ParsedImportItem[] {
  const items: ParsedImportItem[] = [];
  const blocks = text.match(/<(anime|manga)[\s>][\s\S]*?<\/(anime|manga)>/gi) || [];
  for (const b of blocks) {
    const pick = (tag: string) => {
      const m = b.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
    };
    const title = pick('series_title') || pick('manga_title');
    if (!title || title.toLowerCase() === 'unknown') continue;
    const statusRaw = pick('my_status') || pick('status');
    const score = parseNum(pick('my_score'));
    // MAL series_type: 1=TV, 2=OVA, 3=Movie, 4=Special, 5=ONA, 6=Music → фильм только Movie.
    const seriesType = pick('series_type');
    items.push({
      title,
      contentType: classifyAnimeContentType(
        [title],
        seriesType === '3' ? 'movie' : seriesType ? 'series' : null
      ),
      status: mapStatus(statusRaw, 'planned'),
      userRating: score != null && score > 0 ? clampRating(score) : undefined,
      rawStatus: statusRaw || undefined,
    });
  }
  return items;
}

function pickTitle(obj: any): string {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj.english || obj.romaji || obj.userPreferred || obj.native || '';
}

function parseAnilistJson(data: any): ParsedImportItem[] {
  const entries: any[] = [];
  if (Array.isArray(data)) entries.push(...data);
  else if (Array.isArray(data?.lists)) {
    for (const l of data.lists) if (Array.isArray(l?.entries)) entries.push(...l.entries);
  } else if (data?.data?.MediaListCollection?.lists) {
    for (const l of data.data.MediaListCollection.lists)
      if (Array.isArray(l?.entries)) entries.push(...l.entries);
  } else if (Array.isArray(data?.entries)) entries.push(...data.entries);

  const ANILIST_STATUS: Record<string, ContentStatus> = {
    COMPLETED: 'watched',
    CURRENT: 'watching',
    REPEATING: 'watching',
    PLANNING: 'planned',
    PAUSED: 'postponed',
    DROPPED: 'dropped',
  };

  return entries
    .map((e) => {
      const title = pickTitle(e?.media?.title) || e?.title || e?.name || '';
      if (!title) return null;
      const raw = String(e?.status || '');
      // AniList media.format: TV, TV_SHORT, MOVIE, SPECIAL, OVA, ONA, MUSIC — фильм только MOVIE.
      const format = String(e?.media?.format || '').toUpperCase();
      const romaji = e?.media?.title?.romaji;
      const item: ParsedImportItem = {
        title,
        originalTitle: romaji && romaji !== title ? romaji : undefined,
        contentType: classifyAnimeContentType(
          [title, pickTitle(e?.media?.title) !== title ? pickTitle(e?.media?.title) : undefined],
          format === 'MOVIE' ? 'movie' : format ? 'series' : null
        ),
        status: ANILIST_STATUS[raw.toUpperCase()] || mapStatus(raw, 'planned'),
        rawStatus: raw || undefined,
        sourceUrl: e?.media?.siteUrl || undefined,
        genre: Array.isArray(e?.media?.genres) ? e.media.genres.join(', ') : undefined,
      };
      const score = parseNum(String(e?.score ?? ''));
      if (score != null && score > 0) item.userRating = clampRating(score > 10 ? score / 10 : score);
      const year = e?.media?.startDate?.year || e?.media?.seasonYear;
      if (year) item.year = String(year);
      return item;
    })
    .filter((x): x is ParsedImportItem => !!x);
}

// ─────────────────────────── detect + main parse ───────────────────────────

export function detectSource(
  headers: string[],
  fileKind: 'csv' | 'json' | 'xml'
): Exclude<ImportSource, 'auto'> {
  if (fileKind === 'xml') return 'anime'; // MAL XML
  if (fileKind === 'json') return 'anime'; // AniList JSON
  const H = new Set(headers.map(normHeader));
  const has = (...names: string[]) => names.some((n) => H.has(normHeader(n)));
  if (has('Letterboxd URI', 'Letterboxd URL')) return 'letterboxd';
  if (has('Const') && has('Title Type')) return 'imdb';
  if (has('AppID', 'appid') || (has('playtime forever') && has('name'))) return 'steam';
  // Anixart: «Русское название, Оригинальное название, ..., Статус просмотра, Моя оценка»
  if (has('Русское название') && has('Статус просмотра')) return 'anime';
  if (has('series_animedb_id') || has('my_status') || has('Anime Title')) return 'anime';
  if (has('Название') || has('nameRus')) return 'kinopoisk';
  return 'generic';
}

export async function parseImportFile(file: File, source: ImportSource): Promise<ParseResult> {
  const text = await file.text();
  const trimmed = text.trimStart();
  const warnings: string[] = [];

  if (trimmed.startsWith('<')) {
    const items = parseMalXml(text);
    return { items, detectedSource: 'anime', warnings, fileKind: 'xml' };
  }
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const items = parseAnilistJson(JSON.parse(text));
      return { items, detectedSource: 'anime', warnings, fileKind: 'json' };
    } catch {
      warnings.push('Не удалось разобрать JSON — пробуем как CSV.');
    }
  }

  const { headers, rows } = parseCsv(text);
  if (headers.length === 0) return { items: [], detectedSource: 'generic', warnings: ['Пустой файл'], fileKind: 'csv' };

  const detected = source === 'auto' ? detectSource(headers, 'csv') : (source as Exclude<ImportSource, 'auto'>);
  let items: ParsedImportItem[] = [];
  switch (detected) {
    case 'letterboxd':
      items = parseLetterboxd(headers, rows);
      break;
    case 'imdb':
      items = parseImdb(headers, rows);
      break;
    case 'anime':
      items = parseAnimeCsv(headers, rows);
      break;
    case 'kinopoisk':
      items = parseKinopoisk(headers, rows);
      break;
    case 'steam':
      items = parseSteam(headers, rows);
      break;
    default:
      items = parseGeneric(headers, rows);
      break;
  }
  if (items.length === 0) warnings.push('Не нашли ни одной строки с названием. Проверьте, что это экспортный CSV.');
  else if (items.length < rows.length)
    warnings.push(`Пропущено строк без названия: ${rows.length - items.length}.`);
  return { items, detectedSource: detected, warnings, fileKind: 'csv' };
}

// ─────────────────────────── import into DB ───────────────────────────

export const normTitle = (t: string) =>
  t
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-z0-9а-я]+/gi, '')
    .trim();

export interface ImportSummary {
  created: number;
  /** Старые «пустышки» (imp-*), привязанные к каталогу при повторном импорте */
  updated: number;
  skipped: number;
  failed: number;
}

interface ExistingRow {
  id: string;
  content_type: string;
  content_id: string;
  title: string;
  release_year: string | null;
}

const IMPORT_STATUS_PRIO: Record<string, number> = {
  favorite: 6,
  watching: 5,
  watched: 4,
  planned: 3,
  postponed: 2,
  dropped: 1,
};

/** Итоговый тип: совпадение могло найтись в соседнем разделе (фильм↔сериал). */
const effType = (it: ParsedImportItem): ContentType =>
  it.enriched?.contentType || it.contentType;

/**
 * Сезоны одного шоу (одна TMDB-запись) сливаем в одну закладку:
 * в БД действует UNIQUE(user_id, content_id, content_type), дубли невозможны.
 * Выживает strongest статус, максимальный рейтинг; список сезонов — в заметку.
 */
function mergeImportGroups(items: ParsedImportItem[]): {
  items: ParsedImportItem[];
  seasonsByKey: Map<string, string[]>;
} {
  const groups = new Map<string, ParsedImportItem[]>();
  const singles: ParsedImportItem[] = [];
  for (const it of items) {
    if (it.enriched) {
      const k = `${effType(it)}|${it.enriched.contentId}`;
      groups.set(k, [...(groups.get(k) || []), it]);
    } else {
      singles.push(it);
    }
  }
  const seasonsByKey = new Map<string, string[]>();
  const merged: ParsedImportItem[] = [];
  for (const [k, g] of groups) {
    seasonsByKey.set(
      k,
      [...new Set(g.map((x) => x.title.trim()))]
    );
    if (g.length === 1) {
      merged.push(g[0]);
      continue;
    }
    const sorted = [...g].sort(
      (a, b) =>
        (IMPORT_STATUS_PRIO[b.status] ?? 0) - (IMPORT_STATUS_PRIO[a.status] ?? 0) ||
        (b.userRating ?? 0) - (a.userRating ?? 0) ||
        Number(b.isFavorite === true) - Number(a.isFavorite === true)
    );
    const s = sorted[0];
    const seasonList = seasonsByKey.get(k)!.join('; ');
    merged.push({
      ...s,
      title: s.enriched?.title || s.title,
      userRating: Math.max(...g.map((x) => x.userRating ?? 0)) || undefined,
      isFavorite: g.some((x) => x.isFavorite) ? true : undefined,
      notes: [s.notes, `Объединено (${g.length}): ${seasonList}`].filter(Boolean).join('\n'),
    });
  }
  return { items: [...merged, ...singles], seasonsByKey };
}

export async function importParsedItems(
  userId: string,
  items: ParsedImportItem[],
  opts?: {
    source?: string;
    statusOverride?: ContentStatus | null;
    onProgress?: (done: number, total: number) => void;
  }
): Promise<ImportSummary> {
  // Загружаем существующие закладки для дедупликации (не затираем своё).
  const { data: existing } = await supabase
    .from('content_bookmarks')
    .select('id,content_type,content_id,title,release_year')
    .eq('user_id', userId);
  const rows: ExistingRow[] = existing || [];
  const byId = new Set(rows.map((e) => `${e.content_type}|${e.content_id}`));
  const titleKey = (type: string, title: string, year?: string) =>
    `${type}|${normTitle(title)}|${year || ''}`;
  const byTitle = new Map<string, ExistingRow[]>();
  for (const e of rows) {
    const k1 = titleKey(e.content_type, e.title, e.release_year || '');
    const k2 = titleKey(e.content_type, e.title, '');
    for (const k of [k1, k2]) {
      const arr = byTitle.get(k) || [];
      arr.push(e);
      byTitle.set(k, arr);
    }
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  const buildRow = (it: ParsedImportItem, status: ContentStatus, contentId: string, title: string) => {
    const year = it.enriched?.releaseYear || it.year?.slice(0, 4);
    const row: Record<string, any> = {
      user_id: userId,
      content_type: effType(it),
      content_id: contentId,
      title,
      status,
      is_favorite: status === 'favorite' || it.isFavorite === true,
      user_rating: it.userRating ?? 0,
      progress: 0,
      total_items: 0,
    };
    if (it.enriched?.posterUrl) row.poster_url = it.enriched.posterUrl;
    else if (it.posterUrl) row.poster_url = it.posterUrl;
    if (it.enriched?.externalRating != null) row.external_rating = it.enriched.externalRating;
    else if (it.externalRating != null) row.external_rating = it.externalRating;
    if (it.enriched?.genre) row.genre = it.enriched.genre;
    else if (it.genre) row.genre = it.genre;
    if (it.enriched?.synopsis) row.synopsis = it.enriched.synopsis;
    if (year) row.release_year = year;
    const notesParts = [
      it.notes,
      it.originalTitle ? `Orig: ${it.originalTitle}` : '',
      opts?.source ? `Импорт: ${opts.source}` : '',
      it.sourceUrl || '',
    ].filter((p) => p && p.trim() !== '');
    // Не дублируем Orig, если он уже есть в notes (Anixart-парсер кладёт его туда же)
    const notes = [...new Set(notesParts)].join('\n');
    if (notes) row.notes = notes;
    return row;
  };

  // Вставляем пачками по 50 через upsert (идемпотентно при повторном импорте).
  const BATCH = 50;
  const toUpdate: { id: string; fields: Record<string, any> }[] = [];
  const toDelete: string[] = [];
  // Сначала привязанные к каталогу — они главные, «пустышки»-дубли после них пропускаются.
  // Сезоны одного шоу уже слиты в одну запись (mergeImportGroups).
  const { items: mergedItems, seasonsByKey } = mergeImportGroups(items);
  const findHollows = (type: string, titles: string[]): ExistingRow[] => {
    const found: ExistingRow[] = [];
    for (const t of titles) {
      for (const r of byTitle.get(titleKey(type, t, '')) || []) {
        if (r.content_id.startsWith('imp-') && !found.some((f) => f.id === r.id)) found.push(r);
      }
    }
    return found;
  };
  const ordered = [...mergedItems].sort((a, b) => (b.enriched ? 1 : 0) - (a.enriched ? 1 : 0));
  for (let i = 0; i < ordered.length; i += BATCH) {
    const batch = ordered.slice(i, i + BATCH);
    const toInsert: Record<string, any>[] = [];
    for (const it of batch) {
      const baseTitle = it.title.trim();
      if (!baseTitle) {
        skipped++;
        continue;
      }
      const status = opts?.statusOverride || it.status;
      const year = it.enriched?.releaseYear || it.year?.slice(0, 4);
      // Привязанный к каталогу тайтл: дедуп по (тип, TMDB-id) — главный ключ.
      if (it.enriched) {
        const type = effType(it);
        const idKey = `${type}|${it.enriched.contentId}`;
        const title = it.enriched.title || baseTitle;
        const seasonTitles = seasonsByKey.get(idKey) || [baseTitle];
        const hollows = findHollows(type, seasonTitles);
        if (byId.has(idKey)) {
          // Уже привязано — чистим оставшиеся пустышки сезонов, ничего не создаём.
          for (const h of hollows) {
            if (!toDelete.includes(h.id)) toDelete.push(h.id);
          }
          skipped++;
          continue;
        }
        // Старая «пустышка» с тем же названием (прошлый импорт без мэтчинга)?
        // Привязываем её к каталогу вместо создания дубля. Статус/оценку юзера не трогаем.
        // Остальные пустышки группы (другие сезоны) удаляем — их данные уже слиты в survivor.
        if (hollows.length > 0) {
          const [first, ...rest] = hollows;
          const full = buildRow(it, status, it.enriched.contentId, title);
          const { user_id: _u, content_type: _t, user_rating: _r, status: _s, is_favorite: _f, ...catalogFields } = full;
          toUpdate.push({ id: first.id, fields: catalogFields });
          for (const h of rest) {
            if (!toDelete.includes(h.id)) toDelete.push(h.id);
          }
          byId.add(idKey);
          continue;
        }
        const dups = byTitle.get(titleKey(type, baseTitle, year || '')) || [];
        if (dups.length > 0) {
          skipped++; // у юзера уже есть этот тайтл под другим id — не трогаем
          continue;
        }
        toInsert.push(buildRow(it, status, it.enriched.contentId, title));
        byId.add(idKey);
        const tk = titleKey(type, baseTitle, year || '');
        byTitle.set(tk, [...(byTitle.get(tk) || []), { id: '', content_type: type, content_id: it.enriched.contentId, title: baseTitle, release_year: year || null }]);
        continue;
      }
      // Без совпадения: дедуп по названию, вставка «пустышки» как раньше.
      const key = titleKey(it.contentType, baseTitle, year || '');
      const keyNoYear = titleKey(it.contentType, baseTitle, '');
      const dups = byTitle.get(key) || byTitle.get(keyNoYear) || [];
      if (dups.length > 0) {
        skipped++;
        continue;
      }
      byTitle.set(key, [{ id: '', content_type: it.contentType, content_id: '', title: baseTitle, release_year: year || null }]);
      const contentId = `imp-${slugify(baseTitle)}${year ? `-${year}` : ''}`;
      toInsert.push(buildRow(it, status, contentId, baseTitle));
    }
    if (toInsert.length > 0) {
      const { error } = await supabase
        .from('content_bookmarks')
        .upsert(toInsert, { onConflict: 'user_id,content_id,content_type', ignoreDuplicates: true });
      if (error) {
        console.error('Import batch error:', error);
        failed += toInsert.length;
      } else {
        created += toInsert.length;
      }
    }
    opts?.onProgress?.(Math.min(i + BATCH, items.length), items.length);
  }

  // Привязка старых пустышек — пачками по 20.
  for (let i = 0; i < toUpdate.length; i += 20) {
    const chunk = toUpdate.slice(i, i + 20);
    const results = await Promise.all(
      chunk.map(async ({ id, fields }) => {
        const { error } = await supabase.from('content_bookmarks').update(fields).eq('id', id);
        return !error;
      })
    );
    results.forEach((ok) => {
      if (ok) updated++;
      else failed++;
    });
  }

  // Удаление поглощённых пустышек сезонов (их данные слиты в survivor).
  // Трогаем только свои imp-* строки — обычные закладки никогда не удаляем.
  const doomed = [...new Set(toDelete)];
  for (let i = 0; i < doomed.length; i += 20) {
    const chunk = doomed.slice(i, i + 20);
    const results = await Promise.all(
      chunk.map(async (id) => {
        const { error } = await supabase.from('content_bookmarks').delete().eq('id', id);
        return !error;
      })
    );
    results.forEach((ok) => {
      if (ok) updated++;
      else failed++;
    });
  }

  return { created, updated, skipped, failed };
}
