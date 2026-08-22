# 🔧 Документация для Разработчиков: Система Рекомендаций

## Архитектура

### Слои приложения

```
┌─────────────────────────────────┐
│   Pages (React Components)      │  - Recommendations.tsx
├─────────────────────────────────┤
│   UI Components                 │  - RecommendationCreate
│                                 │  - RecommendationCard
│                                 │  - RecommendationReply
├─────────────────────────────────┤
│   Services (Business Logic)     │  - recommendationService.ts
├─────────────────────────────────┤
│   Supabase (Backend)            │  - API calls
│   - Auth                        │  - Storage
│   - Database                    │  - RLS
└─────────────────────────────────┘
```

## Типы данных

### Recommendation
```typescript
interface Recommendation {
  id: string;                    // UUID
  user_id: string;              // User ID from auth
  title: string;                // Заголовок
  content: string;              // Описание
  created_at: string;           // Дата создания
  updated_at: string;           // Дата обновления
  author?: UserInfo;            // Информация автора
  media?: RecommendationMedia[]; // Загруженные файлы
  replies_count?: number;       // Количество ответов
  likes_count?: number;         // Количество лайков
  is_liked_by_user?: boolean;   // Лайкнул ли текущий пользователь
}
```

### RecommendationMedia
```typescript
interface RecommendationMedia {
  id: string;                    // UUID
  recommendation_id: string;    // Foreign key
  media_type: 'image' | 'drawing'; // Тип файла
  media_url: string;            // URL в Storage
  storage_path: string;         // Путь в Storage
  created_at: string;           // Когда загружено
}
```

### RecommendationReply
```typescript
interface RecommendationReply {
  id: string;                    // UUID
  recommendation_id: string;    // На какой пост
  user_id: string;              // Кто написал
  content: string;              // Текст ответа
  created_at: string;           // Когда написано
  updated_at: string;           // Когда отредактировано
  author?: UserInfo;            // Информация автора
}
```

## Суть SQL таблиц

### recommendations
```sql
CREATE TABLE recommendations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL (FK: auth.users),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Индексы**:
- `idx_recommendations_user_id` - для быстрого поиска по автору
- `idx_recommendations_created_at` - для сортировки по дате

### recommendation_media
```sql
CREATE TABLE recommendation_media (
  id UUID PRIMARY KEY,
  recommendation_id UUID NOT NULL (FK: recommendations),
  media_type TEXT ('image', 'drawing'),
  media_url TEXT,
  storage_path TEXT
);
```

**Особенности**:
- Каскадное удаление при удалении поста
- Хранит URL и путь для быстрого доступа

### recommendation_replies
```sql
CREATE TABLE recommendation_replies (
  id UUID PRIMARY KEY,
  recommendation_id UUID NOT NULL (FK: recommendations),
  user_id UUID NOT NULL (FK: auth.users),
  content TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### recommendation_likes
```sql
CREATE TABLE recommendation_likes (
  id UUID PRIMARY KEY,
  recommendation_id UUID NOT NULL (FK: recommendations),
  user_id UUID NOT NULL (FK: auth.users),
  created_at TIMESTAMP,
  UNIQUE(recommendation_id, user_id)
);
```

**Особенности**:
- UNIQUE constraint предотвращает двойные лайки
- Удаляется при удалении поста

## Сервис: recommendationService.ts

### Основные функции

#### `getRecommendations(page, pageSize)`
```typescript
// Получает рекомендации с пагинацией
// Обогащает с информацией об авторе, медиа, лайками, ответами
const result = await getRecommendations(1, 10);
// Returns: { data, total, page, pageSize }
```

**Логика**:
1. Запрос из БД с offset/limit
2. Для каждого поста загружаем:
   - Медиа (файлы)
   - Информацию об авторе
   - Количество лайков
   - Количество ответов

#### `createRecommendation(title, content, files)`
```typescript
// Создает новый пост
const rec = await createRecommendation(
  'Заголовок',
  'Содержание',
  [file1, file2]
);
```

**Логика**:
1. Получаем текущего пользователя из auth
2. Вставляем запись в БД
3. Если есть файлы - загружаем в Storage
4. Сохраняем метаданные в recommendation_media

#### `uploadRecommendationMedia(recommendationId, files)`
```typescript
// Загружает файлы в Storage
await uploadRecommendationMedia(recId, [file]);
```

**Логика**:
1. Для каждого файла:
   - Генерируем имя: `{recId}/{timestamp}.{ext}`
   - Загружаем в Storage bucket
   - Получаем публичный URL
   - Определяем тип (image/drawing)
   - Сохраняем в БД

#### `addReplyToRecommendation(recommendationId, content)`
```typescript
// Добавляет ответ/комментарий
const reply = await addReplyToRecommendation(recId, 'Текст');
```

#### `likeRecommendation(recommendationId)`
```typescript
// Лайкает пост (если еще не лайкнут)
await likeRecommendation(recId);
```

**Защита**: UNIQUE constraint предотвращает дублирование

#### `unlikeRecommendation(recommendationId)`
```typescript
// Убирает лайк
await unlikeRecommendation(recId);
```

#### `deleteRecommendation(recommendationId)`
```typescript
// Удаляет пост и все связанные данные
await deleteRecommendation(recId);
```

**Логика**:
1. Получаем все файлы медиа
2. Удаляем файлы из Storage
3. Удаляем запись из БД (каскадное удаление остального)

## React компоненты

### Recommendations.tsx (Главная страница)

**State**:
```typescript
const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
const [currentPage, setCurrentPage] = useState(1);
const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);
const [replies, setReplies] = useState<Record<string, RecommendationReply[]>>({});
```

**Основной поток**:
1. При загрузке - получаем пользователя и рекомендации
2. При клике "Ответить" - раскрываем форму и загружаем ответы
3. При отправке ответа - добавляем в БД и обновляем UI
4. Управление лайками через RecommendationCard

### RecommendationCreate.tsx (Форма создания)

**Props**:
```typescript
interface RecommendationCreateProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

**Функциональность**:
- Выбор файлов из файловой системы
- Отображение списка выбранных файлов
- Удаление файлов перед отправкой
- Валидация обязательных полей
- Показание ошибок

**Процесс**:
1. Пользователь заполняет форму
2. Выбирает файлы (опционально)
3. Нажимает "Поделиться"
4. Вызывает `createRecommendation` с файлами
5. При успехе - очищает форму и вызывает `onSuccess()`

### RecommendationCard.tsx (Карточка поста)

**Props**:
```typescript
interface RecommendationCardProps {
  recommendation: Recommendation;
  onReply?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  currentUserId?: string;
}
```

**Компоненты**:
- Заголовок с информацией об авторе
- Текст поста
- Галерея изображений
- Счетчики лайков и ответов
- Кнопки действий (лайк, ответить, поделиться)
- Меню для владельца (редактировать, удалить)

**Логика лайка**:
```typescript
const handleLike = async () => {
  if (liked) {
    await unlikeRecommendation(id);
    setLiked(false);
    setLikesCount(count - 1);
  } else {
    await likeRecommendation(id);
    setLiked(true);
    setLikesCount(count + 1);
  }
};
```

### RecommendationReply.tsx (Система ответов)

**Три компонента**:

1. **RecommendationReplyItem** - один ответ
   - Информация об авторе
   - Текст ответа
   - Кнопка удаления (для владельца)

2. **RecommendationReplyList** - список ответов
   - Прокрутка с максимальной высотой
   - Вызов функции удаления

3. **RecommendationReplyInput** - форма ввода
   - Текстовое поле
   - Кнопка отправки
   - Состояние загрузки

## RLS Политики безопасности

### recommendations
```sql
-- SELECT: Все могут видеть
CREATE POLICY "Users can view all recommendations" ON recommendations
  FOR SELECT USING (true);

-- INSERT: Только автор
CREATE POLICY "Users can create their own" ON recommendations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Только автор
CREATE POLICY "Users can update their own" ON recommendations
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: Только автор
CREATE POLICY "Users can delete their own" ON recommendations
  FOR DELETE USING (auth.uid() = user_id);
```

### recommendation_likes
```sql
-- INSERT: Убедиться что это свой лайк
CREATE POLICY "Users can like" ON recommendation_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DELETE: Убедиться что это свой лайк
CREATE POLICY "Users can unlike" ON recommendation_likes
  FOR DELETE USING (auth.uid() = user_id);
```

## Интеграция в App.tsx

```typescript
// 1. Импорт
import Recommendations from "./pages/Recommendations";

// 2. Роут
<Route path="/recommendations" element={<Recommendations />} />
```

## Интеграция в Layout.tsx

```typescript
// 1. Импорт иконки
import { Lightbulb } from "lucide-react";

// 2. Добавляем в навигацию
{ icon: Lightbulb, label: 'Recommendations', path: '/recommendations' }

// 3. Кнопка в меню
<Button variant="ghost" size="sm" asChild>
  <Link to="/recommendations" className="flex items-center gap-2">
    <Lightbulb className="w-4 h-4" />
    Recommendations
  </Link>
</Button>
```

## CSS Архитектура

Каждый компонент имеет свой CSS файл:
- `RecommendationCreate.css` - форма создания
- `RecommendationCard.css` - карточка поста
- `RecommendationReply.css` - ответы
- `Recommendations.css` - страница целиком

**Классы**:
- `.recommendation-*` - основные элементы
- `.card-*` - части карточки
- `.form-*` - элементы формы
- `.action-*` - кнопки действий

## Обработка ошибок

### В Service Layer
```typescript
try {
  const result = await getRecommendations();
} catch (error) {
  console.error('Error fetching recommendations:', error);
  throw error; // Пробрасываем в компонент
}
```

### В компонентах
```typescript
try {
  await createRecommendation(...);
  onSuccess?.();
} catch (error) {
  setError(error instanceof Error ? error.message : 'Error');
} finally {
  setLoading(false);
}
```

## Производительность

### Оптимизации

1. **Пагинация**
   - По 10 постов на странице
   - Снижает нагрузку при загрузке

2. **Ленивая загрузка ответов**
   - Ответы загружаются только при клике "Ответить"
   - Кэшируются в state

3. **Индексы в БД**
   - На created_at для быстрой сортировки
   - На user_id для фильтрации

4. **Оптимистичные обновления**
   - При лайке сразу обновляем UI
   - Затем отправляем на сервер

## Развертывание

### На Vercel
1. Убедитесь что переменные окружения установлены
2. Push в GitHub
3. Vercel автоматически развернет

### На самостоятельном хосте
1. `npm run build`
2. Содержимое `dist/` = статика
3. Убедитесь что переменные окружения установлены

## Тестирование

### Как тестировать локально

```bash
# 1. Запустить dev сервер
npm run dev

# 2. Перейти на страницу
http://localhost:5173/recommendations

# 3. Авторизоваться

# 4. Создать рекомендацию

# 5. Добавить ответ

# 6. Лайкнуть пост

# 7. Открыть консоль (F12) для проверки ошибок
```

### Проверка БД

```typescript
// В консоли браузера
import supabase from '@/lib/supabase';

// Получить все рекомендации
const { data } = await supabase.from('recommendations').select('*');
console.log(data);
```

## Расширение функциональности

### Добавить фильтрацию

```typescript
// В recommendationService.ts
export async function searchRecommendations(query: string) {
  const { data } = await supabase
    .from('recommendations')
    .select('*')
    .ilike('title', `%${query}%`) // или .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false });
  
  return data;
}
```

### Добавить категории

```typescript
// В миграции добавить столбец
ALTER TABLE recommendations ADD COLUMN category TEXT;

// Тогда можно фильтровать
.eq('category', 'movies')
```

### Добавить рейтинг

```typescript
// Добавить таблицу ratings
CREATE TABLE recommendation_ratings (
  id UUID PRIMARY KEY,
  recommendation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5)
);
```

---

**Версия**: 1.0  
**Дата**: 29 января 2026
