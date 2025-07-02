import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Get current user's library
    const { data: userLibrary } = await supabase
      .from('libraries')
      .select('id')
      .eq('owner_id', userId)
      .single();

    if (!userLibrary) {
      return NextResponse.json({ friends: [], accessibleLibraries: [] });
    }

    // Get friends who have access to user's library
    const { data: friends, error } = await supabase
      .from('library_access')
      .select(`
        id,
        user_id,
        granted_at,
        user:user_id(
          id,
          first_name,
          last_name,
          email,
          username
        )
      `)
      .eq('library_id', userLibrary.id)
      .eq('is_active', true);

    if (error) throw error;

    // Get libraries user has access to
    const { data: accessibleLibraries } = await supabase
      .from('library_access')
      .select(`
        library:library_id(
          id,
          name,
          owner:owner_id(
            id,
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    return NextResponse.json({ 
      friends: friends || [],
      accessibleLibraries: accessibleLibraries || []
    });

  } catch (error) {
    console.error('Get friends error:', error);
    return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
  }
}