import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Ensure this API route is never statically cached
export const dynamic = 'force-dynamic';

export async function DELETE(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // 1. Verify the user's token securely
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Bypass RLS using the service role key to securely delete the user completely
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 3. Explicitly delete user data to avoid Foreign Key constraint issues if CASCADE is missing
    await supabaseAdmin.from('tasks').delete().eq('user_id', user.id);
    await supabaseAdmin.from('time_sessions').delete().eq('user_id', user.id);
    await supabaseAdmin.from('calendar_events').delete().eq('user_id', user.id);
    await supabaseAdmin.from('calendar_sources').delete().eq('user_id', user.id);
    await supabaseAdmin.from('journal_entries').delete().eq('user_id', user.id);
    await supabaseAdmin.from('notes').delete().eq('user_id', user.id);
    await supabaseAdmin.from('note_folders').delete().eq('user_id', user.id);
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