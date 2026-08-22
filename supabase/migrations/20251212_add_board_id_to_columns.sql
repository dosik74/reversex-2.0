-- Add board_id to board_columns table
ALTER TABLE board_columns ADD COLUMN board_id UUID REFERENCES boards(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX idx_board_columns_board_id ON board_columns(board_id);

-- Update comment to explain the column
COMMENT ON COLUMN board_columns.board_id IS 'Reference to the board this column belongs to';
