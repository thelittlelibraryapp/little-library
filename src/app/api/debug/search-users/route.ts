import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Let's search for any user with "madman" in their username or metadata
    const { data: allUsers, error: allUsersError } = await supabase
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .limit(10);

    // Also check the custom users table
    const { data: customUsers, error: customUsersError } = await supabase
      .from('users')
      .select('*')
      .limit(10);

    // Search for madman3063 specifically
    const { data: madmanUser, error: madmanError } = await supabase
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .ilike('raw_user_meta_data->>username', '%madman%');

    return NextResponse.json({
      searchingFor: 'madman3063',
      allUsers: allUsers?.map(u => ({
        id: u.id,
        email: u.email,
        metadata: u.raw_user_meta_data
      })),
      customUsers: customUsers,
      madmanSearch: madmanUser,
      errors: {
        allUsers: allUsersError?.message,
        customUsers: customUsersError?.message,
        madman: madmanError?.message
      }
    });

  } catch (error) {
    console.error('Debug search error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}