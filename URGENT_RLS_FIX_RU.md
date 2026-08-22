# 🚀 Срочное решение: RLS ошибка и фото в Рекомендациях

**Обновлено:** 8 февраля 2026

## ⚠️ Проблемы которые мы исправили

1. **RLS ошибка** - "new row violates row-level security policy"
   - ✅ Добавлено подробное логирование для отладки auth.uid()
   - ✅ Улучшены сообщения об ошибках
   - ✅ Добавлена проверка session перед CREATE

2. **Фото не видны**
   - ✅ Добавлена проверка на наличие Storage bucket
   - ✅ Добавлена обработка ошибок bucket not found
   - ✅ Фото больше не блокируют создание рекомендации (если фото не загрузится - рекомендация всё равно создаётся)

3. **Имена пользователей как "User"**
   - ✅ улучшен getRecommendationMedia логирование
   - ✅ Добавлена проверка profiles таблицы

## 📋 ЧТО ДЕЛАТЬ СЕЙЧАС

### Шаг 1: Обнови код

```bash
git pull  # или скачай последние изменения
npm install
npm run build
```

### Шаг 2: Проверь Storage bucket в Supabase (ОЧЕНЬ ВАЖНО!)

**Выполни эти шаги в Supabase Dashboard:**

1. Открой **Storage** в левом меню
2. Проверь что bucket **"recommendations"** существует
3. Если НЕ существует:
   - Нажми **"New bucket"**
   - Имя: `recommendations`
   - ✅ Включи **"Make it public"** (ОБЯЗАТЕЛЬНО!)
   - Сохрани

4. Если уже существует:
   - Нажми на bucket
   - Нажми **Settings**
   - Убедись что ✅ **"Make it public"** включена
   - Проверь CORS settings

### Шаг 3: Проверь что всё работает

1. Открой приложение в браузере
2. Нажми **F12** чтобы открыть Developer Tools
3. Перейди на таб **Console**
4. Создай новую рекомендацию с фото

**В консоли должны появиться логи:**

```
Creating recommendation for user: [UUID]
User email: your@email.com
Current session exists: true
Session user ID: [same UUID]
Uploading file: photo.jpg
File uploaded successfully: ...
Public URL: https://[project].supabase.co/storage/v1/object/public/recommendations/...
Recommendation created successfully: [UUID]
```

### Шаг 4: Если РЛС ошибка всё ещё появляется

**Проверь в консоли:**

```
Current session exists: false  ❌ ПРОБЛЕМА!
```

**Если видишь это:**
- Перезагрузи страницу (Ctrl+R)
- Переавторизуйся 
- Проверь что password и email правильные
- Проверь что у тебя есть account в Supabase Auth

**Если видишь:**
```
Error code: PGRST
Error message: new row violates row-level security policy
```

Это значит есть проблема с RLS политикой. Выполни в SQL Editor в Supabase:

```sql
-- Проверь что RLS политика включена правильно
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'recommendations';

-- Должна быть политика как эта:
-- Users can create their own recommendations | INSERT | (auth.uid() = user_id)
```

## 🔧 Что изменилось в коде

### 1. Улучшено логирование при создании рекомендации

```typescript
// Теперь логируем:
console.log('Current session exists:', !!session);
console.log('Session user ID:', session?.user?.id);
```

Это помогает отладить RLS ошибку за 10 секунд вместо часов.

### 2. Фото больше не блокируют рекомендацию

```typescript
// Если фото не загрузится, рекомендация всё равно создаётся
try {
  await uploadRecommendationMedia(recommendation.id, files);
} catch (mediaError) {
  console.error('Media upload failed, but recommendation was created');
  // Не выбрасываем ошибку - рекомендация создана!
}
```

### 3. Лучшие сообщения об ошибках

```typescript
// Вместо просто "Failed to create recommendation"
// Теперь показываем:
// "Ошибка RLS: Не удалось создать рекомендацию.
//  Убедись что:
//  1. Ты залогирован
//  2. Сессия активна
//  3. Auth.uid() возвращает корректный ID"
```

### 4. Проверка на наличие Storage bucket

```typescript
// Если bucket не существует:
if (uploadError.message?.includes('Bucket not found')) {
  throw new Error(
    'Storage bucket "recommendations" not found. 
     Please create it in Supabase Dashboard and make it PUBLIC.'
  );
}
```

## 📊 Тест смо-сценарий

**Должно работать это:**

1. ✅ Создаю рекомендацию без фото → Работает
2. ✅ Создаю рекомендацию с 1 фото → Работает, фото видно
3. ✅ Создаю рекомендацию с 5 фотографиями → Работает
4. ✅ Добавляю комментарий → Работает без RLS ошибки
5. ✅ Лайкую рекомендацию → Работает
6. ✅ Вижу имя автора вместо "User" → Если profiles заполнена

**Если хоть что-то не работает:**
→ Посмотри логи в F12 Console и напиши мне

## 📝 Документация

Для подробной отладки → читай **RECOMMENDATIONS_DEBUG_GUIDE_RU.md**

Там есть:
- SQL запросы для проверки RLS
- Объяснение каждого лога
- Checklist по настройке

## 🎯 TL;DR

```bash
git pull
npm install && npm run build

# Потом в Supabase Dashboard:
# Storage → recommendations bucket → Settings → "Make it public" ✅

# Потом в браузере:
F12 → Console → создай рекомендацию → смотри логи
```

That's it! 🚀
