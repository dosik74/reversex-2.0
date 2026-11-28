import type { ReactNode } from 'react';
import { Search } from 'lucide-react';

interface CatalogSearchProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder: string;
  children?: ReactNode;
}

export default function CatalogSearch({ value, onChange, placeholder, children }: CatalogSearchProps) {
  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-14 w-full rounded-full border border-amber-600/60 bg-amber-50 pl-14 pr-12 text-base font-medium text-zinc-900 shadow-sm placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/25 sm:h-16 sm:text-lg dark:border-amber-300/55 dark:bg-[#211e19] dark:text-white dark:placeholder:text-zinc-300 dark:focus:border-amber-300"
      />
      <Search aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-amber-700 dark:text-amber-300" />
      {children}
    </div>
  );
}
