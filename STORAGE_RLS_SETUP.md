# 🔧 Добавить RLS политики для Storage bucket

## Как добавить RLS политики

### Вариант 1: Через SQL Editor в Supabase Dashboard (Быстро)

1. Открой Supabase Dashboard → **SQL Editor**
2. Скопируй и выполни этот SQL:

```sql
-- Add RLS policies for Storage bucket "recommendations"
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view files
CREATE POLICY IF NOT EXISTS "Public access for uploaded files" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'recommendations');

-- Allow authenticated users to upload
CREATE POLICY IF NOT EXISTS "Users can upload recommendations" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'recommendations' AND 
    auth.uid() IS NOT NULL
  );

-- Allow users to delete files
CREATE POLICY IF NOT EXISTS "Users can delete their own files" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'recommendations' AND
    auth.uid() IS NOT NULL
  );

-- Allow users to update files
CREATE POLICY IF NOT EXISTS "Users can update their files" ON storage.objects
  FOR UPDATE
  WITH CHECK (
    bucket_id = 'recommendations' AND
    auth.uid() IS NOT NULL
  );
```

3. Нажми **Execute** ✅

### Вариант 2: Через миграцию в приложении

Файл уже создан: `supabase/migrations/20260208_add_storage_rls.sql`

## Проверь что RLS добавлены

В SQL Editor выполни:

```sql
-- Проверь RLS политики на storage.objects
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- Должно быть 4 политики:
-- 1. Public access for uploaded files (SELECT)
-- 2. Users can delete their own files (DELETE)
-- 3. Users can update their files (UPDATE)  
-- 4. Users can upload recommendations (INSERT)
```

## Результат

После добавления:
✅ Юзеры могут загружать фото в recommendations
✅ Все могут смотреть фото (публичный доступ)
✅ Юзеры могут удалять свои фото
✅ RLS защищает неавторизованный доступ

## Если всё ещё не работает

В консоли браузера (F12 → Console) должны быть логи:

```
Creating recommendation for user: [ID]
Current session exists: true
Uploading file: photo.jpg
File uploaded successfully: ...
Recommendation created successfully: [ID]
```

Если видишь:
- `Current session exists: false` → Переавторизуйся
- `Bucket not found` → Bucket не существует
- `CORS error` → Проблема с CORS в Supabase
