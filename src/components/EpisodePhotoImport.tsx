import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImagePlus } from 'lucide-react';
import supabase from '@/lib/supabase';
import type { PhotoVote } from './seriesGraphImage';

type Season = {season_number:number; episode_count:number};
type Episode = {episode_number:number; id:number};
type Draft = PhotoVote & {include:boolean};
type Props = {
  seriesId:number; title:string; seasons:Season[]; userId?:string;
  loadSeason:(number:number)=>Promise<Episode[]>; onSaved:(count:number)=>void;
};

export function photoDestination(number:number, season:number|null, absolute:boolean, seasons:Season[]) {
  if (!Number.isSafeInteger(number) || number<1) return null;
  if (absolute) {
    for (const item of seasons) {
      if (!item.season_number) continue;
      if (number<=item.episode_count) return {season:item.season_number, episode:number};
      number-=item.episode_count;
    }
    return null;
  }
  const item=seasons.find(s=>s.season_number===season);
  return item && number<=item.episode_count ? {season:item.season_number,episode:number} : null;
}

export default function EpisodePhotoImport({seriesId,title,seasons,userId,loadSeason,onSaved}:Props) {
  const client=useQueryClient();
  const [open,setOpen]=useState(false);
  const [rows,setRows]=useState<Draft[]>([]);
  const [absolute,setAbsolute]=useState(false);
  const [fallback,setFallback]=useState('');
  const [other,setOther]=useState<number|null>(null);
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');
  const [preview,setPreview]=useState('');
  const regular=seasons.filter(s=>s.season_number>0);
  const mapped=rows.map(row=>photoDestination(Number(row.episode),row.season ?? (fallback ? Number(fallback) : null),absolute,seasons));
  const selected=rows.map((row,i)=>row.include ? i : -1).filter(i=>i>=0);
  const destinations=selected.map(i=>mapped[i]?.season+'/'+mapped[i]?.episode);
  const invalid=selected.some(i=>!mapped[i] || !/^\d{1,2}([.,]\d)?$/.test(rows[i].score) ||
    Number(rows[i].score.replace(',','.'))<1 || Number(rows[i].score.replace(',','.'))>10);
  const duplicates=new Set(destinations).size!==destinations.length;
  function edit(i:number,patch:Partial<Draft>) {
    setRows(previous=>previous.map((row,j)=>j===i ? {...row,...patch} : row));
  }
  function reset() {
    if(preview) URL.revokeObjectURL(preview);
    setPreview(''); setRows([]); setOther(null); setError(''); setFallback('');
  }
  async function read(file:File) {
    reset(); setBusy('Открываем скриншот…');
    try {
      setPreview(URL.createObjectURL(file));
      const {readSeriesGraph}=await import('./seriesGraphImage');
      const result=await readSeriesGraph(file,setBusy);
      if(result.showId && result.showId!==seriesId) { setOther(result.showId); return; }
      const drafts=result.votes.map(row=>({...row,include:true}));
      const first=regular[0];
      const hasMultiPhotoSeasons=drafts.some(r=>r.season!==null && r.season>1);
      if (regular.length===1 && hasMultiPhotoSeasons && drafts.length<=first.episode_count) {
        setAbsolute(true);
        let seq=0;
        for (const d of drafts) { d.episode=String(++seq); d.season=first.season_number; }
      } else {
        setAbsolute(regular.length>1 && drafts.every(r=>r.season===null || r.season===1) &&
          drafts.some(r=>Number(r.episode)>first.episode_count));
      }
      if(regular.length===1) setFallback(String(first.season_number));
      setRows(drafts);
    } catch(err) { setError(err instanceof Error && err.message.startsWith('Не найдены') ? err.message : 'Не удалось прочитать изображение. Попробуйте PNG или JPEG с чёткими подписями.'); }
    finally { setBusy(''); }
  }
  async function save() {
    if (!userId || !selected.length || busy || invalid || duplicates) return;
    setBusy('Сохраняем оценки…'); setError('');
    try {
      const groups=new Map<number,Episode[]>();
      for(const number of new Set(selected.map(i=>mapped[i]!.season))) groups.set(number,await loadSeason(number));
      const votes=selected.map(i=>{
        const target=mapped[i]!;
        const ep=groups.get(target.season)?.find(item=>item.episode_number===target.episode);
        if(!ep) throw new Error('missing');
        return {episode_id:ep.id,user_id:userId,score:Math.round(Number(rows[i].score.replace(',','.'))*10)};
      });
      const result=await supabase.from('episode_votes').upsert(votes,{onConflict:'episode_id,user_id'});
      if(result.error) throw result.error;
      await Promise.all([client.invalidateQueries({queryKey:['episode-grid',seriesId]}),client.invalidateQueries({queryKey:['episode-votes']})]);
      onSaved(votes.length); setOpen(false); reset();
    } catch(err) { setError(err instanceof Error && err.message==='missing' ? 'Серия отсутствует в каталоге. Проверьте номера перед сохранением.' : 'Не удалось сохранить оценки. Проверьте подключение и повторите.'); }
    finally { setBusy(''); }
  }
  return <Dialog open={open} onOpenChange={value=>{if(!busy){setOpen(value); if(!value) reset();}}}>
    <DialogTrigger className="rx-tool"><ImagePlus size={16}/>Из фото</DialogTrigger>
    <DialogContent className="rx-photo max-h-[90dvh] overflow-y-auto bg-neutral-900 text-white sm:max-w-xl">
      <DialogTitle>Импорт из SeriesGraph</DialogTitle>
      <DialogDescription>Личные оценки для «{title}». Загрузите скриншот из SeriesGraph (таблица по сезонам или режим Wrapped) — сезоны, серии и баллы определятся автоматически.</DialogDescription>
      {!userId ? <Link className="underline" to="/auth">Войти для импорта</Link> : <>
        <input aria-label="Скриншот SeriesGraph" type="file" accept="image/png,image/jpeg,image/webp" disabled={!!busy || !seasons.length}
          onChange={e=>{const file=e.target.files?.[0]; e.target.value=''; if(file) void read(file);}}/>
        {preview && <details><summary>Исходный скриншот</summary><img src={preview} alt="Скриншот SeriesGraph для сверки" /></details>}
        {busy && <p role="status">{busy}</p>}
        {other && <p>На скриншоте другой сериал. <Link className="underline" to={'/series/'+other}>Открыть его страницу</Link></p>}
        {!!rows.length && <>
          <label>Нумерация <select value={absolute?'absolute':'season'} disabled={!!busy} onChange={e=>setAbsolute(e.target.value==='absolute')}>
            <option value="season">По сезонам на фото</option><option value="absolute">Сквозная, без спецвыпусков</option></select></label>
          {!absolute && rows.some(r=>r.season===null) && <label>Сезон для серий без заголовка <select value={fallback} onChange={e=>setFallback(e.target.value)}>
            <option value="">Выберите сезон</option>{seasons.map(s=><option key={s.season_number} value={s.season_number}>{s.season_number || 'Спецвыпуски'}</option>)}</select></label>}
          <p className="text-sm text-neutral-300">Проверьте соответствие серий. Выбранные баллы заменят ваши оценки этих эпизодов.</p>
          <div className="max-h-64 overflow-auto"><table className="w-full text-sm"><thead><tr><th>Вкл.</th><th>Серия на фото</th><th>На сайте</th><th>Балл</th></tr></thead>
          <tbody>{rows.map((r,i)=><tr key={i}><td><input aria-label={'Включить строку '+(i+1)} type="checkbox" checked={r.include} disabled={!!busy} onChange={e=>edit(i,{include:e.target.checked})}/></td>
            <td><input aria-label={'Номер серии, строка '+(i+1)} inputMode="numeric" value={r.episode} disabled={!!busy} onChange={e=>edit(i,{episode:e.target.value})}/></td>
            <td>{mapped[i] ? 'S'+mapped[i]!.season+' · E'+mapped[i]!.episode : 'Уточните номер'}</td>
            <td><input aria-label={'Оценка, строка '+(i+1)} inputMode="decimal" value={r.score} disabled={!!busy} onChange={e=>edit(i,{score:e.target.value})}/></td></tr>)}</tbody></table></div>
          {invalid && <p>Исправьте или снимите строки с пропущенным номером, сезоном или баллом.</p>}
          {duplicates && !invalid && <p>Несколько строк указывают на одну серию. Проверьте номера.</p>}
          <button disabled={!!busy || invalid || duplicates || !selected.length} className="rounded-lg bg-white px-4 py-2 font-semibold text-black disabled:opacity-40" onClick={save}>Сохранить оценки ({selected.length})</button>
        </>}
      </>}
      {error && <p role="alert">{error}</p>}
    </DialogContent>
  </Dialog>;
}
