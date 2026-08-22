# 🎬 Система Рекомендаций

Новая функция **Recommendations** для вашего сайта - социальная сеть для обмена рекомендациями о фильмах, сериалах и других развлечениях!

## ✨ Возможности

### 📝 Создание Рекомендаций
- Делитесь своими рекомендациями с заголовком и описанием
- Загружайте изображения и рисунки
- Автоматическое сохранение в Supabase

### 📱 Лента Рекомендаций
- Просмотр всех рекомендаций других пользователей
- Постраничная навигация (10 постов на странице)
- Красивый дизайн в стиле TikTok/Twitter

### 👍 Система Лайков
- Быстро лайкните понравившиеся рекомендации
- Счетчик лайков для каждого поста
- Управление своими лайками

### 💬 Комментарии и Ответы
- Отвечайте на рекомендации
- Расширяемая лента ответов
- Удаляйте свои ответы

### 🔐 Защита и Приватность
- Рядовые политики безопасности (RLS) в Supabase
- Пользователи могут удалять только свои посты
- Автоматическое каскадное удаление связанных данных

## 🚀 Установка

### 1. Создайте таблицы в Supabase

Выполните SQL миграцию:
```bash
# Файл находится в:
supabase/migrations/20260129_create_recommendations.sql
```

Или вручную создайте таблицы через Supabase Dashboard:
- `recommendations` - основные рекомендации
- `recommendation_media` - изображения и рисунки
- `recommendation_replies` - ответы и комментарии
- `recommendation_likes` - лайки

### 2. Убедитесь, что Storage bucket создан

Создайте bucket `recommendations` в Supabase Storage для хранения файлов:

```
Supabase Dashboard → Storage → Create new bucket
Bucket name: recommendations
Public: true
File size limit: 50MB
```

### 3. Импортируйте компоненты

Все компоненты уже созданы:
- `/src/pages/Recommendations.tsx` - главная страница
- `/src/components/RecommendationCreate.tsx` - форма создания
- `/src/components/RecommendationCard.tsx` - карточка рекомендации
- `/src/components/RecommendationReply.tsx` - система ответов
- `/src/services/recommendationService.ts` - API сервис

### 4. Роут уже добавлен

Страница доступна по адресу: `/recommendations`

## 📖 Использование

### Перейти на страницу рекомендаций:
```
yoursite.com/recommendations
```

### Создать рекомендацию:
1. Нажмите "+ Новая рекомендация"
2. Заполните заголовок и описание
3. (Опционально) Загрузите фото/рисунки
4. Нажмите "Поделиться"

### Ответить на рекомендацию:
1. Нажмите "Ответить" на нужном посте
2. Введите текст ответа
3. Нажмите "Отправить"

### Лайкнуть рекомендацию:
1. Нажмите на иконку сердца
2. Счетчик обновится автоматически

## 🗂️ Структура файлов

```
src/
├── pages/
│   └── Recommendations.tsx          # Главная страница
├── components/
│   ├── RecommendationCreate.tsx     # Форма создания
│   ├── RecommendationCreate.css     # Стили формы
│   ├── RecommendationCard.tsx       # Карточка поста
│   ├── RecommendationCard.css       # Стили карточки
│   ├── RecommendationReply.tsx      # Система ответов
│   ├── RecommendationReply.css      # Стили ответов
│   └── Layout.tsx                   # Навигация (обновлена)
├── services/
│   └── recommendationService.ts     # Supabase сервис
├── types/
│   └── recommendations.ts           # TypeScript типы
└── pages/
    └── Recommendations.css          # Основные стили
```

## 🔌 API Функции

### Получение рекомендаций
```typescript
const result = await getRecommendations(page, pageSize);
// Returns: { data, total, page, pageSize }
```

### Создание рекомендации
```typescript
await createRecommendation(title, content, files);
```

### Загрузка медиа
```typescript
await uploadRecommendationMedia(recommendationId, files);
```

### Добавление ответа
```typescript
const reply = await addReplyToRecommendation(recommendationId, content);
```

### Лайк/Дизлайк
```typescript
await likeRecommendation(recommendationId);
await unlikeRecommendation(recommendationId);
```

### Удаление
```typescript
await deleteRecommendation(recommendationId);
await deleteReply(replyId);
```

## 🎨 Дизайн

- **Стиль**: TikTok/Twitter-подобный
- **Цветовая схема**: Темная, с голубыми акцентами
- **Адаптивность**: Полностью мобильный дизайн
- **Анимации**: Плавные переходы и загрузочные индикаторы

## 📊 Особенности Supabase

### Row Level Security (RLS)

Все таблицы защищены политиками безопасности:
- Все могут просматривать любые рекомендации
- Только автор может редактировать/удалять свои посты
- Каскадное удаление данных при удалении рекомендации

### Индексы для Производительности

```sql
CREATE INDEX idx_recommendations_created_at 
ON recommendations(created_at DESC);

CREATE INDEX idx_recommendation_likes_user_id 
ON recommendation_likes(user_id);
```

## 🐛 Решение Проблем

### Не загружаются файлы?
- Проверьте, что bucket `recommendations` создан в Storage
- Убедитесь, что CORS настроен в Supabase

### Нет данных в таблицах?
- Выполните миграцию SQL
- Проверьте RLS политики

### Ошибки при создании поста?
- Убедитесь, что вы авторизованы
- Проверьте консоль браузера на ошибки

## 📱 Мобильная оптимизация

Страница полностью адаптирована для мобильных устройств:
- Сенсорно-дружественные кнопки
- Оптимизированный размер текста
- Быстрая загрузка изображений

## 🔄 Обновление и Миграция

Если вы обновляете Supabase версию:
1. Проверьте наличие таблиц
2. Примените миграцию если нужно
3. Проверьте RLS политики

## 📝 Примечания

- Система полностью работает с Supabase
- Поддерживает аутентификацию через Supabase Auth
- Файлы хранятся в Supabase Storage
- Все операции защищены RLS политиками

## 🎯 Будущие Улучшения

Возможные добавления:
- 🔍 Поиск по рекомендациям
- #️⃣ Хэштеги и категории
- 📊 Популярные рекомендации
- 👥 Подписки на пользователей
- 🔔 Уведомления о новых ответах
- 📸 Canvas рисования вместо загрузки

---

**Версия**: 1.0  
**Дата**: 29 января 2026  
**Автор**: GitHub Copilot
