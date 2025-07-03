// File: /src/app/api/users/[id]/route.ts
// GET endpoint to fetch user information (for claim notifications)

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get user from the auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const params = await context.params;
    const userId = params.id;

    // Get user info (limited fields for privacy)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, username, email')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only return user info if they are friends with the requesting user
    // Check library_access table for accepted access
    const { data: friendshipData, error: friendshipError } = await supabase
      .from('library_access')
      .select('*')
      .or(`and(user_id.eq.${authUser.id},granted_by.eq.${userId}),and(user_id.eq.${userId},granted_by.eq.${authUser.id})`)
      .eq('is_active', true)
      .limit(1);

    if (friendshipError) {
      console.error('Error checking friendship:', friendshipError);
      return NextResponse.json({ error: 'Error checking permissions' }, { status: 500 });
    }

    if (!friendshipData || friendshipData.length === 0) {
      return NextResponse.json({ error: 'Not authorized to view this user' }, { status: 403 });
    }

    return NextResponse.json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      email: user.email
    });

  } catch (error) {
    console.error('GET /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}