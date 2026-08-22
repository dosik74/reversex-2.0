# 🔍 Диагностика: почему не загружаются фото в bucket recommendations

## 1️⃣ Проверь что bucket существует

### В Supabase Dashboard:

1. Открой **Storage** в левом меню
2. Проверь список buckets
3. **Проблема:** Если "recommendations" нет → **Создай его:**
   - Нажми "New bucket"
   - Имя: `recommendations`
   - ✅ Чекбокс "Make it public"
   - Сохрани

## 2️⃣ Проверь RLS политики на storage.objects

### В SQL Editor в Supabase:

```sql
-- Проверь что RLS включен
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Результат должен быть: objects | t
-- Если null или f → RLS отключен!

-- Проверь политики
SELECT policyname, cmd, policies FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY cmd;

-- Должно быть 4 политики:
-- 1. Public access for recommendations uploads (SELECT)
-- 2. Authenticated users can upload to recommendations (INSERT)
-- 3. Authenticated users can delete from recommendations (DELETE)
-- 4. Authenticated users can update recommendations (UPDATE)
```

**Если политик нет:**
→ Выполни SQL из [`APPLY_STORAGE_RLS.md`](APPLY_STORAGE_RLS.md)

## 3️⃣ Включи детальное логирование в браузере

### Открой F12 → Console

1. Нажми кнопку **"+ Новая рекомендация"**
2. Заполни форму и добавь фото
3. Нажми **"Поделиться"**

**Смотри логи консоли:**

### ✅ Успешная загрузка выглядит так:

```
=== MEDIA UPLOAD START ===
Recommendation ID: a1b2c3d4-...
Files to upload: 1
Storage bucket: recommendations
Current user: a1b2c3d4-...
User email: user@example.com
Session exists: true
Session user: a1b2c3d4-...

--- Uploading file ---
File name: photo.jpg
File size: 125000 bytes
File type: image/jpeg
Storage path: a1b2c3d4-.../1707385200000.jpg
Starting upload...
✅ File uploaded successfully
Upload data: {path: "...", ...}
Public URL: https://[project].supabase.co/storage/v1/object/public/recommendations/...

Saving metadata to database...
✅ Metadata saved to database
=== MEDIA UPLOAD COMPLETE ===
Total files uploaded: 1
```

### ❌ Ошибка #1: Bucket не найден

```
❌ UPLOAD FAILED
Error code: NotFound
Error message: Bucket not found
Error status: 404
```

**Решение:**
1. Открой Supabase Dashboard → Storage
2. Создай bucket "recommendations"
3. Убедись что ✅ "Make it public"
4. Обнови страницу браузера (Ctrl+R)
5. Попробуй ещё раз

### ❌ Ошибка #2: RLS блокирует

```
❌ UPLOAD FAILED
Error status: 403
Error message: new row violates row-level security policy
```

**Решение:**
1. Проверь консоль: `Session exists: true`?
2. Если `false` → перезагрузи страницу
3. Если `true` → выполни SQL для добавления RLS политик
4. Проверь что bucket PUBLIC (не Private)

### ❌ Ошибка #3: Нет session (не авторизирован)

```
Session exists: false
Session user: undefined
```

**Решение:**
1. Перезагрузи страницу (Ctrl+R)
2. Переавторизуйся (logout + login)
3. Проверь что account существует в Supabase Auth

## 4️⃣ Проверь в Storage что файлы сохраняются

### В Supabase Dashboard → Storage → recommendations:

1. Должны быть папки с UUID рекомендаций
2. В каждой папке должны быть загруженные фото
3. Если пусто → файлы не загружаются

**Если папки есть, но фото нет:**
- Проверь логи в консоли на ошибки
- Может быть проблема с RLS

## 5️⃣ Проверь CORS settings

### В Supabase Dashboard → Settings → CORS:

```
Allowed origins: * (или твой domain)
Allowed methods: GET, POST, PUT, DELETE
Allowed headers: *
```

Если CORS не настроены:
1. Открой Settings
2. Добавь CORS правило
3. Нажми Save

## 📋 Checklist для отладки

- [ ] Bucket "recommendations" существует в Storage
- [ ] Bucket установлен как PUBLIC
- [ ] RLS включен на storage.objects (rowsecurity = t)
- [ ] 4 RLS политики созданы
- [ ] В консоли браузера нет ошибок
- [ ] Session exists: true при загрузке
- [ ] Files to upload: >= 1 при выборе фото
- [ ] ✅ File uploaded successfully в логах
- [ ] Папка с ID рекомендации видна в Storage
- [ ] Файл виден в папке рекомендации

## 🆘 Если всё ещё не работает

1. Скопируй полный лог из консоли браузера (F12)
2. Проверь что все 4 RLS политики есть
3. Попробуй другой браузер (может быть кеш)
4. Очистить кеш: Ctrl+Shift+Delete

**Главное**: Если видишь `✅ File uploaded successfully` в логах → файл точно в Storage, проверь папку recommendations в Supabase Dashboard.
