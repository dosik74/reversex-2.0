import { useMemo, useRef, useState } from 'react';
import { Upload, X, FileText, Check, Loader2, Download } from 'lucide-react';
import { useBookmarks } from '@/context/BookmarkContext';
import type { ContentStatus } from '@/types/anime';
import { CONTENT_STATUS_CONFIG } from '@/types/anime';
import {
  parseImportFile,
  importParsedItems,
  IMPORT_SOURCE_LABEL,
  IMPORT_SOURCE_HINT,
  type ImportSource,
  type ParseResult,
} from '@/services/importService';
import { enrichItems } from '@/services/enrichService';
import { toast } from 'sonner';

const SOURCES: ImportSource[] = ['auto', 'letterboxd', 'imdb', 'anime', 'kinopoisk', 'steam', 'generic'];

const TYPE_LABEL: Record<string, string> = {
  movie: 'Фильмы',
  series: 'Сериалы',
  anime: 'Аниме',
  game: 'Игры',
};

export default function ImportBookmarksDialog({ onDone }: { onDone?: () => void }) {
  const { userId, refresh } = useBookmarks();
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<ImportSource>('auto');
  const [statusOverride, setStatusOverride] = useState<'' | ContentStatus>('');
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [matching, setMatching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<ParseResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const runIdRef = useRef(0);

  const byType = useMemo(() => {
    const m: Record<string, number> = {};
    result?.items.forEach((i) => {
      m[i.contentType] = (m[i.contentType] || 0) + 1;
    });
    return m;
  }, [result]);

  const matchedCount = useMemo(
    () => result?.items.filter((i) => i.enriched).length ?? 0,
    [result]
  );
  const failedCount = useMemo(
    () => result?.items.filter((i) => i.matchFailed && !i.enriched).length ?? 0,
    [result]
  );

  const reset = () => {
    runIdRef.current++;
    setFileName('');
    setResult(null);
    setMatching(false);
    setProgress({ done: 0, total: 0 });
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const runId = ++runIdRef.current;
    setParsing(true);
    setFileName(file.name);
    try {
      const parsed = await parseImportFile(file, source);
      if (runIdRef.current !== runId) return;
      setResult(parsed);
      if (parsed.items.length === 0) {
        toast.error('В файле не нашли тайтлов для импорта');
        return;
      }
      // Этап 2: ищем тайтлы в каталоге (TMDB), чтобы подтянуть постеры и страницы.
      const matchable = parsed.items.some((i) => i.contentType === 'movie' || i.contentType === 'series');
      if (matchable) {
        setMatching(true);
        setProgress({ done: 0, total: parsed.items.length });
        try {
          const enriched = await enrichItems(parsed.items, (done, total) =>
            setProgress({ done, total })
          );
          if (runIdRef.current !== runId) return;
          const hits = enriched.filter((i) => i.enriched).length;
          const failed = enriched.filter((i) => i.matchFailed && !i.enriched).length;
          setResult({ ...parsed, items: enriched });
          if (hits > 0) toast.success(`Найдено в каталоге: ${hits} из ${enriched.length} — будут постеры и страницы`);
          else toast.warning('Совпадений в каталоге не нашли — импортируется без постеров');
          if (failed > 0) toast.warning(`Не проверено из-за сети: ${failed}. Они добавятся без постера, повторный импорт их привяжет.`);
        } finally {
          if (runIdRef.current === runId) setMatching(false);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Не удалось прочитать файл');
    } finally {
      if (runIdRef.current === runId) setParsing(false);
    }
  };

  const skipMatching = () => {
    // Отменяем применение результатов поиска — импортируем как есть.
    runIdRef.current++;
    setMatching(false);
  };

  const handleImport = async () => {
    if (!userId) {
      toast.error('Требуется вход');
      return;
    }
    if (!result || result.items.length === 0) return;
    setImporting(true);
    try {
      const summary = await importParsedItems(userId, result.items, {
        source: IMPORT_SOURCE_LABEL[result.detectedSource],
        statusOverride: statusOverride || null,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      await refresh();
      const parts: string[] = [];
      if (byType.movie) parts.push(`фильмы: ${byType.movie}`);
      if (byType.series) parts.push(`сериалы: ${byType.series}`);
      if (byType.anime) parts.push(`аниме: ${byType.anime}`);
      if (byType.game) parts.push(`игры: ${byType.game}`);
      const where = parts.length ? ` (${parts.join(', ')}) — смотри вкладки типов` : '';
      if (summary.failed > 0 && summary.created === 0 && summary.updated === 0) {
        toast.error(`Не импортировано: ошибок ${summary.failed}. Проверь подключение и попробуй ещё раз.`);
      } else {
        const upd = summary.updated ? `, привязано к каталогу: ${summary.updated}` : '';
        toast.success(`Импортировано: ${summary.created}${upd}${where}${summary.skipped ? `, дублей пропущено: ${summary.skipped}` : ''}${summary.failed ? `, ошибок: ${summary.failed}` : ''}`);
      }
      onDone?.();
      setOpen(false);
      reset();
    } catch (e) {
      console.error(e);
      toast.error('Ошибка импорта');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-[46px] px-4 rounded-xl bg-gradient-to-b from-amber-200 to-amber-400 text-black text-sm font-semibold shadow-lg shadow-amber-500/25 hover:brightness-105 transition-all flex items-center gap-2 whitespace-nowrap"
      >
        <Download className="w-4 h-4" />
        Импорт
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Импорт закладок</h3>
                <p className="text-xs text-zinc-500 mt-0.5">CSV / JSON / XML из Letterboxd, IMDb, Anixart, AniList, MAL, Shikimori, Кинопоиска, Steam</p>
              </div>
              <button onClick={() => { setOpen(false); reset(); }} className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            {/* Source */}
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-1.5">Откуда импорт</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {SOURCES.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSource(s); setResult(null); setFileName(''); if (inputRef.current) inputRef.current.value = ''; }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    source === s ? 'bg-white text-black' : 'bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]'
                  }`}
                >
                  {IMPORT_SOURCE_LABEL[s]}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mb-4">{IMPORT_SOURCE_HINT[source]}</p>

            {/* Drop zone */}
            <div
              onClick={() => inputRef.current?.click()}
              className="border border-dashed border-zinc-700 hover:border-amber-200/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-white/[0.02]"
            >
              <Upload className="w-7 h-7 mx-auto mb-2 text-zinc-500" />
              {fileName ? (
                <p className="text-sm text-white font-medium flex items-center justify-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-300" /> {fileName}
                </p>
              ) : (
                <>
                  <p className="text-sm text-zinc-300 font-medium">Выберите файл экспорта</p>
                  <p className="text-xs text-zinc-600 mt-1">.csv, .json (AniList), .xml (MyAnimeList)</p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.json,.xml,.txt"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>

            {parsing && (
              <p className="mt-3 text-xs text-zinc-400 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Разбираем файл...
              </p>
            )}

            {result && !parsing && (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  Распознано как <b className="text-white">{IMPORT_SOURCE_LABEL[result.detectedSource]}</b>
                  — найдено тайтлов: <b className="text-white">{result.items.length}</b>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {Object.entries(byType).map(([t, n]) => (
                    <span key={t} className="text-[11px] px-2 py-1 rounded-lg bg-white/[0.06] text-zinc-300">
                      {TYPE_LABEL[t] || t}: <b className="text-white tabular-nums">{n}</b>
                    </span>
                  ))}
                </div>
                {result.warnings.map((w, i) => (
                  <p key={i} className="text-[11px] text-orange-300/90 mb-1">⚠ {w}</p>
                ))}

                {/* Matching progress */}
                {matching && (
                  <div className="mt-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                    <p className="text-xs text-zinc-300 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      Ищем в каталоге... <span className="tabular-nums text-zinc-500">{progress.done} / {progress.total}</span>
                    </p>
                    <div className="h-1.5 mt-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-200 to-amber-400 transition-all"
                        style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                      />
                    </div>
                    <button onClick={skipMatching} className="mt-2 text-[11px] text-zinc-500 hover:text-zinc-200 underline">
                      Пропустить поиск (импортировать без постеров)
                    </button>
                  </div>
                )}
                {!matching && matchedCount > 0 && (
                  <p className="mt-2 text-[11px] text-emerald-300/90 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Совпало с каталогом: {matchedCount} из {result.items.length} — у них будут постеры, описания и страницы. Остальные добавятся без постера.
                  </p>
                )}
                {!matching && failedCount > 0 && (
                  <p className="mt-2 text-[11px] text-orange-300/90">
                    ⚠ Не проверено из-за сети: {failedCount}. Добавятся без постера — повторный импорт того же файла их привяжет.
                  </p>
                )}

                {/* Preview */}
                <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-white/[0.07] divide-y divide-white/[0.05]">
                  {result.items.slice(0, 20).map((it, i) => (
                    <div key={i} className="px-3 py-2 flex items-center gap-2 text-xs">
                      {it.enriched?.posterUrl ? (
                        <img src={it.enriched.posterUrl} alt="" className="w-7 h-10 rounded object-cover shrink-0" loading="lazy" />
                      ) : (
                        <span className={`w-7 h-10 rounded shrink-0 flex items-center justify-center text-[10px] font-bold ${it.enriched ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-600'}`}>
                          {it.enriched ? '✓' : '?'}
                        </span>
                      )}
                      <span className="text-white truncate flex-1">{it.enriched?.title || it.title}{it.year ? ` (${it.year})` : ''}</span>
                      <span className="text-zinc-500 shrink-0">{TYPE_LABEL[it.contentType]}</span>
                      <span className="text-zinc-500 shrink-0">→ {CONTENT_STATUS_CONFIG[statusOverride || it.status].label}</span>
                      {it.userRating ? <span className="text-amber-300 shrink-0 tabular-nums">★{it.userRating.toFixed(1)}</span> : null}
                    </div>
                  ))}
                </div>
                {result.items.length > 20 && (
                  <p className="text-[11px] text-zinc-600 mt-1">...и ещё {result.items.length - 20}</p>
                )}

                {/* Status override */}
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 mt-4 mb-1.5">Статус для всех (необязательно)</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setStatusOverride('')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold ${!statusOverride ? 'bg-white text-black' : 'bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]'}`}
                  >
                    Авто
                  </button>
                  {(Object.keys(CONTENT_STATUS_CONFIG) as ContentStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusOverride(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusOverride === s ? 'bg-white text-black' : 'bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]'}`}
                    >
                      {CONTENT_STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>

                {importing && (
                  <div className="mt-3">
                    <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-200 to-amber-400 transition-all"
                        style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1 tabular-nums">{progress.done} / {progress.total}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { reset(); }}
                    disabled={importing}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  >
                    Другой файл
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing || matching || result.items.length === 0}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-b from-amber-200 to-amber-400 text-black text-sm font-semibold shadow-lg shadow-amber-500/25 hover:brightness-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                    Импортировать ({result.items.length})
                  </button>
                </div>
                <p className="text-[11px] text-zinc-600 mt-2">Дубли пропускаются, ваши оценки и статусы не перезаписываются. Повторный импорт привяжет старые записи без постеров к каталогу.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
