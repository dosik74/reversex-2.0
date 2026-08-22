# 🔧 Workspace API & Примеры

## Примеры Использования

### Создание Проекта

```typescript
import supabase from "@/utils/supabase";

const createProject = async (userId: string, name: string, description: string) => {
  const { data, error } = await supabase
    .from("workspace_projects")
    .insert([
      {
        user_id: userId,
        name: name,
        description: description,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error:", error.message);
    return null;
  }

  return data;
};
```

### Загрузка Проектов Пользователя

```typescript
const loadUserProjects = async (userId: string) => {
  const { data, error } = await supabase
    .from("workspace_projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};
```

### Добавление Члена Команды

```typescript
const addTeamMember = async (projectId: string, userId: string, role: "owner" | "admin" | "member" = "member") => {
  const { data, error } = await supabase
    .from("team_members")
    .insert([
      {
        project_id: projectId,
        user_id: userId,
        role: role,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

### Создание Доски

```typescript
const createBoard = async (projectId: string, name: string, description?: string) => {
  const { data, error } = await supabase
    .from("boards")
    .insert([
      {
        project_id: projectId,
        name: name,
        description: description || null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

### Создание Задачи

```typescript
const createTask = async (
  projectId: string,
  columnId: string,
  title: string,
  description?: string,
  assignedTo?: string,
  dueDate?: string
) => {
  const { data, error } = await supabase
    .from("tasks")
    .insert([
      {
        project_id: projectId,
        column_id: columnId,
        title: title,
        description: description || null,
        assigned_to: assignedTo || null,
        due_date: dueDate || null,
        completed: false,
        order: 0,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

### Обновление Статуса Задачи (Перемещение)

```typescript
const updateTaskStatus = async (taskId: string, newColumnId: string) => {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      column_id: newColumnId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

### Пометить Задачу Выполненной

```typescript
const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      completed: completed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

### Загрузка Всех Задач в Проекте

```typescript
const loadProjectTasks = async (projectId: string) => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*, assignee:assigned_to(*)")
    .eq("project_id", projectId)
    .order("order", { ascending: true });

  if (error) throw error;
  return data || [];
};
```

### Загрузка Членов Команды

```typescript
const loadTeamMembers = async (projectId: string) => {
  const { data, error } = await supabase
    .from("team_members")
    .select("*, user:user_id(*)")
    .eq("project_id", projectId);

  if (error) throw error;
  return data || [];
};
```

### Удаление Задачи

```typescript
const deleteTask = async (taskId: string) => {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (error) throw error;
};
```

### Удаление Доски

```typescript
const deleteBoard = async (boardId: string) => {
  const { error } = await supabase
    .from("boards")
    .delete()
    .eq("id", boardId);

  if (error) throw error;
};
```

### Удаление Проекта (каскадное)

```typescript
const deleteProject = async (projectId: string) => {
  const { error } = await supabase
    .from("workspace_projects")
    .delete()
    .eq("id", projectId);

  if (error) throw error;
};
```

## Типы Данных

```typescript
// Пользователь
interface WorkspaceUser {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
}

// Проект
interface WorkspaceProject {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Член команды
interface TeamMember {
  id: string;
  project_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  user?: WorkspaceUser;
}

// Доска
interface Board {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Колонка Kanban
interface BoardColumn {
  id: string;
  project_id: string;
  name: string;
  status: "done" | "in_progress" | "planned" | "abandoned";
  order: number;
}

// Задача
interface Task {
  id: string;
  column_id: string;
  project_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  completed: boolean;
  order: number;
  created_at: string;
  updated_at: string;
  assignee?: WorkspaceUser;
}
```

## Константы

```typescript
// Статусы задач
const TASK_STATUS = {
  PLANNED: "planned",
  IN_PROGRESS: "in_progress",
  DONE: "done",
  ABANDONED: "abandoned",
} as const;

// Роли в проекте
const MEMBER_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
} as const;
```

## Real-time Обновления (Будущее)

```typescript
// Подписка на изменения задач (в разработке)
const subscribeToTaskChanges = (projectId: string, callback: (changes: Task[]) => void) => {
  return supabase
    .channel(`project_${projectId}:tasks`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tasks",
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
        // Обновить UI
        callback(payload.new as Task);
      }
    )
    .subscribe();
};
```

## Ошибки и Обработка

```typescript
// Правильная обработка ошибок
try {
  const data = await createTask(projectId, columnId, "Новая задача");
  console.log("✅ Задача создана:", data);
} catch (error: any) {
  if (error.code === "23505") {
    console.error("❌ Дублирующаяся запись");
  } else if (error.code === "42P01") {
    console.error("❌ Таблица не существует");
  } else {
    console.error("❌ Ошибка:", error.message);
  }
}
```

---

Для большей информации смотрите [WORKSPACE_GUIDE.md](./WORKSPACE_GUIDE.md)
