# 🔧 Рекомендации: Диагностика и Исправление RLS ошибок

## ❌ Ошибка: "new row violates row-level security policy"

Эта ошибка означает, что Supabase RLS (Row Level Security) политика блокирует INSERT операцию.

---

## 🔍 Возможные причины

### 1. **Пользователь не аутентифицирован**
- Сессия истекла
- Пользователь не залогинен
- Token невалиден

**Решение:**
```typescript
// Проверьте консоль браузера на ошибки аутентификации
const { data: { user }, error } = await supabase.auth.getUser();
console.log('Current user:', user);
console.log('Auth error:', error);
```

### 2. **Миграция базы данных не применена**
- Таблицы `recommendations` не существует
- RLS политики не созданы

**Решение:**
```bash
# В Supabase Dashboard:
1. SQL Editor
2. Откройте файл: supabase/migrations/20260129_create_recommendations.sql
3. Выполните полный SQL скрипт
```

### 3. **RLS политика требует user_id = auth.uid()**
- auth.uid() возвращает NULL
- user.id имеет неправильный формат

**Проверка в Supabase:**
```sql
-- Проверьте что политика есть:
SELECT * FROM pg_policies 
WHERE tablename = 'recommendations';

-- Должны быть эти политики:
-- ✅ Users can view all recommendations
-- ✅ Users can create their own recommendations  
-- ✅ Users can update their own recommendations
-- ✅ Users can delete their own recommendations
```

---

## 🛠️ Пошаговое исправление

### Шаг 1: Проверьте аутентификацию

```typescript
// В консоли браузера (F12):
const { data } = await supabase.auth.getUser();
console.log(data.user); // Должен вывести объект пользователя
```

Если выводит `null` или ошибка - пользователь не аутентифицирован.

### Шаг 2: Проверьте таблицы в Supabase

1. Откройте **Supabase Dashboard**
2. Перейдите в **SQL Editor**
3. Выполните:
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'recommendations';
```

Если ничего не выводит - нужно применить миграцию.

### Шаг 3: Применить миграцию (если нужно)

1. **SQL Editor** → **New Query**
2. Скопируйте содержимое: `supabase/migrations/20260129_create_recommendations.sql`
3. Выполните весь скрипт
4. Проверьте что таблицы созданы

### Шаг 4: Проверьте RLS политики

**SQL Editor:**
```sql
-- Проверьте что RLS включена
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'recommendations';
-- Должно показать: relrowsecurity = true

-- Проверьте политики
SELECT * FROM pg_policies 
WHERE tablename = 'recommendations';
```

---

## ✅ Проверочный список

Перед использованием рекомендаций убедитесь:

- [ ] ✅ Вы залогинены в приложении
- [ ] ✅ Таблица `recommendations` существует в Supabase
- [ ] ✅ RLS включена на таблице recommendations
- [ ] ✅ RLS политики для INSERT существуют
- [ ] ✅ Вы видите 4 политики на recommendations table
- [ ] ✅ Можете создавать новые рекомендации

---

## 🔐 Что делают RLS политики

```sql
-- Все могут видеть (SELECT)
CREATE POLICY "Users can view all recommendations" ON recommendations
  FOR SELECT USING (true);

-- Только автор может создавать (INSERT)
CREATE POLICY "Users can create their own recommendations" ON recommendations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  -- Проверяет: ID текущего юзера = user_id в базе

-- Только автор может редактировать (UPDATE)
CREATE POLICY "Users can update their own recommendations" ON recommendations
  FOR UPDATE USING (auth.uid() = user_id);

-- Только автор может удалить (DELETE)
CREATE POLICY "Users can delete their own recommendations" ON recommendations
  FOR DELETE USING (auth.uid() = user_id);
```

---

## 🐛 Отладка

Если ошибка всё ещё происходит, проверьте консоль браузера:

**F12** → **Console** tab

Ищите сообщение типа:
```
Error: "new row violates row-level security policy"
```

Проверьте логи в коде:
```typescript
// src/services/recommendationService.ts

console.log('Creating recommendation for user:', user.id);
// Должно показать UUID типа: 123e4567-e89b-12d3-a456-426614174000

const { data: recommendation, error: createError } = await supabase
  .from('recommendations')
  .insert([...]);

if (createError) {
  console.error('Insert error:', createError);
  console.error('Error code:', createError.code);
  console.error('Error message:', createError.message);
}
```

---

## 📞 Нужна помощь?

Если проблема не решена:

1. **Логи в консоли браузера** (F12 → Console)
2. **Supabase Logs** (Dashboard → SQL Editor → Просмотр ошибок)
3. **Проверьте что:**
   - Вы залогинены
   - Таблицы существуют
   - Миграция полностью применена

---

## 🚀 После исправления

Перезагрузите браузер:
```
Ctrl+R (или Cmd+R на Mac)
```

Попробуйте создать новую рекомендацию!

---

**📝 Помните:** RLS ошибки - это ХОРОШО! Это значит что ваша база защищена. 🔒
