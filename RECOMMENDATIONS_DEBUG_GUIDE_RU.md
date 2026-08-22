# 🔍 Гайд по отладке RLS ошибок и фото в Рекомендациях

## Проблема: "new row violates row-level security policy"

Эта ошибка появляется когда:
- `auth.uid()` возвращает `NULL` при INSERT
- Session не активна
- Пользователь не fully authenticated

## ✅ Шаги для отладки

### 1. Проверь логи консоли браузера (F12)

При создании рекомендации должны появиться логи:

```
Creating recommendation for user: a1b2c3d4-e5f6-...
User email: user@example.com
User metadata: {full_name: "John Doe"}
Current session exists: true
Session user ID: a1b2c3d4-e5f6-...
Recommendation created successfully: [id-uuid]
```

**Если видишь:**
- `Current session exists: false` → Проблема с authentication session
- `Session user ID: undefined` → auth.uid() вернёт NULL в RLS
- Вообще нет логов → JS ошибка при создании

### 2. Проверь что фото загружаются

В консоли должны появиться:

```
Uploading file: photo.jpg size: 125000 type: image/jpeg
File uploaded successfully: {path: "...", id: "..."}
Public URL: https://[project].supabase.co/storage/v1/object/public/recommendations/...
Media saved to database: [{id: "...", media_url: "..."}]
```

**Если ошибка при upload:**
- `Storage upload error` → Bucket не существует или не public
- `CORS error` → Проблема с CORS settings в Supabase

### 3. Проверь что имена пользователей видны

В консоли должны появиться при загрузке рекомендаций:

```
Fetching user info for: a1b2c3d4-e5f6-...
Profile data found: {username: "john_doe", full_name: "John Doe"}
```

Если видишь:
- `No profile found, trying auth metadata` → profiles таблица не заполнена
- `Using fallback user info` → Юзер показывается как "User"

## ⚙️ Требуемые конфигурации Supabase

### 1. Storage bucket "recommendations" должен быть PUBLIC

```
Supabase Dashboard → Storage
1. Проверь что bucket "recommendations" существует
2. Нажми на bucket → Settings
3. Убедись что галка "Make it public" ✅ включена
4. Проверь CORS settings:
   - Allowed origins: * (или твой domain)
   - Allowed methods: GET, POST, PUT, DELETE
```

### 2. RLS Policies на таблицах

Проверь что policies включены для всех таблиц:

```sql
-- Для recommendations таблицы
SELECT tablename, policyname FROM pg_policies 
WHERE tablename LIKE 'recommendation%';

-- Должно быть примерно 12-16 policies
```

### 3. Проверь auth session

В Supabase Dashboard → SQL Editor выполни:

```sql
-- Проверь что policies используют auth.uid() правильно
SELECT 
  schemaname,
  tablename,
  policyname,
  qual
FROM pg_policies 
WHERE tablename = 'recommendations'
ORDER BY policyname;
```

## 🐛 Частые проблемы и решения

### Проблема: "new row violates row-level security policy"

**Причина:** Вставка блокируется RLS политикой

**Решение:**
1. Проверь что пользователь авторизирован (логи консоли)
2. Проверь что `user_id` совпадает с `auth.uid()`
3. Проверь RLS политику:

```sql
-- Должна быть эта политика на recommendations
SELECT * FROM pg_policies 
WHERE tablename = 'recommendations' 
AND policyname = 'Users can create their own recommendations';

-- Policy должна быть:
-- FOR INSERT WITH CHECK (auth.uid() = user_id)
```

### Проблема: Фото не видны после создания

**Причина 1:** Storage bucket не public
- Проверь Settings → "Make it public" ✅

**Причина 2:** Bucket не существует
- Создай bucket "recommendations" через Dashboard

**Причина 3:** URL неправильный
- Проверь логи: `Public URL: https://...`
- URL должен содержать `/public/recommendations/`

### Проблема: Имена пользователей показываются как "User"

**Причина:** profiles таблица не заполнена

**Решение:**
1. Проверь что при регистрации создаётся record в profiles:

```sql
SELECT id, username, full_name, email FROM profiles LIMIT 5;
```

2. Если пусто, заполни данные вручную во время регистрации
3. Или обнови регистрационный код чтобы заполнял profiles

## 📋 Checklist для отладки

- [ ] Открыл F12 (Dev Tools) и вижу консоль браузера
- [ ] Логирую создание рекомендации и вижу юзер ID
- [ ] `Current session exists: true` в логах
- [ ] Storage bucket "recommendations" существует
- [ ] Bucket установлен как PUBLIC в Settings
- [ ] Могу загрузить фото без ошибок
- [ ] Public URL содержит правильный путь
- [ ] Видимо фото в HTML (посмотри Network tab)
- [ ] profiles таблица заполнена для тестового юзера
- [ ] Видны имена пользователей вместо "User"

## 🔧 SQL queries для быстрой проверки

```sql
-- 1. Проверь что RLS включен на всех таблицах
SELECT tablename, 
       (SELECT count(*) FROM pg_policies WHERE pg_policies.tablename = information_schema.tables.table_name) as policy_count
FROM information_schema.tables
WHERE table_schema = 'public' AND tablename LIKE 'recommendation%';

-- 2. Проверь RLS политику для INSERT
SELECT policyname, definition FROM pg_policies 
WHERE tablename = 'recommendations' AND cmd = 'INSERT';

-- 3. Проверь что profiles таблица существует
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'profiles' LIMIT 10;

-- 4. Проверь данные в profiles
SELECT id, username, full_name FROM profiles LIMIT 5;

-- 5. Проверь что recommendation_media правильно сохраняется
SELECT * FROM recommendation_media LIMIT 3;
```

## ✨ Если всё работает

- ✅ Рекомендация создаётся без ошибок
- ✅ Фото загружается и видно
- ✅ Имя юзера отображается правильно
- ✅ Комментарии работают без RLS ошибок
- ✅ Лайки работают

Всё работает! 🎉

Если проблемы остаются → посмотри логи консоли F12 и напиши ошибку.
