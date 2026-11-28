import './episodeChart.css';
import EpisodePhotoImport from './EpisodePhotoImport';
import { appearance, defaultAppearance, downloadChart, themes, type Appearance } from './episodeChartExport';
import type { CSSProperties } from 'react';
import { ChevronLeft, ChevronRight, SlidersHorizontal, Link2, Download } from 'lucide-react';
import { imdbScore } from './TitleScores';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import supabase from '@/lib/supabase';
import { loadSeasons, seasonQuery, imdbEpisodePath, type Entry } from './episodeSeasons';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Summary { average: number | null; mine: number | null; count: number; bins: number[] }


type Source = 'average' | 'mine' | 'imdb';
interface GridScore { id: number; average: number | null; mine: number | null }

const bands = [
  { min: 9.7, color: '#45c8fc', label: 'Шедевр' }, { min: 9, color: '#167545', label: 'Отлично' },
  { min: 8, color: '#36ce83', label: 'Очень хорошо' }, { min: 7, color: '#ffd453', label: 'Хорошо' },
  { min: 6, color: '#ff984a', label: 'Средне' }, { min: 4, color: '#f06a68', label: 'Слабо' }, { min: 0, color: '#ad85c9', label: 'Плохо' },
];
function shade(score: number) {
  return bands.find(b => score >= b.min) ?? bands[bands.length - 1];
}

async function gridScores(ids: number[]): Promise<GridScore[]> {
  const rows: GridScore[] = [];
  // The RPC reads at most 250 episode IDs per call.
  for (let start = 0; start < ids.length; start += 250) {
    const { data, error } = await supabase.rpc('episode_grid_scores', { episode_ids: ids.slice(start, start + 250) });
    if (error) throw error;
    rows.push(...data);
  }
  return rows;
}

export default function EpisodeRatings({ seriesId, title, poster }: { seriesId: number; title: string; poster?: string }) {
  const [shared] = useState(() => new URLSearchParams(window.location.hash.startsWith('#episode-ratings?') ? window.location.hash.split('?')[1] : ''));
  const fromLink = shared.has('src');
  const incoming = shared.get('src');
  const [source, setSource] = useState<Source>(incoming === 'mine' || incoming === 'imdb' ? incoming : 'average');
  const [settings,setSettings] = useState<Appearance>(() => {
    if (fromLink) return appearance({theme:shared.get('theme') as Appearance['theme'],compact:shared.get('dense')==='1',tinted:shared.get('tint')!=='0'});
    try { return appearance(JSON.parse(localStorage.getItem('rx-episode-chart') || 'null')); }
    catch { return defaultAppearance; }
  });
  const [customizing,setCustomizing] = useState(false);
  const [busy,setBusy] = useState(false);
  const [feedback,setFeedback] = useState('');
  const [manualLink,setManualLink] = useState('');
  const root = useRef<HTMLElement>(null);
  const client = useQueryClient();
  const snapshot = source === 'mine' && incoming === 'mine' && shared.has('votes');
  const sharedVotes = new Map<number,number>();
  if (snapshot) for (const item of (shared.get('votes') || '').split(',')) {
    const [id,tenths] = item.split('.').map(Number);
    if (Number.isSafeInteger(id) && Number.isInteger(tenths) && tenths>=10 && tenths<=100) sharedVotes.set(id,tenths/10);
  }
  function customize(patch: Partial<Appearance>) {
    const next = {...settings,...patch};
    setSettings(next);
    try { localStorage.setItem('rx-episode-chart',JSON.stringify(next)); } catch { /* storage unavailable */ }
  }
  useEffect(() => { if (fromLink) root.current?.scrollIntoView({block:'start'}); }, [fromLink]);
  const [active, setActive] = useState<Entry | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const grouped = !fromLink || shared.get('layout') === 'seasons';
  const seasons = useQuery({
    queryKey: ['episode-seasons', seriesId, grouped],
    queryFn: () => loadSeasons(seriesId, grouped),
    staleTime: 3600000,
  });
  const columns = seasons.data ?? [];
  const lists = useQueries({ queries: columns.map(s => seasonQuery(seriesId,s)) });
  const entries = lists.flatMap(list => list.data ?? []);
  const numbers = [...new Set(entries.map(ep => ep.episode_number))].sort((a,b) => a-b);
  const byNumber = lists.map(list => new Map(list.data?.map(ep => [ep.episode_number, ep] as const)));
  const ids = entries.map(ep => ep.id);
  const { user } = useAppContext();
  const scores = useQuery({
    queryKey: ['episode-grid', seriesId, user?.id ?? null, ids],
    queryFn: () => gridScores(ids), enabled: ids.length > 0 && source !== 'imdb' && !snapshot, staleTime: 60000,
  });
  const values = new Map(scores.data?.map(row => [row.id, row]));
  const current = active && lists[columns.findIndex(s => s.season_number === active.season_number)]?.data;
  const idx = current?.findIndex(e => e.id === active?.id) ?? -1;

  const sourceLabel = source === 'imdb' ? 'IMDb' : source === 'average' ? 'Зрители сайта' : snapshot ? 'Оценки автора ссылки' : 'Мои оценки';
  const pageReady = ids.length > 0 && lists.every(q => q.isSuccess) && (source === 'imdb' || snapshot || scores.isSuccess);
  const chosenScore = (ep:Entry) => snapshot ? sharedVotes.get(ep.id) : source !== 'imdb' ? values.get(ep.id)?.[source] : null;
  async function share(action:'link'|'png') {
    setBusy(true); setFeedback(''); setManualLink('');
    try {
      if (action === 'link') {
        const url = new URL(`/series/${seriesId}`,window.location.origin);
        const params = new URLSearchParams({src:source,theme:settings.theme,dense:settings.compact?'1':'0',tint:settings.tinted?'1':'0'});
        if (grouped) params.set('layout','seasons');
        if (source === 'mine') params.set('votes',entries.filter(ep => chosenScore(ep)!=null)
          .map(ep => ep.id+'.'+Math.round(chosenScore(ep)*10)).join(','));
        url.hash = 'episode-ratings?'+params.toString();
        try { await navigator.clipboard.writeText(url.href); setFeedback('Ссылка скопирована'); }
        catch { setManualLink(url.href); setFeedback('Скопируйте ссылку'); }
      } else {
        const image = [];
        for (const list of lists) {
          const episodes = list.data;
          if (!episodes.length) continue;
          const cells = [];
          for (let i=0;i<episodes.length;i+=4) {
            cells.push(...await Promise.all(episodes.slice(i,i+4).map(async ep => {
              const result = source === 'imdb' ? await client.fetchQuery({
                queryKey:['episode-imdb',ep.id], staleTime:3600000,
                queryFn:()=>imdbScore(imdbEpisodePath(seriesId,ep)),
              }) : null;
              const score = source === 'imdb' ? result?.rating : chosenScore(ep);
              return {number:ep.episode_number,score:score ?? null,color:score == null ? '#888' : shade(score).color};
            })));
          }
          image.push({label:episodes[0].season_number ? 'Сезон '+episodes[0].season_number : 'Спецвыпуски',cells});
        }
        await downloadChart(title,sourceLabel,settings,image);
        setFeedback('PNG готов');
      }
    } catch { setFeedback('Не удалось выполнить экспорт. Попробуйте ещё раз.'); }
    finally { setBusy(false); }
  }

  return <section ref={root} data-compact={settings.compact} data-tinted={settings.tinted}
    style={{background:themes[settings.theme].background,'--chart-accent':themes[settings.theme].accent,scrollMarginTop:'6rem'} as CSSProperties}
    className="rx-chart min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#141419] text-white">
    <div className="rx-layout">
      <header className="rx-series">
        {poster && <img className="rx-poster" src={poster} alt="" />}
        <div><h2>Оценки серий</h2><p>{title}</p></div>
      </header>
      <div className="rx-content">
      <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Источник оценок" value={source} onChange={e => setSource(e.target.value as Source)}
        className="rounded-full border border-white/15 bg-[#232329] px-3 py-2 text-sm">
        <option value="average">Зрители сайта</option><option value="mine">{snapshot || incoming === 'mine' && shared.has('votes') ? 'Оценки автора ссылки' : 'Мои оценки'}</option><option value="imdb">IMDb</option>
      </select>
      <button className="rx-tool" aria-expanded={customizing} onClick={()=>setCustomizing(!customizing)}><SlidersHorizontal size={16}/>Вид</button>
      <button className="rx-tool" disabled={busy || !pageReady} onClick={()=>share('link')} title="Скопировать ссылку на этот вид"><Link2 size={16}/>Ссылка</button>
      <button className="rx-tool" disabled={busy || !pageReady} onClick={()=>share('png')} title="Скачать отображаемые серии в PNG"><Download size={16}/>{busy ? '…' : 'PNG'}</button>
      {!snapshot && <EpisodePhotoImport seriesId={seriesId} title={title} userId={user?.id} seasons={seasons.data ?? []}
        loadSeason={number=>client.fetchQuery(seasonQuery(seriesId,seasons.data!.find(s=>s.season_number===number)!))} onSaved={count=>{setSource('mine'); setFeedback('Сохранено оценок: '+count);}}/>}
      </div>

        {customizing && <div className="rx-controls">
          <label>Палитра<select value={settings.theme} onChange={e=>customize({theme:e.target.value as Appearance['theme']})}>
            {Object.entries(themes).map(([key,t])=><option key={key} value={key}>{t.label}</option>)}</select></label>
          <label><input type="checkbox" checked={settings.compact} onChange={e=>customize({compact:e.target.checked})}/>Компактные карточки</label>
          <label><input type="checkbox" checked={settings.tinted} onChange={e=>customize({tinted:e.target.checked})}/>Цветная заливка</label>
        </div>}
        {feedback && <p role="status" className="mt-2 text-sm">{feedback}</p>}
        {manualLink && <input aria-label="Ссылка на оценки" readOnly className="w-full bg-black/30 p-2" value={manualLink} onFocus={e=>e.target.select()}/>}
        <div className="rx-legend">
          {bands.map(b => <span key={b.min}><i style={{background:b.color}}/>{b.label} <small>{b.min === 0 ? '<4' : b.min + '+'}</small></span>)}
        </div>
        {seasons.isLoading && <p role="status">Загружаем сезоны…</p>}
        {seasons.isError && <button onClick={() => seasons.refetch()}>Повторить загрузку сезонов</button>}
        {seasons.data?.length === 0 && <p>Серии пока отсутствуют</p>}
        {lists.some(q => q.isLoading) && <p role="status">Загружаем серии…</p>}
        {lists.some(q => q.isError) && <button onClick={() => lists.filter(q => q.isError).forEach(q => q.refetch())}>Повторить загрузку серий</button>}
        {scores.isError && source !== 'imdb' && <button onClick={() => scores.refetch()}>Не удалось загрузить оценки. Повторить</button>}
        {numbers.length > 0 && <div className="rx-scroll">
          <table className="rx-matrix" aria-label={title + ' — оценки серий'}>
            <thead><tr><th scope="col">Серия</th>{columns.map(season =>
              <th scope="col" key={season.season_number}>{season.season_number ? 'Сезон ' + season.season_number : 'Спец.'}</th>
            )}</tr></thead>
            <tbody>{numbers.map(number => <tr key={number}>
              <th scope="row">{number}</th>
              {columns.map((season, i) => {
                const ep = byNumber[i].get(number);
                return <td key={season.season_number}>{ep && <ScoreCell episode={ep} seriesId={seriesId} source={source}
                  loading={!snapshot && scores.isLoading} value={chosenScore(ep)}
                  onOpen={button => { trigger.current = button; setActive(ep); }} />}</td>;
              })}
            </tr>)}</tbody>
          </table>
        </div>}
    </div>
    </div>
    <Dialog open={!!active} onOpenChange={open => { if (!open) setActive(null); }}>
      {active && <DialogContent onCloseAutoFocus={e => { e.preventDefault(); trigger.current?.focus(); }}
        className="rx-chart block max-h-[90dvh] w-[min(95vw,58rem)] max-w-none overflow-y-auto rounded-2xl border-white/10 bg-[#191919] p-0 text-white">
        <div className="flex items-center gap-4 border-b border-white/10 px-5 py-3 pr-12">
          <button aria-label="Предыдущая серия" disabled={idx <= 0} className="disabled:opacity-25" onClick={() => setActive(current[idx-1])}><ChevronLeft/></button>
          <div className="min-w-0 flex-1"><DialogTitle>Сезон {active.season_number} · Серия {active.episode_number}</DialogTitle><DialogDescription>{title}</DialogDescription></div>
          <button aria-label="Следующая серия" disabled={!current || idx >= current.length-1} className="disabled:opacity-25" onClick={() => setActive(current[idx+1])}><ChevronRight/></button>
        </div>
        <EpisodePanel key={active.id} episode={active} season={active.season_number} path={imdbEpisodePath(seriesId,active)} />
      </DialogContent>}
    </Dialog>
  </section>;
}

function ScoreCell({ episode, seriesId, source, value, loading, onOpen }: { episode:Entry; seriesId:number; source:Source; value?:number|null; loading:boolean; onOpen:(button:HTMLButtonElement)=>void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (source !== 'imdb' || !ref.current) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [source]);
  const imdb = useQuery({
    queryKey: ['episode-imdb', episode.id],
    queryFn: () => imdbScore(imdbEpisodePath(seriesId,episode)),
    enabled: source === 'imdb' && visible, staleTime: 3600000,
  });
  const score = source === 'imdb' ? imdb.data?.rating : value;
  const pending = source === 'imdb' ? imdb.isLoading : loading;
  const caption = score != null ? score.toFixed(1) : pending ? '…' : '—';
  return <button ref={ref} title={episode.name} aria-label={`Сезон ${episode.season_number}, серия ${episode.episode_number}. ${episode.name}. ${score != null ? caption : pending ? 'Загрузка' : 'Нет оценки'}`}
    onClick={e => onOpen(e.currentTarget)} data-scored={score != null}
    style={score != null ? {'--score-color': shade(score).color, '--score-ink': shade(score).min === 9 ? '#fff' : '#101317'} as CSSProperties : undefined}
    className="rx-cell">{caption}
  </button>;
}

function EpisodePanel({ episode, season, path }: { episode: Entry; season: number; path: string }) {
  const { user } = useAppContext();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const key = ['episode-votes', episode.id, user?.id ?? null];
  const votes = useQuery({
    queryKey: key,
    queryFn: async (): Promise<Summary> => {
      const { data, error } = await supabase.rpc('episode_vote_summary', { target_episode: episode.id });
      if (error) throw error;
      return data;
    },
  });
  const imdb = useQuery({
    queryKey: ['episode-imdb', episode.id],
    queryFn: () => imdbScore(path),
    staleTime: 3600000,
  });
  const save = useMutation({
    mutationFn: async (score: number | null) => {
      if (!user) throw new Error('Требуется вход');
      const row = { episode_id: episode.id, user_id: user.id };
      const table = supabase.from('episode_votes');
      const { error } = score === null ? await table.delete().match(row) :
        await table.upsert({ ...row, score: Math.round(score * 10) }, { onConflict: 'episode_id,user_id' });
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([client.invalidateQueries({ queryKey: ['episode-votes', episode.id] }), client.invalidateQueries({ queryKey: ['episode-grid', Number(path.split('/')[1])] })]);
      setOpen(false);
    },
  });
  const stats = votes.data;
  const numeric = Number(draft.replace(',', '.'));
  const valid = /^\d{1,2}([.,]\d)?$/.test(draft) && numeric >= 1 && numeric <= 10;
  return <div className="grid sm:grid-cols-[1.15fr_1fr]">
    <div>
      {episode.still_path && <img alt={episode.name} src={`https://image.tmdb.org/t/p/w780${episode.still_path}`} className="aspect-video w-full object-cover" />}
      <div className="p-5">
        <h3 className="text-xl font-bold">{episode.name}</h3>
        <p className="mt-1 text-sm text-neutral-400">{[episode.air_date, episode.runtime && `${episode.runtime} мин`].filter(Boolean).join(' · ')}</p>
        {episode.overview && <p className="mt-4 text-sm leading-relaxed text-neutral-300">{episode.overview}</p>}
      </div>
    </div>
    <div className="border-white/10 p-5 sm:border-l">
    <div className="grid grid-cols-3 gap-2 border-y border-white/10 py-4 text-center text-xs sm:text-sm">
      <div>IMDb<strong className="block text-2xl text-amber-300">{imdb.data?.rating != null ?
        <a href={`https://www.imdb.com/title/${imdb.data.id}/`} target="_blank" rel="noreferrer">{imdb.data.rating.toFixed(1)}</a> : imdb.isLoading ? '…' : '—'}</strong></div>
      <div>Зрители сайта<strong className="block text-2xl text-emerald-400">{stats?.average?.toFixed(1) ?? (votes.isLoading ? '…' : '—')}</strong></div>
      <div>Ваша оценка<strong className="block text-2xl text-emerald-400">{stats?.mine?.toFixed(1) ?? (votes.isLoading ? '…' : '—')}</strong></div>
    </div>
    {imdb.isError && <p className="mt-2 text-sm text-neutral-400">Рейтинг IMDb временно недоступен</p>}
    {votes.isError && <button className="mt-3 underline" onClick={() => votes.refetch()}>Не удалось загрузить голоса. Повторить</button>}
    {stats && <figure className="mt-5">
      <figcaption className="mb-2 flex justify-between text-sm"><span>Распределение оценок</span><span>Голосов: {stats.count}</span></figcaption>
      <div className="grid grid-cols-10 gap-1">{stats.bins.map((count, i) => {
        const label = `${Math.max(1, i + 0.5).toFixed(1)}–${Math.min(10, i + 1.4).toFixed(1)}: ${count}`;
        return <div key={i} title={label} aria-label={label} className="text-center text-xs text-neutral-400">
          <div className="mb-1 flex h-16 items-end overflow-hidden rounded bg-neutral-800">
            <div className="w-full bg-emerald-500" style={{ height: `${100 * count / Math.max(1, ...stats.bins)}%` }} />
          </div>{i + 1}
        </div>;
      })}</div>
    </figure>}
    <div className="mt-5">{user ? <Dialog open={open} onOpenChange={value => {
      if (save.isPending) return;
      if (value) { setDraft((stats?.mine ?? 8).toFixed(1)); save.reset(); }
      setOpen(value);
    }}>
      <DialogTrigger disabled={!stats} className="rounded-full bg-white px-5 py-2 font-semibold text-black disabled:opacity-50">
        {stats?.mine != null ? 'Изменить оценку' : 'Оценить серию'}
      </DialogTrigger>
      <DialogContent className="rx-chart w-[min(92vw,26rem)] rounded-2xl bg-neutral-900 text-center text-white">
        <DialogTitle>Оценить серию</DialogTitle>
        <DialogDescription>{episode.name} · S{season} E{episode.episode_number}</DialogDescription>
        <input aria-label="Оценка от 1 до 10" inputMode="decimal" value={draft} onChange={e => setDraft(e.target.value)}
          className="w-full bg-transparent text-center text-6xl font-bold tabular-nums text-emerald-400" />
        <input type="range" aria-label="Выбрать оценку" min="1" max="10" step="0.1" value={valid ? numeric : 1}
          onChange={e => setDraft(Number(e.target.value).toFixed(1))} className="w-full accent-emerald-500" />
        <p className="text-sm text-neutral-400">От 1 до 10 с шагом 0.1</p>
        <button disabled={!valid || save.isPending} onClick={() => save.mutate(numeric)} className="rounded-full bg-white py-3 font-bold text-black disabled:opacity-50">Сохранить</button>
        {stats?.mine != null && <button disabled={save.isPending} onClick={() => save.mutate(null)} className="text-red-300">Удалить оценку</button>}
        {save.isError && <p role="alert">Не удалось сохранить изменение. Попробуйте ещё раз.</p>}
      </DialogContent>
    </Dialog> : <Link to="/auth" className="underline">Войти, чтобы оценить серию</Link>}</div>
    </div>
  </div>;
}
