/*
  # Task Management System Schema

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key) - Unique identifier for each task
      - `user_id` (uuid, foreign key) - Reference to auth.users
      - `title` (text) - Task title
      - `description` (text) - Task description
      - `status` (text) - Task status: 'new', 'in_progress', 'completed'
      - `deadline` (timestamptz) - Task deadline
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `tasks` table
    - Add policy for users to read only their own tasks
    - Add policy for users to insert their own tasks
    - Add policy for users to update only their own tasks
    - Add policy for users to delete only their own tasks

  3. Important Notes
    - All tasks are owned by a user (user_id references auth.users)
    - Default status is 'new'
    - Timestamps are automatically managed
    - RLS ensures complete data isolation between users
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  deadline timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add check constraint for valid status values
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('new', 'in_progress', 'completed'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_deadline_idx ON tasks(deadline);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- Policy: Users can read only their own tasks
CREATE POLICY "Users can read own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own tasks
CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update only their own tasks
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete only their own tasks
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);