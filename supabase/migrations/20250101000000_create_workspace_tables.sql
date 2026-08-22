-- Workspace users table
CREATE TABLE IF NOT EXISTS workspace_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  username VARCHAR UNIQUE,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace projects
CREATE TABLE IF NOT EXISTS workspace_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members in projects
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES workspace_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Boards within projects
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES workspace_projects(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Board columns (Kanban states)
CREATE TABLE IF NOT EXISTS board_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES workspace_projects(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  status VARCHAR CHECK (status IN ('planned', 'in_progress', 'done', 'abandoned')),
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES board_columns(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES workspace_projects(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_user_email VARCHAR,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_workspace_projects_user_id ON workspace_projects(user_id);
CREATE INDEX idx_team_members_project_id ON team_members(project_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_boards_project_id ON boards(project_id);
CREATE INDEX idx_board_columns_project_id ON board_columns(project_id);
CREATE INDEX idx_tasks_column_id ON tasks(column_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
