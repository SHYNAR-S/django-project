import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'new' | 'in_progress' | 'completed';
  deadline: string;
  created_at: string;
  updated_at: string;
  reminder_sent: boolean;
};

export async function triggerTaskReminders() {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-task-reminders`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({}),
    }
  );
  return response.json();
}
