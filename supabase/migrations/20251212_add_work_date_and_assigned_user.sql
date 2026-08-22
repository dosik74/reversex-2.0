-- Add work_date column to boards table
ALTER TABLE boards ADD COLUMN work_date DATE;

-- Add comment explaining the column
COMMENT ON COLUMN boards.work_date IS 'Date when the team is working on this board';
