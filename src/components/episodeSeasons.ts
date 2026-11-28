import { TMDB_API_KEY, TMDB_BASE_URL } from '@/utils/tmdbApi';

export type Entry = {
  id:number; season_number:number; episode_number:number; name:string; overview:string;
  still_path:string|null; air_date?:string; runtime?:number; originalPath?:string;
};
export type Season = {season_number:number; episode_count:number; episodes?:Entry[]};
type Group = {name:string; episodes:Entry[]};

async function tmdb<T>(path:string):Promise<T> {
  const response=await fetch(`${TMDB_BASE_URL}/tv/${path}?api_key=${TMDB_API_KEY}&language=ru-RU`);
  if(!response.ok) throw new Error('TMDB unavailable');
  return response.json();
}

export function splitSeason(groups:Group[], season:Season):Season[] | null {
  const split:Season[]=[];
  for(const group of groups) {
    if(group.episodes.every(ep=>ep.season_number===0)) continue;
    const label=group.name.trim().match(/^(?:season|сезон)\s+(\d+)$/i);
    if(!label || group.episodes.some(ep=>ep.season_number!==season.season_number)) return null;
    const number=Number(label[1]);
    const episodes=[...group.episodes].sort((a,b)=>a.episode_number-b.episode_number).map((ep,i)=>({
      ...ep, originalPath:'season/'+ep.season_number+'/episode/'+ep.episode_number,
      episode_number:i+1,season_number:number,
    }));
    split.push({season_number:number,episode_count:episodes.length,episodes});
  }
  split.sort((a,b)=>a.season_number-b.season_number);
  const all=split.flatMap(s=>s.episodes!);
  if(split.length<2 || split.some((s,i)=>s.season_number!==i+1) || all.length!==season.episode_count ||
     new Set(all.map(ep=>ep.id)).size!==all.length ||
     all.some((ep,i)=>ep.originalPath!=='season/'+season.season_number+'/episode/'+(i+1))) return null;
  return split;
}

export async function loadSeasons(seriesId:number, grouped:boolean):Promise<Season[]> {
  const show=await tmdb<{seasons:Season[]}>(String(seriesId));
  const seasons=show.seasons.filter(s=>s.episode_count>0).sort((a,b)=>(a.season_number || Infinity)-(b.season_number || Infinity));
  const regular=seasons.filter(s=>s.season_number>0);
  if(!grouped || regular.length!==1) return seasons;
  const groups=await tmdb<{results:{id:string;name:string}[]}>(seriesId+'/episode_groups');
  for(const candidate of groups.results.filter(g=>/^(seasons|сезоны)$/i.test(g.name.trim()))) {
    const details=await tmdb<{groups:Group[]}>('episode_group/'+candidate.id);
    const split=splitSeason(details.groups,regular[0]);
    if(split) return [...split,...seasons.filter(s=>s.season_number===0)];
  }
  return seasons;
}

export function seasonQuery(seriesId:number, season:Season) {
  const path=seriesId+'/season/'+season.season_number;
  return {
    queryKey:season.episodes ? ['episode-list-grouped',path,season.episodes[0].id,season.episodes.at(-1)?.id] : ['episode-list',path],
    queryFn:async()=>season.episodes ?? (await tmdb<{episodes:Entry[]}>(path)).episodes,
    staleTime:3600000,
  };
}

export function imdbEpisodePath(seriesId:number, ep:Entry) {
  return 'tv/'+seriesId+'/'+(ep.originalPath ?? 'season/'+ep.season_number+'/episode/'+ep.episode_number);
}
