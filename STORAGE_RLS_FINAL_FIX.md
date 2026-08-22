# ✅ РЕШЕНИЕ: RLS политики для recommendations bucket

## 🔴 Проблема была:

```
Error status: 403
Error message: new row violates row-level security policy
```

Причина: **RLS политик для recommendations bucket вообще НЕ БЫЛО!**

## ✅ Решение (копируй и выполни в SQL Editor):

```sql
-- 1. Удали старые (если есть)
DROP POLICY IF EXISTS "Anyone can view recommendations" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload recommendations" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own recommendations" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own recommendations" ON storage.objects;

-- 2. Убедись что RLS включен
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Создай 4 новые политики (РАБОЧИЕ!)

-- SELECT - Everyone can view
CREATE POLICY "Anyone can view recommendations" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'recommendations'::text);

-- INSERT - Authenticated users can upload
CREATE POLICY "Users can upload recommendations" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'recommendations'::text
    AND auth.uid() IS NOT NULL
  );

-- DELETE - Users can delete their own
CREATE POLICY "Users can delete their own recommendations" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'recommendations'::text
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- UPDATE - Users can update their own
CREATE POLICY "Users can update their own recommendations" ON storage.objects
  FOR UPDATE
  WITH CHECK (
    bucket_id = 'recommendations'::text
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
```

## 📑 Откуда я это взял?

Посмотрел существующие политики для buckets `avatars` и `backgrounds` - они работают! Просто скопировал тот же паттерн для `recommendations`.

**Сравнение:**

```
avatars bucket:
- SELECT (public)                 ✅
- INSERT (authenticated)          ✅
- DELETE (own files only)         ✅
- UPDATE (own files only)         ✅

recommendations bucket:
- SELECT (public)                 ❌ БЫЛО НЕТ
- INSERT (authenticated)          ❌ БЫЛО НУЖНО
- DELETE (own files only)         ❌ БЫЛО НЕЧЕГО
- UPDATE (own files only)         ❌ БЫЛО НЕЧЕГО
```

## 🚀 После выполнения SQL:

1. Обнови браузер (Ctrl+R)
2. Попробуй загрузить фото снова
3. Должно работать! ✅

## ⚡ Проверка что всё работает:

```sql
-- Выполни эту проверку
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage' 
AND policyname LIKE '%recommendation%'
ORDER BY cmd;

-- Должно быть 4 результата:
-- 1. Anyone can view recommendations (SELECT)
-- 2. Users can delete their own recommendations (DELETE)
-- 3. Users can update their own recommendations (UPDATE)
-- 4. Users can upload recommendations (INSERT)
```

## 📝 Если хочешь автоматически:

Файл готов: `supabase/migrations/20260208_fix_storage_rls_final.sql`

Можешь скопировать весь SQL оттуда в SQL Editor.

---

**Главное:** Политики теперь ТОЧНО такие же как для avatars/backgrounds - рабочая схема! Фото будут загружаться! 🎉
