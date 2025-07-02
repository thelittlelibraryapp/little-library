// File: /api/friends/[id]/route.ts
// DELETE endpoint to remove friends

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get the user from the auth header (same pattern as other routes)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;  // ← Fix: await params
    const friendId = id;
    
    // Get userId from query params (sent by frontend)
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Verify the requesting user matches the authenticated user
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get user's library
    const { data: userLibrary } = await supabase
      .from('libraries')
      .select('id')
      .eq('owner_id', userId)
      .single();

    // Get friend's library  
    const { data: friendLibrary } = await supabase
      .from('libraries')
      .select('id')
      .eq('owner_id', friendId)
      .single();

    if (!userLibrary || !friendLibrary) {
      return NextResponse.json({ error: 'Library not found' }, { status: 404 });
    }

    // Remove mutual library access records
    const { error: deleteError1 } = await supabase
      .from('library_access')
      .delete()
      .eq('library_id', userLibrary.id)
      .eq('user_id', friendId);

    const { error: deleteError2 } = await supabase
      .from('library_access')
      .delete()
      .eq('library_id', friendLibrary.id)
      .eq('user_id', userId);

    if (deleteError1 || deleteError2) {
      console.error('Delete errors:', { deleteError1, deleteError2 });
      return NextResponse.json({ error: 'Failed to remove friendship' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Friend removed successfully' 
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE /api/friends/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}