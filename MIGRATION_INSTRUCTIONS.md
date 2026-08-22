# Инструкция по миграции

Нужно выполнить SQL в Supabase:

```sql
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS assigned_user_email VARCHAR;

COMMENT ON COLUMN tasks.assigned_user_email IS 'Simple text field to store assignee name/email without requiring lookup in team_members';
```

1. Откройте https://app.supabase.com/
2. Выберите проект
3. SQL Editor
4. Скопируйте SQL выше
5. Execute

Или можно использовать Supabase CLI:
```bash
supabase migration new add_assigned_user_email_to_tasks
```

После выполнения миграции кнопка "Назначить" будет работать нормально.
