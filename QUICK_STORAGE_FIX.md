# 🚨 СРОЧНО: Почему фото не загружаются в bucket recommendations

## 🔴 Проблема:
- Попытался загрузить 3 фото в рекомендации
- Bucket "recommendations" существует и PUBLIC
- Но в bucket 0 файлов

## ✅ Решение (за 5 минут)

### Шаг 1: Выполни диагностический SQL

Открой **Supabase Dashboard → SQL Editor** и запусти ВСЕ эти запросы по порядку:

```sql
-- 1. Проверь RLS включен
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';
-- Должно быть: objects | t

-- 2. Проверь политики (должно быть 4!)
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY cmd;

-- 3. Проверь bucket
SELECT id, name, public FROM storage.buckets WHERE name = 'recommendations';
-- Должно быть: recommendations, public = true

-- 4. Проверь файлы в bucket
SELECT COUNT(*) as file_count FROM storage.objects 
WHERE bucket_id = 'recommendations';
-- Если 0 → файлы не загружаются

-- 5. Проверь метаданные в БД
SELECT COUNT(*) as metadata_count FROM recommendation_media;
-- Если 0 → метаданные не сохраняются
```

### Шаг 2: Если что-то НЕ ✅

**RLS политик нет (query 2 вернул < 4)?**
→ Выполни SQL из [`APPLY_STORAGE_RLS.md`](APPLY_STORAGE_RLS.md)

**Bucket не public?**
→ Supabase Dashboard → Storage → recommendations → Settings → ✅ "Make it public"

**Файлов нет в bucket?**
→ Идём на Шаг 3

### Шаг 3: Обновляй и тестируй с логами

```bash
git pull
npm install
npm run build
```

Открой браузер и:
1. Нажми **F12** (Developer Tools)
2. Перейди на таб **Console**
3. Нажми **"+ Новая рекомендация"**
4. Заполни форму и добавь **ОДНО** фото
5. Нажми **"Поделиться"**

### Шаг 4: Смотри логи в консоли

Должны быть логи вроде этого:

```
=== MEDIA UPLOAD START ===
Recommendation ID: a1b2c3d4-...
Files to upload: 1
Storage bucket: recommendations
Current user: a1b2c3d4-...
Session exists: true

--- Uploading file ---
File name: photo.jpg
File size: 125000 bytes
Starting upload...
✅ File uploaded successfully
Public URL: https://...

✅ Metadata saved to database
=== MEDIA UPLOAD COMPLETE ===
```

**Если видишь это** → файл точно в Storage. Проверь папку в Supabase Dashboard.

### Шаг 5: Узнай точную ошибку

Если видишь ошибку в консоли, скопируй полностью и смотри ниже:

#### ❌ Ошибка 1: "Bucket not found" (404)
```
❌ UPLOAD FAILED
Error status: 404
Error message: Bucket not found
```
→ Bucket не существует. Создай его в Supabase Dashboard (Storage → New bucket)

#### ❌ Ошибка 2: "RLS Policy blocked" (403)
```
❌ UPLOAD FAILED
Error status: 403
Error message: row-level security policy
```
→ RLS политики не созданы или неправильные
→ Выполни SQL из [`APPLY_STORAGE_RLS.md`](APPLY_STORAGE_RLS.md)

#### ❌ Ошибка 3: "Session exists: false"
```
Session exists: false
Session user: undefined
```
→ Не авторизирован
→ Перезагрузи страницу (Ctrl+R)
→ Переавторизуйся (logout + login)

#### ❌ Ошибка 4: "DATABASE INSERT FAILED"
```
❌ DATABASE INSERT FAILED
Error message: new row violates row-level security policy
```
→ Файл загрузился в Storage, но метаданные не сохраняются в БД
→ Это OK - файл есть в Storage, рекомендация создана
→ Проверь что recommendation_media таблица имеет правильные RLS политики

## 📚 Вся документация

- [`STORAGE_BUCKET_DIAGNOSTIC.md`](STORAGE_BUCKET_DIAGNOSTIC.md) - подробная отладка
- [`APPLY_STORAGE_RLS.md`](APPLY_STORAGE_RLS.md) - как добавить RLS политики
- `supabase/migrations/20260208_storage_diagnostic.sql` - SQL запросы для проверки

## ⚡ TLDR (самое быстрое)

```
1. Supabase Dashboard → SQL Editor
2. Скопируй и выполни 5 запросов сверху
3. Если < 4 политик → запусти APPLY_STORAGE_RLS.md SQL
4. F12 → Console → создай рекомендацию с фото
5. Смотри логи

Если видишь "✅ File uploaded successfully" → всё работает!
```

**Если не работает после всего этого → пиши ошибку из консоли.**
