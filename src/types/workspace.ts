export interface WorkspaceUser {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user?: WorkspaceUser;
}

export interface WorkspaceProject {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  invite_code?: string;
  created_at: string;
  updated_at: string;
}

export interface BoardColumn {
  id: string;
  project_id: string;
  name: string;
  status: 'done' | 'in_progress' | 'planned' | 'abandoned';
  order: number;
}

export interface Task {
  id: string;
  column_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  assigned_user_email?: string;
  created_by?: string;
  due_date?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  order: number;
  assignee?: WorkspaceUser;
  creator?: WorkspaceUser;
}

export interface Board {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  work_date?: string;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'done' | 'in_progress' | 'planned' | 'abandoned';
