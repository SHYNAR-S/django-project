/*
  # Setup Email Reminder Scheduler

  1. Changes
    - Enable pg_cron extension for scheduled jobs
    - Create scheduled job to check for tasks needing reminders every 15 minutes
    - Job calls the edge function to send email reminders

  2. Important Notes
    - Runs every 15 minutes to check for upcoming deadlines
    - Uses pg_net to make HTTP requests to the edge function
    - Enable pg_net extension for HTTP requests
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Remove existing job if it exists
DO $$
DECLARE
  job_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'send-task-reminders'
  ) INTO job_exists;
  
  IF job_exists THEN
    PERFORM cron.unschedule('send-task-reminders');
  END IF;
END $$;

-- Schedule the reminder check to run every 15 minutes
SELECT cron.schedule(
  'send-task-reminders',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-task-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Create a function to manually trigger reminders (for testing)
CREATE OR REPLACE FUNCTION trigger_task_reminders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-task-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
    ),
    body := '{}'::jsonb
  ) INTO result;
  
  RETURN result;
END;
$$;