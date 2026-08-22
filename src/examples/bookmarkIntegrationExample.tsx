import AddToBookmarksButton from '@/components/AddToBookmarksButton';

// Пример использования на странице Movies:

export const MovieCard = ({ movie }: any) => {
  return (
    <div className="bg-card rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {/* Постер */}
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        <img
          src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
          alt={movie.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
        />
        
        {/* Кнопка добавления в закладки */}
        <div className="absolute top-2 right-2">
          <AddToBookmarksButton
            contentId={movie.id.toString()}
            contentType="movie"
            title={movie.title}
            posterUrl={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
            externalRating={movie.vote_average}
            releaseYear={movie.release_date?.split('-')[0]}
            genre={movie.genres?.[0]?.name}
          />
        </div>
      </div>

      {/* Информация */}
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2 mb-2">{movie.title}</h3>
        <p className="text-sm text-muted-foreground">{movie.release_date}</p>
      </div>
    </div>
  );
};

// Пример для Series:
export const SeriesCard = ({ series }: any) => {
  return (
    <div className="bg-card rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {/* Постер */}
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        <img
          src={`https://image.tmdb.org/t/p/w300${series.poster_path}`}
          alt={series.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
        />
        
        {/* Кнопка добавления в закладки */}
        <div className="absolute top-2 right-2">
          <AddToBookmarksButton
            contentId={series.id.toString()}
            contentType="series"
            title={series.name}
            posterUrl={`https://image.tmdb.org/t/p/w300${series.poster_path}`}
            externalRating={series.vote_average}
            releaseYear={series.first_air_date?.split('-')[0]}
            totalItems={series.number_of_seasons}
            genre={series.genres?.[0]?.name}
          />
        </div>
      </div>

      {/* Информация */}
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2 mb-2">{series.name}</h3>
        <p className="text-sm text-muted-foreground">
          {series.number_of_seasons} сезон{series.number_of_seasons !== 1 ? 'ов' : ''}
        </p>
      </div>
    </div>
  );
};

// Пример для Games:
export const GameCard = ({ game }: any) => {
  return (
    <div className="bg-card rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {/* Постер/Обложка */}
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        <img
          src={game.background_image}
          alt={game.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
        />
        
        {/* Кнопка добавления в закладки */}
        <div className="absolute top-2 right-2">
          <AddToBookmarksButton
            contentId={game.id.toString()}
            contentType="game"
            title={game.name}
            posterUrl={game.background_image}
            externalRating={game.rating}
            releaseYear={game.released?.split('-')[0]}
            genre={game.genres?.[0]?.name}
          />
        </div>
      </div>

      {/* Информация */}
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2 mb-2">{game.name}</h3>
        <p className="text-sm text-muted-foreground">
          ⭐ {game.rating}/5
        </p>
      </div>
    </div>
  );
};
