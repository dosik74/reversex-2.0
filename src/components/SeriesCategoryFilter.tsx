import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import { CONTENT_STATUS_CONFIG, ContentStatus } from '@/types/anime';

interface CategoryStats {
  watched: number;
  watching: number;
  planned: number;
  postponed: number;
  dropped: number;
}

export default function SeriesCategoryFilter({
  selectedCategory,
  onCategoryChange,
}: {
  selectedCategory: ContentStatus | 'all';
  onCategoryChange: (category: ContentStatus | 'all') => void;
}) {
  const [stats, setStats] = useState<CategoryStats>({
    watched: 0,
    watching: 0,
    planned: 0,
    postponed: 0,
    dropped: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('content_bookmarks')
        .select('status')
        .eq('user_id', user.user.id)
        .eq('content_type', 'series');

      if (error) throw error;

      const newStats: CategoryStats = {
        watched: 0,
        watching: 0,
        planned: 0,
        postponed: 0,
        dropped: 0,
      };

      (data || []).forEach((item: any) => {
        if (item.status in newStats) {
          newStats[item.status as keyof CategoryStats]++;
        }
      });

      setStats(newStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories: (ContentStatus | 'all')[] = ['all', 'watched', 'watching', 'planned', 'postponed', 'dropped'];

  return (
    <div className="flex flex-nowrap gap-2 mb-6 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
      {categories.map((category) => {
        const isAll = category === 'all';
        const count = isAll ? 0 : stats[category as keyof CategoryStats];
        const config = isAll ? null : CONTENT_STATUS_CONFIG[category as ContentStatus];

        return (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap shrink-0 transition-all border border-transparent ${
              selectedCategory === category
                ? `${config?.bgColor || 'bg-purple-500'} ${config?.color || 'text-purple-500'} text-white`
                : 'bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground dark:bg-zinc-800 dark:text-zinc-400 dark:border-transparent dark:hover:bg-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            {isAll ? (
              'Все'
            ) : (
              <>
                {config?.label}
                {count > 0 && <span className="ml-2 text-xs">({count})</span>}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
