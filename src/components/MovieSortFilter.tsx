import { ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type SortOption = 'popularity' | 'rating' | 'title' | 'year';
export type GenreFilter = 'all' | string;

export default function MovieSortFilter({
  sortBy,
  onSortChange,
  genre,
  onGenreChange,
}: {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  genre: GenreFilter;
  onGenreChange: (genre: GenreFilter) => void;
}) {
  const genres = [
    { id: 'all', name: 'Все жанры' },
    { id: 'action', name: 'Экшн' },
    { id: 'comedy', name: 'Комедия' },
    { id: 'drama', name: 'Драма' },
    { id: 'horror', name: 'Ужас' },
    { id: 'sci-fi', name: 'Научная фантастика' },
    { id: 'romance', name: 'Романтика' },
    { id: 'thriller', name: 'Триллер' },
    { id: 'animation', name: 'Мультипликация' },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <label className="block text-sm font-medium text-zinc-400 mb-2">Сортировка</label>
        <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="popularity">По популярности</SelectItem>
            <SelectItem value="rating">По рейтингу</SelectItem>
            <SelectItem value="title">По названию</SelectItem>
            <SelectItem value="year">По году</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <label className="block text-sm font-medium text-zinc-400 mb-2">Жанр</label>
        <Select value={genre} onValueChange={(value) => onGenreChange(value as GenreFilter)}>
          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            {genres.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
