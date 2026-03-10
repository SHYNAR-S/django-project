/*
  # Add reminder tracking to tasks

  1. Changes
    - Add `reminder_sent` column to track if reminder email has been sent
    - Add index for efficient querying of tasks needing reminders

  2. Important Notes
    - Default value is false (no reminder sent)
    - This prevents sending duplicate reminder emails
*/

-- Add reminder_sent column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'reminder_sent'
  ) THEN
    ALTER TABLE tasks ADD COLUMN reminder_sent boolean DEFAULT false;
  END IF;
END $$;

-- Create index for efficient querying of tasks needing reminders
CREATE INDEX IF NOT EXISTS tasks_reminder_check_idx ON tasks(deadline, reminder_sent) WHERE reminder_sent = false;