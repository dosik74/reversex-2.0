import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getStudioDetails,
  getStudioGames,
  type StudioType,
  type RawgStudio,
  type RawgGameShort,
} from "@/utils/rawgApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BackButton from "@/components/BackButton";
import { Star, Gamepad2, Building2 } from "lucide-react";

const TYPE_RU: Record<StudioType, string> = {
  developer: 'Разработчик',
  publisher: 'Издатель',
};

const StudioPage = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const studioType: StudioType = type === 'publisher' ? 'publisher' : 'developer';
  const [studio, setStudio] = useState<RawgStudio | null>(null);
  const [games, setGames] = useState<RawgGameShort[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setPage(1);
        const [details, list] = await Promise.all([
          getStudioDetails(studioType, id),
          getStudioGames(studioType, id, 1),
        ]);
        setStudio(details);
        setGames(list.games);
        setHasMore(list.hasMore);
      } catch (err) {
        console.error('Error fetching studio:', err);
        setError('Не удалось загрузить страницу');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type, id]);

  const loadMore = async () => {
    if (!id || loadingMore) return;
    try {
      setLoadingMore(true);
      const next = page + 1;
      const list = await getStudioGames(studioType, id, next);
      setGames((prev) => [...prev, ...list.games]);
      setPage(next);
      setHasMore(list.hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
          <p className="mt-4 text-muted-foreground">Загружаем...</p>
        </div>
      </div>
    );
  }

  if (error || !studio) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error || 'Не найдено'}</p>
            <BackButton fallback="/games" label="Назад к играм" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-ui">
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        {studio.image_background && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${studio.image_background})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="container mx-auto px-4 py-8 relative">
          <div className="mb-6 inline-block">
            <BackButton fallback="/games" label="Назад к играм" />
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold bg-amber-300/10 text-amber-200 border border-amber-200/20 rounded-full px-3 py-1 mb-3">
            <Building2 className="w-3.5 h-3.5" />
            {TYPE_RU[studioType]}
          </span>
          <h1 className="font-grotesk text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3">
            {studio.name}
          </h1>
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Gamepad2 className="w-4 h-4" />
            {studio.games_count} игр в каталоге
          </p>
          {studio.description && (
            <div
              className="mt-4 text-muted-foreground leading-relaxed max-w-3xl line-clamp-4 prose dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: studio.description }}
            />
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Игры {studioType === 'developer' ? 'студии' : 'издателя'}</CardTitle>
          </CardHeader>
          <CardContent>
            {games.length === 0 ? (
              <p className="text-muted-foreground text-sm">Игры не найдены</p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {games.map((g) => (
                    <Link key={g.id} to={`/game/${g.id}`} className="group">
                      <div className="relative overflow-hidden rounded-lg mb-2 aspect-[16/10] bg-muted">
                        <img
                          src={g.background_image || 'https://placehold.co/640x400/1a1a2e/ffffff?text=No+Image'}
                          alt={g.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {g.rating > 0 && (
                          <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {Number(g.rating).toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{(g.released || '').split('-')[0]}</p>
                    </Link>
                  ))}
                </div>
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                      {loadingMore ? 'Загружаем...' : 'Показать ещё'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudioPage;
