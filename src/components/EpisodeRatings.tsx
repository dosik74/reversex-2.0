import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export default function EpisodeRatings({ seriesId }: { seriesId: number }) {
  const [selectedSeason, setSeason] = useState<number>();
  const [selectedEpisode, setEpisode] = useState<number>();
  const seasons = useQuery({
    queryKey: ['episode-seasons', seriesId],
    queryFn: async () => (await tmdb<{ seasons: Season[] }>(String(seriesId))).seasons.filter(s => s.episode_count > 0),
    staleTime: 3600000,
  });
  const season = selectedSeason ?? seasons.data?.find(s => s.season_number > 0)?.season_number ?? seasons.data?.[0]?.season_number;
  const path = `${seriesId}/season/${season}`;
  const episodes = useQuery({
    queryKey: ['episode-list', path],
    queryFn: async () => (await tmdb<{ episodes: Episode[] }>(path)).episodes,
    enabled: season !== undefined,
    staleTime: 3600000,
  });
  const episode = episodes.data?.find(e => e.id === selectedEpisode) ?? episodes.data?.[0];
  return <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#191919] p-5 text-white sm:p-7">
    <h2 className="mb-5 text-2xl font-bold">Оценки серий</h2>
    <div className="mb-5 flex flex-wrap gap-2">
      {seasons.data?.length > 0 && <select aria-label="Сезон" className="rounded-lg bg-neutral-800 p-2" value={season}
        onChange={e => { setSeason(Number(e.target.value)); setEpisode(undefined); }}>
        {seasons.data.map(s => <option key={s.season_number} value={s.season_number}>{s.season_number ? `Сезон ${s.season_number}` : 'Спецвыпуски'}</option>)}
      </select>}
      {episode && <select aria-label="Серия" className="min-w-0 max-w-full flex-1 rounded-lg bg-neutral-800 p-2" value={episode.id} onChange={e => setEpisode(Number(e.target.value))}>
        {episodes.data.map(e => <option key={e.id} value={e.id}>{e.episode_number}. {e.name}</option>)}
      </select>}
    </div>
    {episode ? <EpisodePanel key={episode.id} episode={episode} season={season} path={path} /> :
      <p role="status">{seasons.isError || episodes.isError ? 'Не удалось загрузить серии' : seasons.isLoading || episodes.isLoading ? 'Загружаем серии…' : 'Серии пока отсутствуют'}</p>}
  </section>;
}

function EpisodePanel({ episode, season, path }: { episode: Episode; season: number; path: string }) {
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
    queryFn: async () => {
      const { imdb_id } = await tmdb<{ imdb_id: string | null }>(`${path}/episode/${episode.episode_number}/external_ids`);
      if (!imdb_id) return null;
      const res = await fetch(`/api/episode-rating?id=${encodeURIComponent(imdb_id)}`);
      if (!res.ok) throw new Error('IMDb unavailable');
      const { rating } = await res.json() as { rating: number | null };
      return { id: imdb_id, rating };
    },
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
      await client.invalidateQueries({ queryKey: ['episode-votes', episode.id] });
      setOpen(false);
    },
  });
  const stats = votes.data;
  const numeric = Number(draft.replace(',', '.'));
  const valid = /^\d{1,2}([.,]\d)?$/.test(draft) && numeric >= 1 && numeric <= 10;
  return <>
    {episode.still_path && <img alt="" src={`https://image.tmdb.org/t/p/w780${episode.still_path}`} className="mb-4 max-h-64 w-full rounded-xl object-cover" />}
    <h3 className="text-xl font-bold">{episode.name}</h3>
    <p className="mb-4 text-sm text-neutral-400">Сезон {season} · Серия {episode.episode_number}</p>
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
    {episode.overview && <p className="mt-5 text-sm leading-relaxed text-neutral-300">{episode.overview}</p>}
  </>;
}
