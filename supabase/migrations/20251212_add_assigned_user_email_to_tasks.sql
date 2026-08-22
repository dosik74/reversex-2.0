-- Add assigned_user_email column to tasks table for simple text-based assignment
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS assigned_user_email VARCHAR;

-- Update the comment to explain this column
COMMENT ON COLUMN tasks.assigned_user_email IS 'Simple text field to store assignee name/email without requiring lookup in team_members';
