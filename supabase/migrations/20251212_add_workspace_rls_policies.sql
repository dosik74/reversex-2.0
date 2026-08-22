-- Enable RLS on workspace tables
ALTER TABLE workspace_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_users ENABLE ROW LEVEL SECURITY;

-- Workspace Projects RLS: Users can see their own projects and shared projects
CREATE POLICY "Users can see their own projects" ON workspace_projects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can see shared projects" ON workspace_projects
  FOR SELECT USING (
    id IN (
      SELECT project_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects" ON workspace_projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own projects" ON workspace_projects
  FOR UPDATE USING (user_id = auth.uid());

-- Boards RLS: Users can access boards of their projects
CREATE POLICY "Users can see boards of their projects" ON boards
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM workspace_projects WHERE user_id = auth.uid()
      UNION
      SELECT project_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create boards" ON boards
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM workspace_projects WHERE user_id = auth.uid()
      UNION
      SELECT project_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update boards" ON boards
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM workspace_projects WHERE user_id = auth.uid()
      UNION
      SELECT project_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Board Columns RLS: Users can access columns of their boards
CREATE POLICY "Users can see board columns" ON board_columns
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM workspace_projects WHERE user_id = auth.uid()
      UNION
      SELECT project_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create board columns" ON board_columns
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM workspace_projects WHERE user_id = auth.uid()
      UNION
      SELECT project_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Tasks RLS: Users can access tasks of their projects
CREATE POLICY "Users can see tasks" ON tasks
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM workspace_projects WHERE user_id = auth.uid()
      UNION
      SELECT project_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks" ON tasks
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM workspace_projects WHERE user_id = auth.uid()
      UNION
      SELECT project_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks" ON tasks
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM workspace_projects WHERE user_id = auth.uid()
      UNION
      SELECT project_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Team Members RLS: Users can see team members of their projects
CREATE POLICY "Users can see team members" ON team_members
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM workspace_projects WHERE user_id = auth.uid()
      UNION
      SELECT project_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add team members" ON team_members
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM workspace_projects WHERE user_id = auth.uid()
    )
  );
