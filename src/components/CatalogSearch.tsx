import { useId, useState, type ReactNode } from 'react';
import { ArrowRight, Image as ImageIcon, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export interface SearchPreview {
  items: { id: number; title: string; poster: string; year: string }[];
  error?: boolean;
}

interface CatalogSearchProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder: string;
  preview?: SearchPreview;
  resultPath: string;
  children?: ReactNode;
}

export default function CatalogSearch({ value, onChange, placeholder, preview, resultPath, children }: CatalogSearchProps) {
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const navigate = useNavigate();
  const open = focused && Boolean(value?.trim());
  const items = preview?.items ?? [];
  function showAll() {
    setFocused(false);
    const grid = document.getElementById('catalog-search-results');
    grid?.focus({preventScroll:true});
    grid?.scrollIntoView({block:'center'});
  }
  return (
    <div className="relative w-full" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
    }}>
      <div className="relative">
        <input
          type="text" role="combobox" autoComplete="off" aria-autocomplete="list"
          aria-expanded={open} aria-controls={open ? listId : undefined}
          aria-activedescendant={open && items[active] ? listId+'-'+active : undefined}
          value={value} placeholder={placeholder} aria-label={placeholder}
          onFocus={() => setFocused(true)} onClick={() => setFocused(true)}
          onChange={event => { setActive(-1); setFocused(true); onChange(event.target.value); }}
          onKeyDown={event => {
            if (event.key === 'Escape') { setFocused(false); setActive(-1); }
            if (items.length && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
              event.preventDefault(); setFocused(true);
              setActive(index => event.key === 'ArrowDown' ? (index+1)%items.length : index<=0 ? items.length-1 : index-1);
            }
            if (open && event.key === 'Enter' && items.length) {
              event.preventDefault();
              if (items[active]) navigate(resultPath+items[active].id);
              else showAll();
            }
          }}
          className="h-[4.5rem] w-full rounded-full border-2 border-amber-600/60 bg-amber-50 pl-16 pr-14 text-xl font-medium text-zinc-900 shadow-sm placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/25 sm:h-24 sm:pl-20 sm:text-2xl dark:border-amber-300/55 dark:bg-[#211e19] dark:text-white dark:placeholder:text-zinc-300 dark:focus:border-amber-300"
        />
        <Search aria-hidden="true" className="pointer-events-none absolute left-6 top-1/2 h-7 w-7 -translate-y-1/2 text-amber-700 sm:left-8 sm:h-8 sm:w-8 dark:text-amber-300" />
        {children}
      </div>
      {open && <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-lg">
        <div role="listbox" id={listId} aria-label="Результаты поиска">
          {items.map((item,index) => <Link key={item.id} role="option" aria-selected={active===index}
            id={listId+'-'+index} to={resultPath+item.id} onMouseEnter={()=>setActive(index)}
            className={'flex items-center gap-3 rounded-xl p-2 hover:bg-muted focus:bg-muted '+(index===active ? 'bg-muted' : '')}>
            {item.poster ? <img src={item.poster} alt="" className="h-14 w-11 shrink-0 rounded-md object-cover" /> :
              <ImageIcon className="h-14 w-11 shrink-0 p-2 text-muted-foreground" />}
            <span className="min-w-0"><span className="block truncate text-base font-semibold">{item.title}</span>
              {item.year && item.year!=='Unknown' && <span className="text-sm text-muted-foreground">{item.year}</span>}
            </span>
          </Link>)}
        </div>
        {!items.length && <p role="status" className="px-3 py-2 text-sm text-muted-foreground">
          {!preview ? 'Ищем…' : preview.error ? 'Не удалось загрузить результаты' : 'Ничего не найдено'}
        </p>}
        {!!items.length && <button type="button" onClick={showAll} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold hover:bg-muted">
          Все результаты <ArrowRight size={16}/>
        </button>}
      </div>}
    </div>
  );
}
