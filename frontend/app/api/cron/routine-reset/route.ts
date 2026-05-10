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

    // 2. Fetch all users to accurately calculate local time via their timezone
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, routine_reset_hour, timezone');

    if (usersError) throw usersError;

    if (users && users.length > 0) {
      for (const user of users) {
        try {
          const tz = user.timezone || 'UTC';
          
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            hour: 'numeric',
            hour12: false
          });
          
          const parts = formatter.formatToParts(new Date());
          const hourPart = parts.find(p => p.type === 'hour');
          let localHour = parseInt(hourPart?.value || '0', 10);
          if (localHour === 24) localHour = 0;

          // 3. Reset routines if user's local hour exactly matches their routine_reset_hour
          if (localHour === user.routine_reset_hour) {
            const { data: completedRoutines } = await supabaseAdmin
              .from('tasks')
              .select('title')
              .eq('user_id', user.id)
              .eq('task_type', 'routine')
              .eq('is_completed', true)
              .is('deleted_at', null);

            if (completedRoutines && completedRoutines.length > 0) {
              console.log(`Archiving ${completedRoutines.length} tasks for user ${user.id}`);
              
              // 4. Move them to history
              const historyData = completedRoutines.map((r: any) => ({
                user_id: user.id,
                task_title: r.title
              }));
              
              const { error: histError } = await supabaseAdmin.from('routine_history').insert(historyData);
              if (histError) console.error("Error inserting to routine_history:", histError);

              // 5. Uncheck all routine tasks for the new day
              await supabaseAdmin
                .from('tasks')
                .update({ is_completed: false, completed_at: null })
                .eq('user_id', user.id)
                .eq('task_type', 'routine');
            }
          }
        } catch (userErr) {
          console.error(`Error processing user ${user.id}:`, userErr);
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