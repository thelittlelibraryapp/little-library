import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get the user from the auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get all user data from auth.users
    const { data: authUserData, error: authUserError } = await supabase
      .from('auth.users')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get user data from custom users table if it exists
    const { data: customUserData, error: customUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      currentUserId: user.id,
      authUserData: authUserData,
      authUserError: authUserError?.message,
      customUserData: customUserData,
      customUserError: customUserError?.message,
      rawMetadata: authUserData?.raw_user_meta_data,
    });

  } catch (error) {
    console.error('Debug user info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}