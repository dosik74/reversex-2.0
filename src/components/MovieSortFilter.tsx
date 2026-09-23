import { ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';

export type SortOption = 'popularity' | 'rating' | 'title' | 'year';
export type GenreFilter = 'all' | string;

/** Chip id → TMDB genre ids per content type (for real filtering) */
export const GENRE_TMDB_IDS: Record<string, { movie: number[]; tv: number[] }> = {
  action:    { movie: [28],           tv: [10759] },
  comedy:    { movie: [35],           tv: [35] },
  drama:     { movie: [18],           tv: [18] },
  horror:    { movie: [27],           tv: [9648] },
  'sci-fi':  { movie: [878],          tv: [10765, 878] },
  romance:   { movie: [10749],        tv: [10749] },
  thriller:  { movie: [53],           tv: [53] },
  animation: { movie: [16],           tv: [16] },
};

export const SORTS: { id: SortOption; label: string }[] = [
  { id: 'popularity', label: 'По популярности' },
  { id: 'rating', label: 'По рейтингу' },
  { id: 'year', label: 'По году' },
  { id: 'title', label: 'По названию' },
];

export const GENRES = [
  { id: 'all', name: 'Все жанры' },
  { id: 'action', name: 'Экшн' },
  { id: 'comedy', name: 'Комедия' },
  { id: 'drama', name: 'Драма' },
  { id: 'horror', name: 'Ужасы' },
  { id: 'sci-fi', name: 'Фантастика' },
  { id: 'romance', name: 'Романтика' },
  { id: 'thriller', name: 'Триллер' },
  { id: 'animation', name: 'Мультфильмы' },
];

export const GENRE_LIST = GENRES.filter((g) => g.id !== 'all');

export default function MovieSortFilter({
  sortBy,
  onSortChange,
  genre,
  onGenreChange,
  showGenres = true,
}: {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  genre: GenreFilter;
  onGenreChange: (genre: GenreFilter) => void;
  showGenres?: boolean;
}) {
  return (
    <div className="space-y-3">
      {/* Sort chips */}
      <div className="flex items-center gap-2 flex-nowrap overflow-x-auto no-scrollbar pb-0.5 -mx-1 px-1">
        {SORTS.map((s) => (
          <button
            key={s.id}
            onClick={() => onSortChange(s.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all duration-200 border ${
              sortBy === s.id
                ? 'bg-foreground text-background font-semibold border-transparent dark:bg-white dark:text-black'
                : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted hover:text-foreground dark:bg-white/[0.05] dark:text-zinc-400 dark:border-white/[0.06] dark:hover:bg-white/[0.1] dark:hover:text-white'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Genre chips */}
      {showGenres && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 -mx-1 px-1">
          {GENRES.map((g) => {
            const active = genre === g.id;
            return (
              <button
                key={g.id}
                onClick={() => onGenreChange(g.id)}
                className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-200 border ${
                  active
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black/90 border-transparent shadow-md shadow-orange-500/25'
                    : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted hover:text-foreground dark:bg-white/[0.05] dark:text-zinc-400 dark:border-white/[0.06] dark:hover:bg-white/[0.1] dark:hover:text-white'
                }`}
              >
                {g.name}
                {!active && <ChevronRight className="w-3 h-3 opacity-40" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function KpSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="mb-8">
      {title && (
        <h2 className="font-grotesk text-xl font-bold text-foreground dark:text-white mb-4">{title}</h2>
      )}
      {children}
    </div>
  );
}
