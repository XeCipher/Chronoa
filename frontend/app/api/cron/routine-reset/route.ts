import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // Secure the route with Vercel CRON_SECRET to prevent random web pings
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // Bypass RLS using the service role key to process backend-level ops
  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
  const currentHour = new Date().getUTCHours();

  try {
    console.log(`[${new Date().toISOString()}] Starting Routine Reset Job...`);

    // 1. Clean up permanently deleted tasks older than 5 days
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    await supabaseAdmin
      .from('tasks')
      .delete()
      .not('deleted_at', 'is', null)
      .lt('deleted_at', fiveDaysAgo.toISOString());

    // 2. Get users whose reset hour matches the current hour
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, routine_reset_hour')
      .eq('routine_reset_hour', currentHour);

    if (usersError) throw usersError;

    if (users && users.length > 0) {
      for (const user of users) {
        // 3. Get all completed routine tasks for this user
        const { data: completedRoutines } = await supabaseAdmin
          .from('tasks')
          .select('title')
          .eq('user_id', user.id)
          .eq('task_type', 'routine')
          .eq('is_completed', true);

        if (completedRoutines && completedRoutines.length > 0) {
          console.log(`Archiving ${completedRoutines.length} tasks for user ${user.id}`);
          
          // 4. Move them to history
          const historyData = completedRoutines.map((r: any) => ({
            user_id: user.id,
            task_title: r.title
          }));
          await supabaseAdmin.from('routine_history').insert(historyData);

          // 5. Uncheck all routine tasks for the new day
          await supabaseAdmin
            .from('tasks')
            .update({ is_completed: false, completed_at: null })
            .eq('user_id', user.id)
            .eq('task_type', 'routine');
        }
      }
    }

    console.log('Routine Reset Job Finished.');
    return NextResponse.json({ success: true, message: 'Routine reset successful' });
  } catch (error: any) {
    console.error('Routine reset error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}