import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
}

interface User {
  id: string;
  email: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, user_id, title, description, deadline, status')
      .eq('reminder_sent', false)
      .lte('deadline', oneHourFromNow.toISOString())
      .gte('deadline', now.toISOString())
      .neq('status', 'completed');

    if (tasksError) {
      throw new Error(`Failed to fetch tasks: ${tasksError.message}`);
    }

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No tasks with upcoming deadlines',
          count: 0,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const userIds = [...new Set(tasks.map((task: Task) => task.user_id))];
    
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    const userMap = new Map(
      users
        .filter((user: User) => userIds.includes(user.id))
        .map((user: User) => [user.id, user])
    );

    const emailsSent = [];
    const errors = [];

    for (const task of tasks) {
      const user = userMap.get(task.user_id);
      
      if (!user || !user.email) {
        errors.push({
          taskId: task.id,
          error: 'User email not found',
        });
        continue;
      }

      const deadlineDate = new Date(task.deadline);
      const timeUntilDeadline = Math.round((deadlineDate.getTime() - now.getTime()) / (1000 * 60));

      const emailContent = `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">⏰ Task Deadline Reminder</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #333; margin-top: 0;">📝 ${task.title}</h2>
                ${task.description ? `<p style="color: #666; line-height: 1.6;">${task.description}</p>` : ''}
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #856404; font-weight: bold;">⚠️ Deadline in approximately ${timeUntilDeadline} minutes</p>
                  <p style="margin: 10px 0 0 0; color: #856404;">${deadlineDate.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
                </div>
                <p style="color: #666;"><strong>Status:</strong> ${task.status.replace('_', ' ').toUpperCase()}</p>
              </div>
              <p style="color: #666; font-size: 14px; text-align: center; margin: 20px 0 0 0;">This is an automated reminder from your Task Management System</p>
            </div>
          </body>
        </html>
      `;

      console.log(`Would send email to ${user.email} for task: ${task.title}`);
      console.log(`Email content preview: Task "${task.title}" due in ${timeUntilDeadline} minutes`);

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ reminder_sent: true })
        .eq('id', task.id);

      if (updateError) {
        errors.push({
          taskId: task.id,
          error: `Failed to update reminder status: ${updateError.message}`,
        });
      } else {
        emailsSent.push({
          taskId: task.id,
          userEmail: user.email,
          taskTitle: task.title,
          minutesUntilDeadline: timeUntilDeadline,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${tasks.length} task(s)`,
        emailsSent: emailsSent.length,
        errors: errors.length,
        details: {
          sent: emailsSent,
          errors: errors,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in send-task-reminders:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});