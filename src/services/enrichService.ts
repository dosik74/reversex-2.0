// Сопоставление импортируемых тайтлов с каталогом сайта (TMDB).
//
// Проблема: импорт создавал «пустышки» — строки без постера/описания и без привязки
// к странице каталога (content_id вида `imp-...`, клик никуда не ведёт).
// Решение: каждый тайтл ищем в TMDB (тот же источник, что и каталог сайта) и, если
// находим совпадение по названию, привязываем TMDB-id + подтягиваем
// постер, описание, жанры, год и внешний рейтинг. Клик по такой закладке открывает
// страницу фильма/сериала как обычно.
//
// Детерминированность: сетевые сбои (429/обрывы) НЕ превращаются молча в
// «нет совпадения» — айтем помечается matchFailed, в конце идёт добивочный проход,
// остаток честно показывается в UI. Один и тот же файл даёт один и тот же результат
// (повторный импорт только долечивает непроверенные).
//
// Матчинг строгий, чтобы не прилинковать чужую страницу:
// точное совпадение → базовая страница шоу для сезонов → alternative titles
// (ромадзи при японском оригинале) → кросс-раздел series↔movie для фильмов без маркеров.

import { TMDB_API_KEY, TMDB_BASE_URL, normalizeTvItem } from '@/utils/tmdbApi';

export interface Enrichment {
  /** TMDB id — тот же content_id, что используют карточки каталога */
  contentId: string;
  /** Если совпадение нашлось в другом разделе (сериал оказался фильмом и наоборот) */
  contentType?: 'movie' | 'series';
  title?: string;
  posterUrl?: string;
  synopsis?: string;
  genre?: string;
  releaseYear?: string;
  externalRating?: number;
}

/** Минимальная форма айтема, нужная для мэтчинга (структурная — без импорта типов). */
export interface EnrichableItem {
  title: string;
  originalTitle?: string;
  contentType: 'movie' | 'series' | 'game' | 'anime';
  enriched?: Enrichment;
  /** true — сверить с каталогом не удалось из-за сети (не «нет совпадения», а «не проверено») */
  matchFailed?: boolean;
}

const norm = (s: string | undefined): string =>
  (s || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-z0-9а-я]+/gi, '');

// ── Троттлинг TMDB: не чаще 1 запроса в 400мс, ретраи с backoff ──
// Причина: раньше 429-е и обрывы сети молча превращались в «нет совпадения»,
// и один и тот же файл давал разный результат при каждом импорте.
// Теперь сетевые ошибки КИДАЮТСЯ (а не глотаются): айтем помечается matchFailed,
// повторный импорт его долечивает, а диалог честно показывает счётчик.
const MIN_GAP_MS = 400;
let lastStart = 0;

export class TmdbNetworkError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'TmdbNetworkError';
  }
}

async function tmdbFetch(url: string, retries = 5): Promise<Response> {
  const wait = Math.max(0, MIN_GAP_MS - (Date.now() - lastStart));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastStart = Date.now();
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 1500));
      return tmdbFetch(url, retries - 1);
    }
    throw new TmdbNetworkError(`fetch failed: ${String(e)}`);
  }
  if (res.status === 429 && retries > 0) {
    const retryAfter = parseInt(res.headers.get('retry-after') || '', 10);
    const delay = isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1500 * Math.pow(2, 5 - retries);
    await new Promise((r) => setTimeout(r, delay));
    return tmdbFetch(url, retries - 1);
  }
  if (!res.ok) {
    // 5xx — ретраим, 4xx (кроме 429) — сразу ошибка: молча hollow-ить нельзя
    if (res.status >= 500 && retries > 0) {
      await new Promise((r) => setTimeout(r, 2000));
      return tmdbFetch(url, retries - 1);
    }
    throw new TmdbNetworkError(`TMDB HTTP ${res.status}`);
  }
  return res;
}

interface TmdbCandidate {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  release_date: string;
}

async function searchTmdb(
  query: string,
  kind: 'movie' | 'series'
): Promise<TmdbCandidate[]> {
  const url =
    kind === 'movie'
      ? `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=ru-RU&page=1`
      : `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=ru-RU&page=1`;
  const res = await tmdbFetch(url); // кидает TmdbNetworkError — это fail, а не miss
  const data = await res.json();
  return kind === 'movie' ? data.results || [] : (data.results || []).map(normalizeTvItem);
}

let genreCache: { movie: Map<number, string>; tv: Map<number, string> } | null = null;

async function genreMap(kind: 'movie' | 'series'): Promise<Map<number, string>> {
  if (!genreCache) {
    const [m, t] = await Promise.all([
      tmdbFetch(`${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}&language=ru-RU`).then((r) =>
        r.ok ? r.json() : { genres: [] }
      ),
      tmdbFetch(`${TMDB_BASE_URL}/genre/tv/list?api_key=${TMDB_API_KEY}&language=ru-RU`).then((r) =>
        r.ok ? r.json() : { genres: [] }
      ),
    ]);
    genreCache = {
      movie: new Map((m.genres || []).map((g: any) => [g.id, g.name])),
      tv: new Map((t.genres || []).map((g: any) => [g.id, g.name])),
    };
  }
  return kind === 'movie' ? genreCache.movie : genreCache.tv;
}

/** Точное совпадение по любому из названий кандидата с любым из названий айтема. */
function pickExact(
  candidates: TmdbCandidate[],
  wanted: Set<string>
): TmdbCandidate | null {
  const exact = candidates.filter(
    (c) => wanted.has(norm(c.title)) || wanted.has(norm(c.original_title))
  );
  if (exact.length === 0) return null;
  // При нескольких точных совпадениях — самый известный (голоса, популярность).
  return exact.sort(
    (a, b) => b.vote_count - a.vote_count || b.popularity - a.popularity
  )[0];
}

// Суффиксы сезонов/частей/спешлов — срезаем для поиска базовой страницы шоу:
// «Атака титанов 3. Часть 2» → «Атака титанов 3» → «Атака титанов».
const SEASON_SUFFIX = new RegExp(
  '\\s*(?:' +
    '(?:part|часть|season|сезон)\\s*\\d+' + // Часть 2, Season 3, Part 2
    '|\\d+\\s*(?:st|nd|rd|th)?\\s*(?:season|сезон)' + // 2nd Season
    '|\\d+\\.?' + // висячий номер сезона в конце: «… 2», «… 3.»
    '|ova|ona|specials?|спецвыпуск|рекап|recap' + // OVA/спешлы/рекапы
    '|\\.\\s*(?:kan|zoku)\\s*' + // «. Kan» / «. Zoku» (Oregairu и т.п.)
    '|:\\s*[^:]{3,}' + // «: подзаголовок»
    '|\\s+[-–—]\\s+[^—–-]{3,}' + // « — подзаголовок» (только с пробелами: «Человек-бензопила» не трогаем)
    '|\\s+vs\\.?\\s*.+' + // «vs. U-20 Japan» (второй сезон и т.п.)
    ')\\s*$',
  'i'
);

const MIN_BASE_LEN = 6;

/** Укороченные варианты названия (без суффиксов сезонов/частей/подзаголовков). */
export function baseTitleVariants(t: string): string[] {
  const out: string[] = [];
  let s = (t || '').trim().replace(/\s+/g, ' ');
  for (let i = 0; i < 3; i++) {
    const next = s.replace(SEASON_SUFFIX, '').trim().replace(/\s+/g, ' ');
    if (!next || next === s || norm(next).length < MIN_BASE_LEN) break;
    // Не срезаем «Re:Zero» до «Re» — база должна оставаться осмысленной
    if (next.length < 3) break;
    s = next;
    out.push(s);
  }
  return [...new Set(out)];
}

/**
 * Fallback: кандидат — базовая страница шоу (его название — подстрока названия айтема).
 * Например, сезоны «Демоны старшей школы 2/3/4» → запись «Демоны старшей школы».
 * Строго: только candidate ⊂ wanted, длина от 8 символов, схожесть ≥ 0.5, есть голоса.
 */
function pickBase(
  candidates: TmdbCandidate[],
  wanted: Set<string>
): TmdbCandidate | null {
  const ok = candidates.filter((c) => {
    const cn = norm(c.title);
    const co = norm(c.original_title);
    if ((c.vote_count || 0) < 10) return false;
    return [...wanted].some((w) => {
      if (!w || w.length < MIN_BASE_LEN) return false;
      const contains =
        (cn.length >= MIN_BASE_LEN && w.includes(cn)) ||
        (co.length >= MIN_BASE_LEN && w.includes(co));
      if (!contains) return false;
      const shortLen = Math.min(w.length, Math.max(cn.length, co.length));
      return shortLen / w.length >= 0.5;
    });
  });
  if (ok.length === 0) return null;
  return ok.sort((a, b) => b.vote_count - a.vote_count || b.popularity - a.popularity)[0];
}

/**
 * Последний шанс: у топ-кандидатов проверяем alternative titles
 * (там часто лежит ромадзи, а в основной записи — только японское название).
 * Сначала точное совпадение, затем нечёткое (опечатки TMDB вроде «Come»/«Comedy»:
 * дистанция ≤2 при длине ≥30).
 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;
  if (Math.abs(la - lb) > 2) return 3; // дальше порога — не считаем точно
  let prev = Array.from({ length: lb + 1 }, (_, i) => i);
  for (let i = 1; i <= la; i++) {
    let cur0 = i;
    let minRow = cur0;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(prev[j] + 1, cur0 + 1, prev[j - 1] + cost);
      prev[j - 1] = cur0;
      cur0 = v;
      if (v < minRow) minRow = v;
    }
    prev[lb] = cur0;
    if (minRow > 2) return 3;
  }
  return prev[lb];
}

async function checkAltTitles(
  // Порядок важен: сначала топ-1 каждого запроса (самые релевантные), затем по голосам
  ordered: TmdbCandidate[],
  kind: 'movie' | 'series',
  wanted: Set<string>
): Promise<TmdbCandidate | null> {
  const seen = new Set<number>();
  const tops: TmdbCandidate[] = [];
  for (const c of ordered) {
    if (seen.has(c.id) || (c.vote_count || 0) < 5) continue;
    seen.add(c.id);
    tops.push(c);
    if (tops.length >= 8) break;
  }
  let netErrors = 0;
  let lastErr: unknown = null;
  for (const c of tops) {
    let data: any;
    try {
      const ep = kind === 'movie' ? 'movie' : 'tv';
      const res = await tmdbFetch(
        `${TMDB_BASE_URL}/${ep}/${c.id}/alternative_titles?api_key=${TMDB_API_KEY}`
      );
      data = await res.json();
    } catch (e) {
      netErrors++;
      lastErr = e;
      continue;
    }
      const list: string[] = kind === 'movie'
        ? (data.titles || []).map((t: any) => t.title)
        : (data.results || []).map((t: any) => t.title);
      for (const t of list) {
        const n = norm(t);
        if (!n) continue;
        if (wanted.has(n)) return c;
      }
      // Нечёткое: только для длинных названий и известных записей
      if ((c.vote_count || 0) >= 20) {
        for (const t of list) {
          const n = norm(t);
          if (n.length < 30) continue;
          for (const w of wanted) {
            if (w.length >= 30 && levenshtein(n, w) <= 2) return c;
          }
        }
      }
  }
  // Все alt-запросы упали по сети — это fail, а не miss
  if (tops.length > 0 && netErrors === tops.length && lastErr) throw lastErr;
  return null;
}

function toEnrichment(hit: TmdbCandidate, genres: Map<number, string>): Enrichment {
  const names = (hit.genre_ids || [])
    .map((id) => genres.get(id))
    .filter(Boolean)
    .slice(0, 3) as string[];
  const e: Enrichment = { contentId: String(hit.id) };
  if (hit.title) e.title = hit.title;
  if (hit.poster_path) e.posterUrl = `https://image.tmdb.org/t/p/w500${hit.poster_path}`;
  if (hit.overview) e.synopsis = hit.overview;
  if (names.length > 0) e.genre = names.join(', ');
  const y = (hit.release_date || '').slice(0, 4);
  if (y) e.releaseYear = y;
  if (hit.vote_average > 0) e.externalRating = Math.round(hit.vote_average * 10) / 10;
  return e;
}

export async function matchOne(
  item: EnrichableItem,
  genreMaps: { movie: Map<number, string>; tv: Map<number, string> }
): Promise<Enrichment | null> {
  if (item.contentType !== 'movie' && item.contentType !== 'series') return null;
  const fullTitles = [item.originalTitle, item.title].filter(
    (q, i, arr): q is string => !!q && arr.indexOf(q) === i
  );
  if (fullTitles.length === 0) return null;
  const wanted = new Set(fullTitles.map((t) => norm(t)));
  if ([...wanted].every((w) => !w)) return null;
  // Запросы: полные названия, затем укороченные (база шоу для сезонов/частей).
  const queries = [...fullTitles];
  const baseVariants: string[] = [];
  for (const t of fullTitles) {
    for (const v of baseTitleVariants(t)) {
      if (!queries.includes(v)) queries.push(v);
      if (!baseVariants.includes(v)) baseVariants.push(v);
    }
  }
  // Нормы базовых вариантов — для привязки сезонов к основной записи.
  const wantedBase = new Set([...wanted, ...baseVariants.map((t) => norm(t))]);

  const matchKind = async (
    kind: 'movie' | 'series',
    allowBase: boolean
  ): Promise<Enrichment | null> => {
    const g = kind === 'movie' ? genreMaps.movie : genreMaps.tv;
    const allCandidates: TmdbCandidate[] = [];
    const queryTops: TmdbCandidate[] = [];
    for (const q of queries) {
      // searchTmdb кидает TmdbNetworkError — пробрасываем выше как fail (не miss)
      const candidates = await searchTmdb(q, kind);
      const hit = pickExact(candidates, wanted);
      if (hit) return toEnrichment(hit, g);
      if (candidates[0] && (candidates[0].vote_count || 0) >= 5) queryTops.push(candidates[0]);
      allCandidates.push(...candidates);
    }
    if (allowBase) {
      const base = pickBase(allCandidates, wantedBase);
      if (base) return toEnrichment(base, g);
    }
    // Alt-check: сначала топ-1 каждого запроса, затем остальные по голосам
    const rest = [...allCandidates].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
    const altHit = await checkAltTitles([...queryTops, ...rest], kind, allowBase ? wantedBase : wanted);
    if (altHit) return toEnrichment(altHit, g);
    return null;
  };

  // Проход 1: свой раздел (точное → базовое → alt titles).
  const same = await matchKind(item.contentType, true);
  if (same) return same;
  // Проход 2: соседний раздел (фильм без маркера / сериал среди фильмов).
  // Только точное и alt — без привязки к «базе», чтобы не притянуть чужое.
  const other = item.contentType === 'movie' ? 'series' : 'movie';
  const cross = await matchKind(other, false);
  if (cross) return { ...cross, contentType: other };
  return null;
}

async function pool<T, R>(
  arr: T[],
  limit: number,
  fn: (x: T, i: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void
): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let next = 0;
  let done = 0;
  const workers = Array.from({ length: Math.min(limit, arr.length) }, async () => {
    while (next < arr.length) {
      const i = next++;
      out[i] = await fn(arr[i], i);
      done++;
      onProgress?.(done, arr.length);
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * Обогащает айтемы совпадающими записями TMDB (возвращает новый массив).
 * Игры и уже обогащённые пропускаем.
 * Детерминированность: сетевые сбои НЕ превращаются в miss — айтем помечается
 * matchFailed, в конце делается добивочный проход только по ним, остаток честно
 * показывается в UI («не проверено», а не «не найдено»). Повторный импорт долечивает.
 */
export async function enrichItems<T extends EnrichableItem>(
  items: T[],
  onProgress?: (done: number, total: number) => void
): Promise<T[]> {
  const [movieGenres, tvGenres] = await Promise.all([genreMap('movie'), genreMap('series')]);
  const maps = { movie: movieGenres, tv: tvGenres };
  const matchSafe = async (it: T): Promise<T> => {
    if (it.enriched) return it;
    try {
      const m = await matchOne(it, maps);
      return m ? { ...it, enriched: m } : { ...it, matchFailed: false };
    } catch {
      return { ...it, matchFailed: true };
    }
  };
  let total = items.length;
  let done = 0;
  const tick = () => {
    done++;
    onProgress?.(done, total);
  };
  const run = (list: T[], limit: number) =>
    pool(list, limit, async (it) => {
      const r = await matchSafe(it);
      tick();
      return r;
    });
  // Проход 1: всё параллельно (2 воркера + 400мс гейт ≈ в пределах лимита TMDB)
  let results = await run(items, 2);
  // Проход 2 (добивка): только упавшие по сети — медленно и надёжно
  const failedIdx = results
    .map((r, i) => (r.matchFailed ? i : -1))
    .filter((i) => i >= 0);
  if (failedIdx.length > 0) {
    total += failedIdx.length; // добивка тоже видна в прогрессе
    const retried = await run(
      failedIdx.map((i) => ({ ...results[i], matchFailed: false })),
      1
    );
    retried.forEach((r, k) => {
      results[failedIdx[k]] = r;
    });
  }
  return results;
}
