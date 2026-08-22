# 🏗️ Workspace - Архитектура

## Общая Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
├─────────────────────────────────────────────────────────┤
│  Workspace Pages       Kanban Board      Components      │
│  - Auth               - Drag & Drop      - Types        │
│  - Dashboard          - Columns          - Hooks        │
│  - Project            - Tasks                           │
│  - Settings                                             │
├─────────────────────────────────────────────────────────┤
│              Framer Motion Animations                    │
├─────────────────────────────────────────────────────────┤
│                  React Router v6                         │
├─────────────────────────────────────────────────────────┤
│              Supabase Client Library                     │
├─────────────────────────────────────────────────────────┤
│                   Supabase Cloud                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │        PostgreSQL Database                        │  │
│  │  - workspace_projects                            │  │
│  │  - team_members                                  │  │
│  │  - boards                                        │  │
│  │  - board_columns                                 │  │
│  │  - tasks                                         │  │
│  │  - Row Level Security                           │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Supabase Auth                             │  │
│  │  - Email/Password                               │  │
│  │  - Session Management                           │  │
│  │  - JWT Tokens                                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Структура Папок

```
src/
├── pages/
│   ├── Workspace.tsx
│   │   ├── State: projects[], user, modals
│   │   ├── Functions: createProject, loadProjects
│   │   └── UI: Header, Project Grid, Modal
│   │
│   ├── WorkspaceAuth.tsx
│   │   ├── State: email, password, loading, error
│   │   ├── Functions: handleAuth, toggle mode
│   │   └── UI: Form, Toggle Link, Error Message
│   │
│   ├── WorkspaceProject.tsx
│   │   ├── State: project, boards, selectedBoard, members
│   │   ├── Functions: createBoard, inviteMember, deleteBoard
│   │   └── UI: Header, Board Tabs, Kanban
│   │
│   └── WorkspaceSettings.tsx
│       ├── State: user
│       ├── Functions: handleLogout
│       └── UI: Account Info, Danger Zone
│
├── components/
│   ├── KanbanBoard.tsx
│   │   ├── State: columns[], tasks[], draggedTask
│   │   ├── Functions: createTask, updateStatus, deleteTask, toggleComplete
│   │   └── UI: Columns, Tasks, Drag & Drop
│   │
│   └── (других компонентов будут добавлены)
│
├── types/
│   └── workspace.ts
│       ├── WorkspaceUser
│       ├── WorkspaceProject
│       ├── TeamMember
│       ├── Board
│       ├── BoardColumn
│       └── Task
│
├── utils/
│   └── supabase.ts (существует)
│
├── context/
│   └── (можно добавить AppContext для Workspace)
│
└── App.tsx
    ├── Routes для workspace
    ├── Error handling
    └── Providers
```

---

## Data Flow

### 1. Авторизация
```
User Input → WorkspaceAuth Component
    ↓
supabase.auth.signUp/signInWithPassword()
    ↓
Supabase Auth Service
    ↓
Session Created
    ↓
Redirect to /workspace
```

### 2. Загрузка Проектов
```
Workspace Component Mounted
    ↓
useEffect() → checkAuth()
    ↓
Supabase Query: workspace_projects (user_id = current_user)
    ↓
Set State: projects[]
    ↓
Render Project Grid
```

### 3. Создание Задачи
```
User Click "Add task"
    ↓
Show Input Modal
    ↓
User Input Title
    ↓
KanbanBoard.createTask()
    ↓
supabase.from("tasks").insert()
    ↓
Supabase Insert
    ↓
Set State: tasks[]
    ↓
Re-render Column with New Task
```

### 4. Drag & Drop Задачи
```
Mouse Down on Task Card
    ↓
setDraggedTask(task)
    ↓
Drag Over Column
    ↓
Highlight Drop Zone
    ↓
Mouse Up
    ↓
KanbanBoard.updateTaskStatus()
    ↓
supabase.from("tasks").update({ column_id: newColumnId })
    ↓
Set State: tasks updated
    ↓
Re-render
```

---

## Component Hierarchy

```
App
├── Route: /workspace-auth
│   └── WorkspaceAuth
│
├── Route: /workspace
│   └── Workspace
│       ├── Header
│       ├── Create Project Modal
│       └── Project Grid
│           └── Project Card (Repeating)
│
├── Route: /workspace/project/:id
│   └── WorkspaceProject
│       ├── Header
│       │   ├── Back Button
│       │   ├── Invite Button
│       │   └── Settings Button
│       ├── Create Board Modal
│       ├── Board Tabs
│       │   └── Board Tab (Repeating)
│       └── Kanban Board (Content)
│           ├── Column (x4)
│           │   ├── Column Header
│           │   ├── Task Cards
│           │   │   └── Task (Draggable, Repeating)
│           │   └── Add Task Button
│           └── Add New Column
│
└── Route: /workspace/settings
    └── WorkspaceSettings
        ├── Header
        ├── Account Info Section
        └── Danger Zone Section
```

---

## State Management

### Global State (может быть добавлен)
```typescript
// Context для Workspace
interface WorkspaceContextType {
  currentUser: WorkspaceUser | null;
  currentProject: WorkspaceProject | null;
  currentBoard: Board | null;
  loadingProject: boolean;
  error: string | null;
}
```

### Local State (текущий подход)
```typescript
// Each component manages its own state
- Workspace: projects, user, modals
- WorkspaceProject: project, boards, members, modals
- KanbanBoard: columns, tasks, draggedTask, modals
```

---

## API Endpoints (Supabase)

### Read Operations
```sql
-- Загрузить проекты пользователя
GET /rest/v1/workspace_projects?user_id=eq.{id}

-- Загрузить доски проекта
GET /rest/v1/boards?project_id=eq.{id}

-- Загрузить колонки проекта
GET /rest/v1/board_columns?project_id=eq.{id}

-- Загрузить задачи проекта
GET /rest/v1/tasks?project_id=eq.{id}

-- Загрузить членов команды
GET /rest/v1/team_members?project_id=eq.{id}
```

### Write Operations
```sql
-- Создать проект
INSERT INTO workspace_projects (user_id, name, description)

-- Создать доску
INSERT INTO boards (project_id, name, description)

-- Создать задачу
INSERT INTO tasks (column_id, project_id, title, ...)

-- Обновить задачу
UPDATE tasks SET column_id = {id} WHERE id = {id}

-- Удалить задачу
DELETE FROM tasks WHERE id = {id}

-- Добавить члена команды
INSERT INTO team_members (project_id, user_id, role)
```

---

## Error Handling

### Auth Errors
```typescript
try {
  const { error } = await supabase.auth.signInWithPassword(...)
  if (error) {
    // Show error message
    // Redirect to auth page
  }
} catch (err) {
  // Network error or client error
}
```

### Database Errors
```typescript
try {
  const { data, error } = await supabase
    .from("table")
    .select()
  
  if (error) {
    // Handle DB error
    // Log to console
    // Show user-friendly message
  }
} catch (err) {
  // Unexpected error
}
```

### Common Error Codes
```
23505  → Duplicate entry
42P01  → Table not found
42703  → Column not found
22001  → String too long
PGRST116 → RLS violation
```

---

## Security

### Row Level Security
```sql
-- Each user can only see their own projects
CREATE POLICY "Users can view their own projects"
ON workspace_projects
FOR SELECT
USING (auth.uid() = user_id)

-- Team members can see project data
CREATE POLICY "Team members can see boards"
ON boards
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_projects
    WHERE workspace_projects.id = boards.project_id
    AND (workspace_projects.user_id = auth.uid() OR ...)
  )
)
```

### Authentication
- Supabase Auth handles password hashing
- JWT tokens for session management
- Automatic token refresh

### Data Protection
- RLS policies on all tables
- User ID validation
- Role-based access control

---

## Performance Optimizations

### Frontend
```typescript
// Memoization for expensive operations
const projectCards = useMemo(() => [...], [projects])

// Debounced handlers
const debouncedSearch = useDebouncedCallback((query) => {...}, 300)

// Virtual scrolling for long lists (future)
<VirtualList items={tasks} />

// Lazy loading images
<img loading="lazy" />
```

### Database
```sql
-- Indexes on frequently queried columns
CREATE INDEX idx_workspace_projects_user_id
CREATE INDEX idx_team_members_project_id
CREATE INDEX idx_tasks_column_id

-- Efficient queries with select
SELECT * WHERE ... (with indexes)
```

### Network
```typescript
// Request deduplication
// Caching with React Query (future)
// Optimistic updates
```

---

## Scalability

### Current Limits
- Single user workspace
- No real-time updates (pull-based)
- In-memory state

### Future Improvements
- Infinite scroll for projects
- Pagination for tasks
- Real-time subscriptions (Supabase Realtime)
- Caching layer
- Background jobs for heavy operations

---

## Testing Strategy

```typescript
// Unit Tests
- Button handlers
- Form validation
- Data transformations

// Integration Tests
- Auth flow
- Project CRUD
- Task movements

// E2E Tests
- Full user workflows
- Drag & drop
- Team collaboration
```

---

## Deployment

### Build Process
```bash
npm run build
# Output: dist/ folder ready for deployment
```

### Environment Variables
```
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_KEY=...
```

### Hosting Options
- Vercel (recommended)
- GitHub Pages
- Netlify
- Self-hosted

---

## Monitoring & Logging

```typescript
// Error logging
console.error("Error creating task:", error)

// Success logging
console.log("Task created:", data)

// Supabase monitoring
- Check dashboard for query performance
- Monitor rate limits
- Track error rates
```

---

## Version Control

```
Git workflow:
main
├── development
│   ├── feature/workspace-kanban
│   ├── feature/workspace-auth
│   └── feature/workspace-teams
└── production
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Routing | React Router v6 |
| State | Local + Context |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Build | Vite |
| Package Manager | npm |

---

*Architecture v1.0 - Created 11 December 2025*
