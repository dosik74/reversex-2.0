# 🔒 Как добавить RLS политики для Storage bucket

## Быстро (5 минут)

### 1. Открой Supabase Dashboard

```
https://app.supabase.com → Твой проект → SQL Editor
```

### 2. Скопируй и выполни этот SQL

```sql
-- ENABLE RLS
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- DROP old policies
DROP POLICY IF EXISTS "Public access for uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload recommendations" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their files" ON storage.objects;

-- SELECT - Everyone can view
CREATE POLICY "Public access for recommendations uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'recommendations');

-- INSERT - Authenticated users only
CREATE POLICY "Authenticated users can upload to recommendations" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'recommendations' AND auth.uid() IS NOT NULL);

-- DELETE - Authenticated users only
CREATE POLICY "Authenticated users can delete from recommendations" ON storage.objects
  FOR DELETE USING (bucket_id = 'recommendations' AND auth.uid() IS NOT NULL);

-- UPDATE - Authenticated users only
CREATE POLICY "Authenticated users can update recommendations" ON storage.objects
  FOR UPDATE WITH CHECK (bucket_id = 'recommendations' AND auth.uid() IS NOT NULL);
```

### 3. Нажми "Execute" ✅

Готово! RLS политики добавлены.

## Проверка (убедись что всё работает)

В SQL Editor выполни:

```sql
-- Проверь что RLS включен
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';
-- Результат: objects | t (t = true)

-- Проверь что 4 политики созданы
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY cmd;
-- Результат: должно быть 4 политики
```

## Что означают эти политики

| Операция | Разрешено кому | Описание |
|----------|---|---|
| **SELECT** | Всем (публично) | Любой может смотреть фото |
| **INSERT** | Только залогированные | Только авторизованные юзеры могут загружать |
| **DELETE** | Только залогированные | Только авторизованные юзеры могут удалять |
| **UPDATE** | Только залогированные | Только авторизованные юзеры могут изменять метаданные |

## После успешной установки

Должны работать:
- ✅ Авторизованные юзеры могут загружать фото
- ✅ Все могут смотреть фото (публичный доступ)
- ✅ Неавторизованные не могут загружать (защита от спама)

## Если ошибка "policy already exists"

Выполни DROP часть первой, потом CREATE:

```sql
DROP POLICY IF EXISTS "Public access for recommendations uploads" ON storage.objects;
-- потом создавай новую с CREATE POLICY
```

## Файлы с RLS политиками

- `supabase/migrations/20260208_storage_rls_detailed.sql` - подробная версия с комментариями
- `supabase/migrations/20260208_add_storage_rls.sql` - компактная версия

Выполни один из них (оба содержат одинаковые политики).
