import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // 1. Authenticate user strictly from session
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // 2. Bypass RLS using the service role key to securely delete the user completely
  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

  try {
    // 3. Explicitly delete user data to avoid Foreign Key constraint issues if CASCADE is missing
    await supabaseAdmin.from('tasks').delete().eq('user_id', user.id);
    await supabaseAdmin.from('time_sessions').delete().eq('user_id', user.id);
    await supabaseAdmin.from('calendar_events').delete().eq('user_id', user.id);
    await supabaseAdmin.from('calendar_sources').delete().eq('user_id', user.id);
    await supabaseAdmin.from('journal_entries').delete().eq('user_id', user.id);
    await supabaseAdmin.from('routine_history').delete().eq('user_id', user.id);
    await supabaseAdmin.from('profiles').delete().eq('id', user.id);

    // 4. Finally, delete the user entirely from Supabase Auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}