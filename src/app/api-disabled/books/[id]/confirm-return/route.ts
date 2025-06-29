// File: /api/books/[id]/confirm-return/route.ts  
// PUT endpoint for owner to confirm book return

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
    const { userId } = body;

    // Verify the user owns this book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('library_id, libraries!inner(owner_id)')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (book.libraries.owner_id !== userId) {
      return NextResponse.json({ error: 'You do not own this book' }, { status: 403 });
    }

    // Verify book is in return_pending status
    const { data: currentStatus, error: statusCheckError } = await supabase
      .from('book_status')
      .select('status')
      .eq('book_id', bookId)
      .single();

    if (statusCheckError || currentStatus?.status !== 'return_pending') {
      return NextResponse.json({ error: 'Book is not pending return' }, { status: 400 });
    }

    // Update book status to available
    const { error: statusError } = await supabase
      .from('book_status')
      .update({ 
        status: 'available',
        borrower_id: null,
        checked_out_at: null,
        due_date: null,
        notes: 'Return confirmed by owner'
      })
      .eq('book_id', bookId);

    if (statusError) {
      return NextResponse.json({ error: statusError.message }, { status: 500 });
    }

    // Mark the borrowing history as completed
    const { error: historyError } = await supabase
      .from('borrowing_history')
      .update({ 
        checked_in_at: new Date().toISOString(),
        owner_notes: 'Return confirmed by owner'
      })
      .eq('book_id', bookId)
      .is('checked_in_at', null);

    if (historyError) {
      console.error('Failed to update borrowing history:', historyError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ 
      message: 'Book return confirmed successfully',
      status: 'available'
    }, { status: 200 });

  } catch (error) {
    console.error('PUT /api/books/[id]/confirm-return error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}