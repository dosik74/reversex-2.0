import { useState, useEffect } from "react";
import supabase from "@/utils/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Calendar, Clock, Film, Tv, Trash2, Edit, X } from "lucide-react";
import { toast } from "sonner";

interface WatchedItem {
  id: string;
  movie_id?: number;
  series_id?: number;
  status: string;
  rating: number;
  created_at: string;
  title: string;
  poster_path: string;
  release_date: string;
  runtime?: number;
  type: "movie" | "series";
}

interface WatchedInteractiveProps {
  userId: string;
}

const WatchedInteractive = ({ userId }: WatchedInteractiveProps) => {
  const [movies, setMovies] = useState<WatchedItem[]>([]);
  const [series, setSeries] = useState<WatchedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WatchedItem | null>(null);
  const [editingRating, setEditingRating] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchWatched();
    }
  }, [userId]);

  const getCurrentUser = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId((data as any)?.user?.id || null);
    } catch (e) {
      setCurrentUserId(null);
    }
  };

  const fetchWatched = async () => {
    try {
      setLoading(true);
      const [moviesRes, seriesRes] = await Promise.all([
        supabase
          .from("user_movies")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("user_series")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      setMovies(
        moviesRes.data?.map((m: any) => ({
          ...m,
          type: "movie",
          title: m.title,
          poster_path: m.poster_path,
          release_date: m.release_date,
          runtime: m.runtime,
        })) || []
      );

      setSeries(
        seriesRes.data?.map((s: any) => ({
          ...s,
          type: "series",
          title: s.title,
          poster_path: s.poster_path,
          release_date: s.release_date,
        })) || []
      );
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: WatchedItem) => {
    if (currentUserId !== userId) {
      toast.error("Вы не можете удалять чужие записи");
      return;
    }

    try {
      const table = item.type === "movie" ? "user_movies" : "user_series";
      const { error } = await supabase.from(table).delete().eq("id", item.id);

      if (error) throw error;

      toast.success("Удалено");
      fetchWatched();
      setSelectedItem(null);
    } catch (error) {
      console.error(error);
      toast.error("Ошибка удаления");
    }
  };

  const handleUpdateRating = async (item: WatchedItem, newRating: number) => {
    if (currentUserId !== userId) {
      toast.error("Вы не можете редактировать чужие записи");
      return;
    }

    try {
      const table = item.type === "movie" ? "user_movies" : "user_series";
      const { error } = await supabase
        .from(table)
        .update({ rating: newRating })
        .eq("id", item.id);

      if (error) throw error;

      toast.success("Оценка обновлена");
      fetchWatched();
      setEditingRating(null);
      if (selectedItem) {
        setSelectedItem({ ...selectedItem, rating: newRating });
      }
    } catch (error) {
      console.error(error);
      toast.error("Ошибка обновления");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "watched":
        return "bg-green-500/20 text-green-400";
      case "watching":
        return "bg-blue-500/20 text-blue-400";
      case "planned":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "watched":
        return "✅ Просмотрено";
      case "watching":
        return "▶️ Смотрю";
      case "planned":
        return "📋 В планах";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card className="card-glow">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  const isOwnProfile = currentUserId === userId;

  const renderItems = (items: WatchedItem[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="cursor-pointer group"
          onClick={() => setSelectedItem(item)}
        >
          <div className="relative mb-3 overflow-hidden rounded-lg bg-secondary/30 aspect-[2/3] group-hover:ring-2 ring-primary transition-all">
            {item.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {item.type === "movie" ? (
                  <Film className="w-12 h-12 text-muted-foreground" />
                ) : (
                  <Tv className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
            )}
            {item.rating > 0 && (
              <div className="absolute top-2 right-2 bg-black/80 rounded-full p-2 flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-bold">{item.rating}</span>
              </div>
            )}
          </div>
          <p className="text-sm font-medium line-clamp-2">{item.title}</p>
          <Badge className={`mt-2 ${getStatusColor(item.status)}`}>
            {getStatusText(item.status)}
          </Badge>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Tabs defaultValue="movies" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="movies">
            <Film className="w-4 h-4 mr-2" />
            Фильмы ({movies.length})
          </TabsTrigger>
          <TabsTrigger value="series">
            <Tv className="w-4 h-4 mr-2" />
            Сериалы ({series.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="movies" className="mt-6">
          {movies.length === 0 ? (
            <Card className="card-glow">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Фильмы еще не добавлены
                </p>
              </CardContent>
            </Card>
          ) : (
            renderItems(movies)
          )}
        </TabsContent>

        <TabsContent value="series" className="mt-6">
          {series.length === 0 ? (
            <Card className="card-glow">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Сериалы еще не добавлены
                </p>
              </CardContent>
            </Card>
          ) : (
            renderItems(series)
          )}
        </TabsContent>
      </Tabs>

      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setSelectedItem(null);
            setEditingRating(null);
          }}
        >
          <Card
            className="card-glow max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="pt-6">
              <div className="flex gap-6">
                {selectedItem.poster_path && (
                  <div className="flex-shrink-0 w-40">
                    <img
                      src={`https://image.tmdb.org/t/p/w500${selectedItem.poster_path}`}
                      alt={selectedItem.title}
                      className="w-full rounded-lg"
                    />
                  </div>
                )}

                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{selectedItem.title}</h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(selectedItem.status)}>
                        {getStatusText(selectedItem.status)}
                      </Badge>
                    </div>

                    {selectedItem.rating > 0 && (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {editingRating === selectedItem.rating ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              defaultValue={selectedItem.rating}
                              className="w-20 px-2 py-1 rounded bg-secondary text-foreground"
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (val >= 0 && val <= 10) {
                                  setEditingRating(val);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => editingRating !== null && handleUpdateRating(selectedItem, editingRating)}
                            >
                              Сохранить
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingRating(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              Оценка: {selectedItem.rating}/10
                            </span>
                            {isOwnProfile && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingRating(selectedItem.rating)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedItem.release_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(selectedItem.release_date)}</span>
                      </div>
                    )}

                    {selectedItem.runtime && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{selectedItem.runtime} минут</span>
                      </div>
                    )}

                    {selectedItem.created_at && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-sm">
                          Добавлено: {formatDate(selectedItem.created_at)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedItem(null);
                        setEditingRating(null);
                      }}
                      className="flex-1 px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors"
                    >
                      Закрыть
                    </button>
                    {isOwnProfile && (
                      <button
                        onClick={() => handleDelete(selectedItem)}
                        className="px-4 py-2 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export { WatchedInteractive };
export default WatchedInteractive;