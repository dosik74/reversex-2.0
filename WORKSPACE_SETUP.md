CREATE TABLE IF NOT EXISTS workspace_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  username VARCHAR UNIQUE,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES workspace_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES workspace_projects(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS board_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES workspace_projects(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  status VARCHAR CHECK (status IN ('planned', 'in_progress', 'done', 'abandoned')),
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES board_columns(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES workspace_projects(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_workspace_projects_user_id ON workspace_projects(user_id);
CREATE INDEX idx_team_members_project_id ON team_members(project_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_boards_project_id ON boards(project_id);
CREATE INDEX idx_board_columns_project_id ON board_columns(project_id);
CREATE INDEX idx_tasks_column_id ON tasks(column_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);

ALTER TABLE workspace_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects"
ON workspace_projects FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_members.project_id = workspace_projects.id 
    AND team_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create projects"
ON workspace_projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON workspace_projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view team members of their projects"
ON team_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_projects 
    WHERE workspace_projects.id = team_members.project_id 
    AND (workspace_projects.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM team_members t2
      WHERE t2.project_id = team_members.project_id
      AND t2.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Project owners can add team members"
ON team_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_projects 
    WHERE workspace_projects.id = team_members.project_id 
    AND workspace_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view boards of accessible projects"
ON boards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_projects 
    WHERE workspace_projects.id = boards.project_id 
    AND (workspace_projects.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.project_id = boards.project_id
      AND team_members.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Users can create boards in their projects"
ON boards FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_projects 
    WHERE workspace_projects.id = boards.project_id 
    AND workspace_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view columns of accessible boards"
ON board_columns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_projects 
    WHERE workspace_projects.id = board_columns.project_id 
    AND (workspace_projects.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.project_id = board_columns.project_id
      AND team_members.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Users can view tasks of accessible columns"
ON tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_projects 
    WHERE workspace_projects.id = tasks.project_id 
    AND (workspace_projects.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.project_id = tasks.project_id
      AND team_members.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Users can create tasks in their projects"
ON tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_projects 
    WHERE workspace_projects.id = tasks.project_id 
    AND workspace_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update tasks in their projects"
ON tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workspace_projects 
    WHERE workspace_projects.id = tasks.project_id 
    AND workspace_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tasks in their projects"
ON tasks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workspace_projects 
    WHERE workspace_projects.id = tasks.project_id 
    AND workspace_projects.user_id = auth.uid()
  )
);

