/**
 * Глобальный дедуп каталога:
 * 1. dedupeById — выкидывает повторы одного id (TMDB/RAWG отдают
 *    пересекающиеся страницы, пока данные догружаются фоном).
 * 2. titleBase + claimExclusive — каждый тайтл живёт ровно в одном
 *    ряду страницы: повторяются ни постеры, ни «родственники»
 *    франшизы («Обитель зла» vs «Обитель зла: Раккун-Сити»).
 */

/** Убрать дубли по id, сохранив порядок. */
export function dedupeById<T extends { id: number | string }>(items: T[]): T[] {
  const seen = new Set<number | string>();
  const out: T[] = [];
  for (const it of items) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  return out;
}

/**
 * База названия для сравнения: нижний регистр, отрезаны подзаголовки
 * после «:», «—», «-», «(», убрана пунктуация.
 * «Обитель зла: Раккун-Сити» → «обитель зла».
 */
export function titleBase(title: string | undefined | null): string {
  let s = (title || '').toLowerCase().trim();
  const cuts = [' :', ' —', ' –', ' - ', ' (', ' ['];
  for (const c of cuts) {
    const i = s.indexOf(c);
    if (i > 0) s = s.slice(0, i);
  }
  return s
    .replace(/[^a-zа-яё0-9\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Забрать первые n элементов списка, которых ещё нигде нет:
 * ни по id, ни по базе названия. Забранное помечается в used-sets.
 */
export function claimExclusive<T>(
  items: T[],
  n: number,
  usedIds: Set<number | string>,
  usedTitles: Set<string>,
  idOf: (t: T) => number | string,
  titleOf: (t: T) => string,
): T[] {
  const out: T[] = [];
  for (const it of items) {
    if (out.length >= n) break;
    const id = idOf(it);
    const base = titleBase(titleOf(it));
    if (usedIds.has(id)) continue;
    if (base && usedTitles.has(base)) continue;
    usedIds.add(id);
    if (base) usedTitles.add(base);
    out.push(it);
  }
  return out;
}
