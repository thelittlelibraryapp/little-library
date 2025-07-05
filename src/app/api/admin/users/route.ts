// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin Supabase client (needs service role key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // You'll need to add this to .env.local
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Check if user is admin
const isAdmin = (email: string) => {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  return adminEmails.includes(email);
};

export async function GET(request: NextRequest) {
  try {
    // Get current user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || !isAdmin(user.email!)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch users from auth.users (admin only)
    const { data: authUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    // Fetch additional user data from your users table
    const { data: userProfiles, error: profilesError } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    // Combine auth data with profile data
    const combinedUsers = authUsers.users.map(authUser => {
      const profile = userProfiles?.find(p => p.id === authUser.id);
      return {
        id: authUser.id,
        email: authUser.email,
        email_confirmed_at: authUser.email_confirmed_at,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        username: profile?.username,
        must_change_password: authUser.user_metadata?.must_change_password || false
      };
    });

    return NextResponse.json({ 
      users: combinedUsers,
      total: combinedUsers.length 
    });

  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}