# 📸 Рекомендации: Исправление фото и имён пользователей

## ❌ Проблемы:
1. **Фото не показываются** в рекомендациях и ответах
2. **Имена пользователей не отображаются** - все показывают как "Anonymous"

---

## 🔧 Решение 1: Создать Storage Bucket

### Шаг 1: Откройте Supabase Dashboard

1. Перейдите на https://supabase.com
2. Откройте ваш проект
3. Левое меню → **Storage**

### Шаг 2: Создать новый bucket

1. Нажмите **"New bucket"**
2. Введите имя: `recommendations`
3. Установите галочку **"Public bucket"** ✅
4. Нажмите **Create bucket**

![Storage Bucket](https://via.placeholder.com/400x200?text=Create+Bucket)

### Шаг 3: Проверить CORS (если нужно)

В **Storage → Settings** проверьте CORS:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 🔧 Решение 2: Исправить загрузку имён пользователей

Уже исправлено в `src/services/recommendationService.ts`!

### Как работает теперь:

1. **Первый приоритет**: Загружает данные из таблицы `profiles`
   - Ищет: `username`, `full_name`, `avatar_url`
   - Таблица: `profiles`

2. **Второй приоритет**: Загружает из текущего `auth.getUser()`
   - Использует: `user_metadata`

3. **Fallback**: Показывает "User" если всё остальное не работает

---

## ✅ Проверка работы

### 1. Проверьте консоль браузера (F12)

Должны быть логи типа:

```
Fetching user info for: 123e4567-e89b-12d3-a456-426614174000
Profile data found: {username: "john_doe", ...}
Uploading file: photo.jpg size: 1024 type: image/jpeg
Public URL: https://...supabase.co/storage/v1/object/public/recommendations/...
Media saved to database: [{id: "...", media_url: "..."}]
All media uploaded successfully
```

### 2. Если видите ошибки:

```javascript
// В консоли браузера выполните:
console.log(localStorage.getItem('token'))
// Должен вывести что-то типа: eyJ0eXAiOiJKV1Q...
```

---

## 🐛 Отладка

### Проблема: Имена всё ещё не отображаются

**Проверьте:**

1. **Наличие таблицы `profiles`**
```sql
-- SQL Editor в Supabase
SELECT COUNT(*) FROM profiles LIMIT 1;
```

Если таблица не существует - создайте:
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

2. **Заполнены ли данные в profiles**
```sql
SELECT id, username, full_name FROM profiles LIMIT 10;
```

Если пусто - отредактируйте профиль в приложении!

---

### Проблема: Фото не показываются, но видны в консоли

**Варианты:**

1. **Storage bucket не создан** → Создайте его (см. выше)
2. **Bucket не public** → Сделайте public в Settings
3. **CORS не настроены** → Проверьте Settings
4. **URL неправильный** → Проверьте в DevTools:
   - F12 → Network
   - Поищите запросы к `supabase.co`
   - Проверьте статус (200 = OK, 403 = нет доступа)

---

## 🚀 Тестирование

### 1. Создайте тестовую рекомендацию

```
Заголовок: "Тест фото"
Описание: "Проверяем фото"
Фото: Загрузите любое изображение
```

### 2. Откройте DevTools (F12)

- **Console** - ищите логи загрузки
- **Network** - ищите запросы к storage
- **Elements** - проверьте HTML тега фото

### 3. Проверьте отображение

```html
<!-- Правильно (видно фото):
<img src="https://...supabase.co/storage/v1/object/public/recommendations/..." alt="Media">

<!-- Неправильно (не видно):
<img src="undefined" alt="Media">
<img src="null" alt="Media">
```

---

## 📝 SQL запросы для проверки

```sql
-- Проверьте что фото сохранились в БД
SELECT * FROM recommendation_media LIMIT 5;

-- Проверьте что рекомендации существуют
SELECT id, title, user_id FROM recommendations LIMIT 5;

-- Проверьте что ответы существуют
SELECT id, content, user_id FROM recommendation_replies LIMIT 5;

-- Проверьте профилы пользователей
SELECT id, username, full_name FROM profiles LIMIT 10;
```

---

## 🔐 Если фото приватные

Если вам нужны **приватные фото** (не для всех):

```typescript
// Используйте signed URL вместо public URL:
const { data } = await supabase.storage
  .from('recommendations')
  .createSignedUrl(filePath, 60 * 60); // 1 час

// Сохраняйте: data.signedUrl
```

---

## ✨ После исправления

1. **Перезагрузите браузер**: Ctrl+R (или Cmd+R)
2. **Очистите кэш**: Ctrl+Shift+Delete
3. **Проверьте консоль**: F12 → Console
4. **Создайте новую рекомендацию с фото** 
5. **Добавьте ответ с описанием**

**Результат:**
- ✅ Видны имена пользователей
- ✅ Видны фото в рекомендациях
- ✅ Видны фото в ответах (если добавлены)
- ✅ Видны аватары пользователей

---

## 📞 Нужна помощь?

1. **Проверьте логи в консоли** (F12 → Console)
2. **Посмотрите Supabase Logs**:
   - Dashboard → Logs
   - Ищите ошибки storage или RLS
3. **Проверьте что Storage bucket создан** и является **public**

---

**Помните:** 
- 🔒 RLS ошибки = хорошо (ваша база защищена)
- 📸 Storage ошибки = нужно настроить bucket
- 👤 User info = загружается из profiles или auth

Все исправления уже в коде! 🚀
