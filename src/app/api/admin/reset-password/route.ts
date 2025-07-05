// src/app/api/admin/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const isAdmin = (email: string) => {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  return adminEmails.includes(email);
};

const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let result = 'Temp-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
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

    const { userId, userEmail } = await request.json();

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'User ID and email required' }, { status: 400 });
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with temp password and force change flag
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: tempPassword,
      user_metadata: {
        must_change_password: true,
        password_reset_by_admin: true,
        reset_timestamp: new Date().toISOString(),
        temp_password_expires: expiresAt.toISOString(),
        reset_by_admin_email: user.email
      }
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Log admin action
    await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: user.id,
        admin_email: user.email,
        action_type: 'password_reset',
        target_user_id: userId,
        target_user_email: userEmail,
        details: { temp_password_set: true, expires_at: expiresAt.toISOString() }
      });

    return NextResponse.json({ 
      success: true,
      tempPassword,
      message: `Temporary password set for ${userEmail}. Expires in 24 hours.`
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}