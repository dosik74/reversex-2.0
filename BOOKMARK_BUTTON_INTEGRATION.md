# 🔖 Добавление в Bookmarks - Интеграция

Полное руководство по добавлению кнопки "В закладки" на страницы фильмов, сериалов и игр.

## 📦 Компонент AddToBookmarksButton

**Расположение:** `src/components/AddToBookmarksButton.tsx`

### Использование:

```tsx
import AddToBookmarksButton from '@/components/AddToBookmarksButton';

<AddToBookmarksButton
  contentId="123"
  contentType="movie"
  title="Fight Club"
  posterUrl="https://..."
  externalRating={8.8}
  genre="Drama"
  releaseYear="1999"
  totalItems={1}
/>
```

### Props:

| Параметр | Тип | Описание |
|----------|-----|---------|
| `contentId` | string | Уникальный ID контента (TMDB ID или Game ID) |
| `contentType` | 'movie' \| 'series' \| 'game' | Тип контента |
| `title` | string | Название |
| `posterUrl` | string? | URL постера/обложки |
| `externalRating` | number? | Рейтинг (IMDb, TMDB, Metacritic) |
| `genre` | string? | Жанр |
| `releaseYear` | string? | Год выпуска |
| `totalItems` | number? | Количество эпизодов/сезонов |

## 🎬 Интеграция на страницы

### Movies страница

```tsx
import AddToBookmarksButton from '@/components/AddToBookmarksButton';

export default function Movies() {
  const [movies, setMovies] = useState([]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {movies.map(movie => (
        <div key={movie.id} className="relative group">
          <img 
            src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
            alt={movie.title}
            className="rounded-lg"
          />
          
          {/* Кнопка появляется при наведении */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <AddToBookmarksButton
              contentId={movie.id.toString()}
              contentType="movie"
              title={movie.title}
              posterUrl={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
              externalRating={movie.vote_average}
              releaseYear={movie.release_date?.split('-')[0]}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Series страница

```tsx
<AddToBookmarksButton
  contentId={series.id.toString()}
  contentType="series"
  title={series.name}
  posterUrl={`https://image.tmdb.org/t/p/w300${series.poster_path}`}
  externalRating={series.vote_average}
  releaseYear={series.first_air_date?.split('-')[0]}
  totalItems={series.number_of_seasons}
/>
```

### Games страница

```tsx
<AddToBookmarksButton
  contentId={game.id.toString()}
  contentType="game"
  title={game.name}
  posterUrl={game.background_image}
  externalRating={game.rating}
  releaseYear={game.released?.split('-')[0]}
/>
```

## 🎨 Стили кнопки

Кнопка автоматически меняет вид:
- **По умолчанию:** серая кнопка с иконкой закладки
- **При наведении:** highlight эффект
- **После добавления:** фиолетовая кнопка с галочкой (2 сек)
- **При загрузке:** disabled state

## 📋 Функциональность

1. ✅ **Выбор статуса** - дропдаун меню со всеми 6 статусами
2. ✅ **Авто-сохранение** - сразу добавляется в БД
3. ✅ **Уведомления** - toast с подтверждением
4. ✅ **Обработка ошибок** - требует входа, показывает сообщения об ошибках
5. ✅ **Visual feedback** - кнопка меняет цвет при добавлении

## 🔧 Примеры с реальными данными

### Из Movies API:

```tsx
const movie = {
  id: 550,
  title: "Fight Club",
  poster_path: "/adw6Lq9FiC9zjYEiBO9n0sHExUl.jpg",
  release_date: "1999-10-15",
  vote_average: 8.8,
  genres: [{ name: "Drama" }]
};

<AddToBookmarksButton
  contentId={movie.id.toString()}
  contentType="movie"
  title={movie.title}
  posterUrl={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
  externalRating={movie.vote_average}
  releaseYear={movie.release_date.split('-')[0]}
  genre={movie.genres[0].name}
/>
```

### Из Games API:

```tsx
const game = {
  id: 3498,
  name: "The Witcher 3: Wild Hunt",
  background_image: "https://...",
  rating: 4.5,
  released: "2015-05-19",
  genres: [{ name: "RPG" }]
};

<AddToBookmarksButton
  contentId={game.id.toString()}
  contentType="game"
  title={game.name}
  posterUrl={game.background_image}
  externalRating={game.rating}
  releaseYear={game.released.split('-')[0]}
  genre={game.genres[0].name}
/>
```

## 📱 Mobile Optimization

Кнопка полностью адаптивна:
- Работает на мобильных и планшетах
- Дропдаун меню правильно позиционируется
- Touch-friendly размер (минимум 48x48px)

## 🚀 Быстрый старт

1. Импортируй компонент где нужна кнопка
2. Передай необходимые props (contentId, contentType, title)
3. Готово! Кнопка полностью функциональна

```tsx
import AddToBookmarksButton from '@/components/AddToBookmarksButton';

// В JSX:
<AddToBookmarksButton
  contentId={item.id}
  contentType="movie"
  title={item.title}
/>
```

Больше примеров в `src/examples/bookmarkIntegrationExample.tsx`
