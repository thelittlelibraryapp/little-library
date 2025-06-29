// File: /api/books/[id]/return/route.ts
// PUT endpoint for borrower to mark book as returned

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
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

    const { id } = await params;
    const bookId = id;
    const body = await request.json();
    const { userId } = body;  // Add this line to extract userId from body

    // Verify the user is the current borrower
    const { data: borrowHistory, error: borrowError } = await supabase
      .from('borrowing_history')
      .select('*')
      .eq('book_id', bookId)
      .eq('borrower_id', userId)
      .is('checked_in_at', null)
      .single();

    if (borrowError || !borrowHistory) {
      return NextResponse.json({ error: 'You are not currently borrowing this book' }, { status: 403 });
    }

    // Update book status to return_pending
    const { error: statusError } = await supabase
      .from('book_status')
      .update({ 
        status: 'return_pending',
        notes: 'Borrower marked as returned, waiting for owner confirmation'
      })
      .eq('book_id', bookId);

    if (statusError) {
      return NextResponse.json({ error: statusError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Book marked as returned, waiting for owner confirmation',
      status: 'return_pending'
    }, { status: 200 });

  } catch (error) {
    console.error('PUT /api/books/[id]/return error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}