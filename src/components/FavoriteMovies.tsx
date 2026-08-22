import { useState, useEffect } from "react";
import supabase from "@/utils/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Star, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FavoriteMovie {
  id: string;
  movie_id: number;
  rank: number;
  title?: string;
  poster_path?: string;
  release_date?: string;
}

interface FavoriteMoviesProps {
  userId: string;
  isOwnProfile: boolean;
}

const SortableMovie = ({ movie, onRemove }: { movie: FavoriteMovie; onRemove: () => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: movie.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-card rounded-lg border hover:border-primary transition-colors"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      
      <span className="text-2xl font-bold text-muted-foreground w-8">{movie.rank}</span>
      
      {movie.poster_path && (
        <img
          src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
          alt={movie.title}
          className="w-12 h-18 object-cover rounded"
        />
      )}
      
      <div className="flex-1">
        <h3 className="font-semibold">{movie.title}</h3>
        {movie.release_date && (
          <p className="text-sm text-muted-foreground">
            {new Date(movie.release_date).getFullYear()}
          </p>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

const FavoriteMovies = ({ userId, isOwnProfile }: FavoriteMoviesProps) => {
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [moviesData, setMoviesData] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchFavorites();
    loadMoviesData();
  }, [userId]);

  const loadMoviesData = async () => {
    const response = await fetch('/data/movies.json');
    const data = await response.json();
    setMoviesData(data);
  };

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorite_movies')
        .select('*')
        .eq('user_id', userId)
        .order('rank');

      if (error) throw error;

      setFavorites(data || []);
    } catch (error) {
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = favorites.findIndex((item) => item.id === active.id);
      const newIndex = favorites.findIndex((item) => item.id === over.id);

      const newFavorites = arrayMove(favorites, oldIndex, newIndex).map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

      setFavorites(newFavorites);

      // Update ranks in database
      try {
        for (const fav of newFavorites) {
          await supabase
            .from('favorite_movies')
            .update({ rank: fav.rank })
            .eq('id', fav.id);
        }
        toast.success('Rankings updated');
      } catch (error) {
        toast.error('Failed to update rankings');
        fetchFavorites(); // Revert on error
      }
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('favorite_movies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Removed from favorites');
      fetchFavorites();
    } catch (error) {
      toast.error('Failed to remove favorite');
    }
  };

  const enrichedFavorites = favorites.map(fav => {
    const movieData = moviesData.find(m => m.id === fav.movie_id);
    return {
      ...fav,
      title: movieData?.title || 'Unknown',
      poster_path: movieData?.poster_path,
      release_date: movieData?.release_date,
    };
  });

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (enrichedFavorites.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {isOwnProfile ? 'No favorite movies yet. Add some from movie pages!' : 'No favorites to display'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Star className="w-6 h-6 text-primary" />
          Top {enrichedFavorites.length} Movies
        </h2>
        {isOwnProfile && enrichedFavorites.length < 50 && (
          <p className="text-sm text-muted-foreground">
            {50 - enrichedFavorites.length} more slots available
          </p>
        )}
      </div>

      {isOwnProfile ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={enrichedFavorites.map(f => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {enrichedFavorites.map((movie) => (
                <SortableMovie
                  key={movie.id}
                  movie={movie}
                  onRemove={() => handleRemove(movie.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-2">
          {enrichedFavorites.map((movie) => (
            <div
              key={movie.id}
              className="flex items-center gap-4 p-4 bg-card rounded-lg border"
            >
              <span className="text-2xl font-bold text-muted-foreground w-8">{movie.rank}</span>
              {movie.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                  alt={movie.title}
                  className="w-12 h-18 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">{movie.title}</h3>
                {movie.release_date && (
                  <p className="text-sm text-muted-foreground">
                    {new Date(movie.release_date).getFullYear()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoriteMovies;
