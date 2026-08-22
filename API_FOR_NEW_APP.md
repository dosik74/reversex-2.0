# Готовые API-запросы для нового приложения

Здесь собраны полностью готовые запросы с **реальными ключами**, которые прямо сейчас работают в проекте. Просто копируй и вставляй в свой код.

## 1. TMDB API (Фильмы и Сериалы)
Для работы нужен токен в Headers. Вот готовый код для получения данных (например, популярных фильмов):

```javascript
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhOTgxYjNiYTBiMzQ1ZjU3OGZiOTE3ZWU3NGE5MGJmMyIsIm5iZiI6MTc1MjUyMjUxMy40MjcsInN1YiI6IjY4NzU1ZjExNzUzYjVjNTYwM2Y5MWJkMyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Trm6p4NqL6VPKlvUkGkRMKVjeH2KAklTAllVbnolV8w';

// Настройки для всех запросов
const headers = {
  'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
  'Accept': 'application/json'
};

// 1. Поиск фильма
fetch('https://api.themoviedb.org/3/search/movie?query=Аватар&language=ru-RU', { headers })
  .then(res => res.json())
  .then(data => console.log(data));

// 2. Популярные фильмы
fetch('https://api.themoviedb.org/3/movie/popular?language=ru-RU', { headers })
  .then(res => res.json())
  .then(data => console.log(data));

// 3. Детали конкретного фильма (здесь 19995 - это ID фильма "Аватар")
fetch('https://api.themoviedb.org/3/movie/19995?language=ru-RU', { headers })
  .then(res => res.json())
  .then(data => console.log(data));
```

**(Также можно использовать просто API ключ в URL)**:
* `https://api.themoviedb.org/3/movie/popular?api_key=a981b3ba0b345f578fb917ee74a90bf3&language=ru-RU`

---

## 2. OMDB API (Рейтинги IMDb и др.)
Готовые ссылки (ключ `1e8fe39e` уже вшит).

```javascript
// Поиск по ID в базе IMDb (пример с ID "tt3896198")
fetch('https://www.omdbapi.com/?i=tt3896198&apikey=1e8fe39e')
  .then(res => res.json())
  .then(data => console.log(data));

// Поиск по названию на английском
fetch('https://www.omdbapi.com/?t=Inception&apikey=1e8fe39e')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 3. Supabase API (Твоя база данных)
Для нового React/JS проекта сначала установи клиент: `npm install @supabase/supabase-js`. Затем просто вставь этот код для подключения:

```javascript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://thhefxrmnejoxcftdpvq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaGVmeHJtbmVqb3hjZnRkcHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NjM2ODUsImV4cCI6MjA3ODEzOTY4NX0.rH2IK94T09cnWAMm00PtH0jvUTCnLqKLbTpdZ8FSX0k';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Пример получения всех закладок из базы данных
const getBookmarks = async () => {
  const { data, error } = await supabase.from('bookmarks').select('*');
  console.log(data);
};
```

---

## 4. YouTube Downloader API (Локальный загрузчик)
Если на компьютере запущен файл `server.js`, ты можешь скачивать видео через эти запросы:

```javascript
// 1. Скачать видео
fetch('http://localhost:3001/api/download', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    quality: '1080p'
  })
});

// 2. Получить информацию о видео
fetch('http://localhost:3001/api/video-info', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' 
  })
}).then(res => res.json()).then(data => console.log(data));
```
