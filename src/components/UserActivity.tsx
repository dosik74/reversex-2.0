import { useState, useEffect } from "react";
import supabase from "@/utils/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MessageSquare, Heart } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Activity {
  id: string;
  type: 'rating' | 'comment' | 'favorite';
  movie_id: number;
  created_at: string;
  rating?: number;
  content?: string;
  title?: string;
  poster?: string;
}

interface UserActivityProps {
  userId: string;
  showOnlyWatched?: boolean;
}

const UserActivity = ({ userId, showOnlyWatched = false }: UserActivityProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [moviesData, setMoviesData] = useState<any[]>([]);

  useEffect(() => {
    loadMoviesData();
  }, []);

  useEffect(() => {
    if (moviesData.length > 0) {
      fetchActivities();
    }
  }, [userId, showOnlyWatched, moviesData]);

  const loadMoviesData = async () => {
    const response = await fetch('/data/movies.json');
    const data = await response.json();
    setMoviesData(data);
  };

  const fetchActivities = async () => {
    try {
      if (showOnlyWatched) {
        const { data: watchedMovies } = await supabase
          .from('user_movies')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('updated_at', { ascending: false });

        const enriched = (watchedMovies || []).map(m => {
          const movieData = moviesData.find(movie => movie.id === m.movie_id);
          return {
            id: m.id,
            type: 'rating' as const,
            movie_id: m.movie_id,
            created_at: m.updated_at,
            rating: m.rating,
            title: movieData?.title,
            poster: movieData?.poster,
          };
        });

        setActivities(enriched);
      } else {
        const [ratings, comments, favorites] = await Promise.all([
          supabase.from('user_movies').select('*').eq('user_id', userId).not('rating', 'is', null),
          supabase.from('comments').select('*').eq('user_id', userId),
          supabase.from('favorite_movies').select('*').eq('user_id', userId),
        ]);

        const combined: Activity[] = [
          ...(ratings.data || []).map(r => ({ 
            id: r.id, 
            type: 'rating' as const, 
            movie_id: r.movie_id, 
            created_at: r.created_at, 
            rating: r.rating,
            title: moviesData.find(m => m.id === r.movie_id)?.title,
            poster: moviesData.find(m => m.id === r.movie_id)?.poster,
          })),
          ...(comments.data || []).map(c => ({ 
            id: c.id, 
            type: 'comment' as const, 
            movie_id: c.movie_id, 
            created_at: c.created_at, 
            content: c.content,
            title: moviesData.find(m => m.id === c.movie_id)?.title,
            poster: moviesData.find(m => m.id === c.movie_id)?.poster,
          })),
          ...(favorites.data || []).map(f => ({ 
            id: f.id, 
            type: 'favorite' as const, 
            movie_id: f.movie_id, 
            created_at: f.created_at,
            title: moviesData.find(m => m.id === f.movie_id)?.title,
            poster: moviesData.find(m => m.id === f.movie_id)?.poster,
          })),
        ];

        combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setActivities(combined);
      }
    } catch (error) {
      toast.error('Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">
            {showOnlyWatched ? 'No watched movies yet' : 'No activity yet'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={showOnlyWatched ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" : "space-y-4"}>
      {showOnlyWatched ? (
        activities.map((activity) => (
          <Link key={activity.id} to={`/movie/${activity.movie_id}`}>
            <Card className="overflow-hidden hover-lift cursor-pointer group animate-scale-in">
              <div className="aspect-[2/3] relative overflow-hidden">
                {activity.poster && (
                  <img
                    src={activity.poster}
                    alt={activity.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/300x450/1a1a2e/ffffff?text=No+Image';
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  {activity.rating && (
                    <div className="flex items-center gap-1 text-yellow-400 mb-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-semibold">{activity.rating}/10</span>
                    </div>
                  )}
                  <h3 className="text-sm font-semibold text-white line-clamp-2">{activity.title}</h3>
                </div>
              </div>
            </Card>
          </Link>
        ))
      ) : (
        activities.map((activity) => (
          <Card key={activity.id} className="hover-lift animate-scale-in">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {activity.type === 'rating' && <Star className="w-5 h-5 text-yellow-400 mt-1" />}
                {activity.type === 'comment' && <MessageSquare className="w-5 h-5 text-blue-400 mt-1" />}
                {activity.type === 'favorite' && <Heart className="w-5 h-5 text-red-400 mt-1" />}
                
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </p>
                  {activity.type === 'rating' && (
                    <p>Rated {activity.title || `movie #${activity.movie_id}`}: {activity.rating}/10</p>
                  )}
                  {activity.type === 'comment' && (
                    <p className="line-clamp-2">{activity.content}</p>
                  )}
                  {activity.type === 'favorite' && (
                    <p>Added {activity.title || `movie #${activity.movie_id}`} to favorites</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default UserActivity;