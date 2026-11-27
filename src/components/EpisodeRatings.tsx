import { ChevronLeft, ChevronRight } from 'lucide-react';
import { imdbScore } from './TitleScores';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import supabase from '@/lib/supabase';
import { TMDB_API_KEY, TMDB_BASE_URL } from '@/utils/tmdbApi';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Season { season_number: number; episode_count: number }
interface Episode { id: number; episode_number: number; name: string; overview: string; still_path: string | null }
interface Summary { average: number | null; mine: number | null; count: number; bins: number[] }

async function tmdb<T>(path: string): Promise<T> {
  const response = await fetch(`${TMDB_BASE_URL}/tv/${path}?api_key=${TMDB_API_KEY}&language=ru-RU`);
  if (!response.ok) throw new Error('TMDB unavailable');
  return response.json();
}

type Source = 'average' | 'mine' | 'imdb';
type Entry = Episode & { season_number: number; air_date?: string; runtime?: number };
interface GridScore { id: number; average: number | null; mine: number | null }

const bands = [
  { min: 9.7, color: '#45c8fc' }, { min: 9, color: '#167545' },
  { min: 8, color: '#36ce83' }, { min: 7, color: '#ffd453' },
  { min: 6, color: '#ff984a' }, { min: 4, color: '#f06a68' }, { min: 0, color: '#ad85c9' },
];
function shade(score: number) {
  return bands.find(b => score >= b.min) ?? bands[bands.length - 1];
}

async function gridScores(ids: number[]): Promise<GridScore[]> {
  const { data, error } = await supabase.rpc('episode_grid_scores', { episode_ids: ids });
  if (error) throw error;
  return data;
}

export default function EpisodeRatings({ seriesId, title, poster }: { seriesId: number; title: string; poster?: string }) {
  const [source, setSource] = useState<Source>('average');
  const [seasonPage, setSeasonPage] = useState(0);
  const [rowPage, setRowPage] = useState(0);
  const [active, setActive] = useState<Entry | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const seasons = useQuery({
    queryKey: ['episode-seasons', seriesId],
    queryFn: async () => (await tmdb<{ seasons: Season[] }>(String(seriesId))).seasons
      .filter(s => s.episode_count > 0).sort((a,b) => (a.season_number || Infinity) - (b.season_number || Infinity)),
    staleTime: 3600000,
  });
  const columns = (seasons.data ?? []).slice(seasonPage * 5, seasonPage * 5 + 5);
  const lists = useQueries({ queries: columns.map(s => ({
    queryKey: ['episode-list', `${seriesId}/season/${s.season_number}`],
    queryFn: async () => (await tmdb<{ episodes: Entry[] }>(`${seriesId}/season/${s.season_number}`)).episodes,
    staleTime: 3600000,
  })) });
  const entries = lists.flatMap(list => list.data ?? []);
  const numbers = [...new Set(entries.map(ep => ep.episode_number))].sort((a,b) => a-b);
  const visible = numbers.slice(rowPage * 25, rowPage * 25 + 25);
  const ids = entries.filter(ep => visible.includes(ep.episode_number)).map(ep => ep.id);
  const { user } = useAppContext();
  const scores = useQuery({
    queryKey: ['episode-grid', seriesId, user?.id ?? null, ids],
    queryFn: () => gridScores(ids), enabled: ids.length > 0 && source !== 'imdb', staleTime: 60000,
  });
  const values = new Map(scores.data?.map(row => [row.id, row]));
  const current = active && lists[columns.findIndex(s => s.season_number === active.season_number)]?.data;
  const idx = current?.findIndex(e => e.id === active?.id) ?? -1;

  return <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#141419] text-white">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-violet-500/10 to-transparent px-4 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {poster && <img src={poster} alt="" className="h-12 w-8 rounded object-cover" />}
        <div className="min-w-0"><p className="truncate text-xs text-neutral-400">{title}</p>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Оценки серий</h2>
        </div>
      </div>
      <select aria-label="Источник оценок" value={source} onChange={e => setSource(e.target.value as Source)}
        className="rounded-full border border-white/15 bg-[#232329] px-3 py-2 text-sm">
        <option value="average">Зрители сайта</option><option value="mine">Мои оценки</option><option value="imdb">IMDb</option>
      </select>
    </header>
    <div className="px-4 pb-5 sm:px-6">
        <div className="my-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-300">
          {bands.map(b => <span key={b.min} className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{background:b.color}}/>{b.min === 0 ? '<4' : b.min + '+'}</span>)}
        </div>
        {seasons.isLoading && <p role="status">Загружаем сезоны…</p>}
        {seasons.isError && <button onClick={() => seasons.refetch()}>Повторить загрузку сезонов</button>}
        {seasons.data?.length === 0 && <p>Серии пока отсутствуют</p>}
        {lists.some(q => q.isLoading) && <p role="status">Загружаем серии…</p>}
        {lists.some(q => q.isError) && <button onClick={() => lists.filter(q => q.isError).forEach(q => q.refetch())}>Повторить загрузку серий</button>}
        {scores.isError && source !== 'imdb' && <button onClick={() => scores.refetch()}>Не удалось загрузить оценки. Повторить</button>}
        {lists.map((list, i) => {
          const episodes = list.data?.filter(ep => visible.includes(ep.episode_number));
          if (!episodes?.length) return null;
          const season = columns[i].season_number;
          return <div key={season} className="mt-5">
            <h3 className="mb-2 flex items-center gap-3 text-sm font-semibold">
              {season ? `Сезон ${season}` : 'Спецвыпуски'}<span aria-hidden="true" className="h-px flex-1 bg-white/10" />
            </h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(4.25rem,1fr))] gap-1.5 sm:grid-cols-[repeat(auto-fill,minmax(5rem,1fr))]">
              {episodes.map(ep => <ScoreCell key={ep.id} episode={ep} seriesId={seriesId} source={source}
                loading={scores.isLoading} value={source === 'imdb' ? null : values.get(ep.id)?.[source]}
                onOpen={button => { trigger.current = button; setActive(ep); }} />)}
            </div>
          </div>;
        })}
        {(seasons.data?.length ?? 0) > 5 && <Pager page={seasonPage} size={5} total={seasons.data.length} label="Сезоны" change={page => { setSeasonPage(page); setRowPage(0); }}/>}
        {numbers.length > 25 && <Pager page={rowPage} size={25} total={numbers.length} label="Серии" change={setRowPage}/>}
    </div>
    <Dialog open={!!active} onOpenChange={open => { if (!open) setActive(null); }}>
      {active && <DialogContent onCloseAutoFocus={e => { e.preventDefault(); trigger.current?.focus(); }}
        className="block max-h-[90dvh] w-[min(95vw,58rem)] max-w-none overflow-y-auto rounded-2xl border-white/10 bg-[#191919] p-0 text-white">
        <div className="flex items-center gap-4 border-b border-white/10 px-5 py-3 pr-12">
          <button aria-label="Предыдущая серия" disabled={idx <= 0} className="disabled:opacity-25" onClick={() => setActive(current[idx-1])}><ChevronLeft/></button>
          <div className="min-w-0 flex-1"><DialogTitle>Сезон {active.season_number} · Серия {active.episode_number}</DialogTitle><DialogDescription>{title}</DialogDescription></div>
          <button aria-label="Следующая серия" disabled={!current || idx >= current.length-1} className="disabled:opacity-25" onClick={() => setActive(current[idx+1])}><ChevronRight/></button>
        </div>
        <EpisodePanel key={active.id} episode={active} season={active.season_number} path={`${seriesId}/season/${active.season_number}`} />
      </DialogContent>}
    </Dialog>
  </section>;
}

function Pager({ page, size, total, label, change }: { page:number; size:number; total:number; label:string; change:(n:number)=>void }) {
  return <div className="mt-3 flex items-center gap-3 text-sm">
    <button aria-label={label + ' назад'} disabled={!page} className="disabled:opacity-25" onClick={() => change(page-1)}><ChevronLeft size={18}/></button>
    {label} {page*size+1}–{Math.min(total,(page+1)*size)}
    <button aria-label={label + ' дальше'} disabled={(page+1)*size>=total} className="disabled:opacity-25" onClick={() => change(page+1)}><ChevronRight size={18}/></button>
  </div>;
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
    queryFn: () => imdbScore(`tv/${seriesId}/season/${episode.season_number}/episode/${episode.episode_number}`),
    enabled: source === 'imdb' && visible, staleTime: 3600000,
  });
  const score = source === 'imdb' ? imdb.data?.rating : value;
  const pending = source === 'imdb' ? imdb.isLoading : loading;
  const caption = score != null ? score.toFixed(1) : pending ? '…' : '—';
  return <button ref={ref} title={episode.name} aria-label={`Сезон ${episode.season_number}, серия ${episode.episode_number}. ${episode.name}. ${score != null ? caption : pending ? 'Загрузка' : 'Нет оценки'}`}
    onClick={e => onOpen(e.currentTarget)} className="group rounded-lg border border-white/[0.07] bg-white/[0.035] px-2.5 py-2 text-left tabular-nums transition hover:border-violet-400/60 hover:bg-white/[0.08] focus-visible:outline-violet-400">
    <span className="block text-[10px] leading-tight text-neutral-400">Серия {episode.episode_number}</span>
    <strong className={`block text-xl leading-snug ${score == null ? 'text-neutral-500' : 'text-white'}`}>{caption}</strong>
    <span aria-hidden="true" className="mt-1 block h-[3px] overflow-hidden rounded-full bg-white/10">
      {score != null && <span className="block h-full rounded-full" style={{width: `${score*10}%`, background: shade(score).color}} />}
    </span>
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
    queryFn: () => imdbScore(`tv/${path}/episode/${episode.episode_number}`),
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
      await Promise.all([client.invalidateQueries({ queryKey: ['episode-votes', episode.id] }), client.invalidateQueries({ queryKey: ['episode-grid', Number(path.split('/')[0])] })]);
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
      <DialogContent className="w-[min(92vw,26rem)] rounded-2xl bg-neutral-900 text-center text-white">
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
