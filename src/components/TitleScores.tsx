import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabase';
import { TMDB_API_KEY, TMDB_BASE_URL } from '@/utils/tmdbApi';

export async function imdbScore(path: string) {
  const ids = await fetch(`${TMDB_BASE_URL}/${path}/external_ids?api_key=${TMDB_API_KEY}`);
  if (!ids.ok) throw new Error('TMDB unavailable');
  const { imdb_id } = await ids.json();
  if (!imdb_id) return null;
  const response = await fetch(`/api/episode-rating?id=${encodeURIComponent(imdb_id)}`);
  if (!response.ok) throw new Error('IMDb unavailable');
  const { rating } = await response.json() as { rating: number | null };
  return { id: String(imdb_id), rating };
}

export function TitleScores({ id, type, mine }: { id: string; type: string; mine?: number }) {
  const site = useQuery({
    queryKey: ['title-average', type, id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('title_vote_average', { target_type: type, target_id: id });
      if (error) throw error;
      return data as number | null;
    },
  });
  const imdb = useQuery({
    queryKey: ['title-imdb', type, id],
    queryFn: () => imdbScore(`${type === 'movie' ? 'movie' : 'tv'}/${id}`),
    staleTime: 3600000,
  });
  return <span className="flex gap-3 text-left tabular-nums">
    {([['IMDb', imdb.data?.rating, imdb], ['Сайт', site.data, site], ['Вы', mine || null, null]] as const).map(([label, score, query]) =>
      <span key={label} className="flex flex-col leading-tight" title={query?.isError ? 'Источник временно недоступен' : label}>
        <span className="text-[10px] uppercase tracking-wide opacity-70">{label}</span>
        <strong className="text-base">{score != null ? score.toFixed(1) : query?.isLoading ? '…' : '—'}</strong>
      </span>)}
  </span>;
}
