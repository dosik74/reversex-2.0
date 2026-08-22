import { useState, useEffect } from "react";
import supabase from "@/utils/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, Tv, Gamepad2, Music, Book } from "lucide-react";

interface ProfileStatsProps {
  userId: string;
}

interface CategoryStats {
  movies: number;
  series: number;
  games: number;
  music: number;
  books: number;
}

const ProfileStats = ({ userId }: ProfileStatsProps) => {
  const [stats, setStats] = useState<CategoryStats>({
    movies: 0,
    series: 0,
    games: 0,
    music: 0,
    books: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      const [moviesRes, seriesRes, gamesRes, musicRes, booksRes] = await Promise.all([
        supabase.from('user_movies').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('user_series').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('user_games').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('user_music').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('user_books').select('id', { count: 'exact' }).eq('user_id', userId),
      ]);

      setStats({
        movies: moviesRes.count || 0,
        series: seriesRes.count || 0,
        games: gamesRes.count || 0,
        music: musicRes.count || 0,
        books: booksRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalItems = Object.values(stats).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <Card className="card-glow">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  if (totalItems === 0) {
    return (
      <Card className="card-glow">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">Пока нет статистики</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle>📊 Статистика контента</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-red-500" />
              <span className="font-medium">Фильмы</span>
            </div>
            <span className="font-bold text-lg">{stats.movies}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Сериалы</span>
            </div>
            <span className="font-bold text-lg">{stats.series}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-green-500" />
              <span className="font-medium">Игры</span>
            </div>
            <span className="font-bold text-lg">{stats.games}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-amber-500" />
              <span className="font-medium">Музыка</span>
            </div>
            <span className="font-bold text-lg">{stats.music}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-2">
              <Book className="w-5 h-5 text-purple-500" />
              <span className="font-medium">Книги</span>
            </div>
            <span className="font-bold text-lg">{stats.books}</span>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="text-center">
              <span className="text-2xl font-bold">{totalItems}</span>
              <p className="text-sm text-muted-foreground">Всего элементов</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileStats;