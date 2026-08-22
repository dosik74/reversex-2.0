-- Create user_settings table for storing user preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  settings_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own settings
CREATE POLICY "Users can view their own settings"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update their own settings"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own settings
CREATE POLICY "Users can insert their own settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own settings
CREATE POLICY "Users can delete their own settings"
  ON user_settings
  FOR DELETE
  USING (auth.uid() = user_id);
