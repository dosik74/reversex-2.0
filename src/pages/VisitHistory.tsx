import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Clock } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export const historyPath = '/activity/history';
type Visit = { path: string; title: string; time: number };
const sections: Record<string,string> = {
  '/':'Главная', '/movies':'Фильмы', '/explore-movies':'Каталог фильмов', '/series':'Сериалы',
  '/games':'Игры', '/bookmarks':'Закладки', '/friends':'Друзья', '/settings':'Настройки',
  '/music':'Музыка', '/books':'Книги', '/ws':'Watch', '/recommendations':'Рекомендации',
  '/tier-lists':'Тир-листы', '/admin':'Управление сайтом', '/tusau':'Тұсау',
};
const detailNames: Record<string,string> = { movie:'Фильм', series:'Сериал', game:'Игра',
  person:'Персона', company:'Компания', studio:'Студия', profile:'Профиль', id:'Профиль', ws:'Сериал', bookmarks:'Закладки' };

function readVisits(key:string): Visit[] {
  try {
    const rows:unknown = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(rows)) return [];
    return rows.filter(v => v && typeof v.path==='string' && /^\/(?!\/)/.test(v.path) && !v.path.includes('\\') &&
      typeof v.title==='string' && Number.isFinite(v.time)).slice(0,100);
  } catch { return []; }
}
function useHistoryKey() {
  const {user,loading} = useAppContext();
  return loading ? null : 'rx-visit-history:'+(user?.id ?? 'guest');
}

export function VisitTracker() {
  const {pathname} = useLocation();
  const key = useHistoryKey();
  useEffect(()=>{
    if (!key || pathname===historyPath || pathname==='/qr-scan') return;
    const time=Date.now();
    const parts=pathname.split('/').filter(Boolean);
    const fallback=sections[pathname] ?? [detailNames[parts[0]] ?? 'Профиль', parts.at(-1)].join(' · ');
    function write(rows:Visit[]) {
      try { localStorage.setItem(key!,JSON.stringify(rows)); } catch { /* Storage unavailable */ }
    }
    const old=readVisits(key);
    write([{path:pathname,title:sections[pathname] ?? old.find(v=>v.path===pathname)?.title ?? fallback,time},
      ...old.filter(v=>v.path!==pathname)].slice(0,100));
    if(sections[pathname]) return;
    const main=document.querySelector('main');
    if(!main) return;
    let previous='';
    function updateTitle() {
      const title=main?.querySelector('h1')?.textContent?.trim();
      if(!title || title===previous) return;
      previous=title;
      const rows=readVisits(key!);
      const entry=rows.find(v=>v.path===pathname && v.time===time);
      if(entry && entry.title!==title) {entry.title=title; write(rows);}
    }
    updateTitle();
    const observer=new MutationObserver(updateTitle);
    observer.observe(main,{childList:true,subtree:true,characterData:true});
    return ()=>observer.disconnect();
  },[key,pathname]);
  return null;
}

export default function VisitHistory() {
  const key=useHistoryKey();
  const [,refresh]=useState(0);
  useEffect(()=>{
    const update=(e:StorageEvent)=>{if(!e.key || e.key===key) refresh(n=>n+1);};
    window.addEventListener('storage',update);
    return ()=>window.removeEventListener('storage',update);
  },[key]);
  const visits=key ? readVisits(key) : [];
  return <section className="mx-auto max-w-3xl px-4 py-8">
    <h1 className="mb-6 text-3xl font-bold">История посещений</h1>
    {!key ? <p role="status">Загрузка…</p> : visits.length===0 ? <p>Здесь появятся страницы, которые вы открывали в этом браузере.</p> :
      <ol className="divide-y divide-border rounded-2xl border bg-card">{visits.map((v,i)=>
        <li key={v.path}><Link to={v.path} className="flex items-center gap-4 rounded-xl p-4 hover:bg-muted focus-visible:bg-muted">
          <Clock className="size-5 shrink-0 text-muted-foreground"/>
          <div className="min-w-0 flex-1">{i===0 && <p className="text-xs text-muted-foreground">Последнее посещение</p>}
            <p className="break-words font-semibold">{v.title}</p>
            <time className="text-sm text-muted-foreground" dateTime={new Date(v.time).toISOString()}>{new Date(v.time).toLocaleString('ru-RU',{dateStyle:'medium',timeStyle:'short'})}</time>
          </div><ChevronRight className="size-4"/>
        </Link></li>)}</ol>}
  </section>;
}
