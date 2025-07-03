// File: /src/app/api/books/[id]/confirm-received/route.ts
// PUT endpoint for claimer to confirm they received the book

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const params = await context.params;
    const bookId = params.id;

    // Get book info
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select(`
        id,
        title,
        author,
        library_id,
        claimed_by_user_id,
        is_free_to_good_home
      `)
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Verify user is the claimer
    if (book.claimed_by_user_id !== user.id) {
      return NextResponse.json({ error: 'You can only confirm receipt of books you claimed' }, { status: 403 });
    }

    // Get pending transfer
    const { data: transfer, error: transferError } = await supabase
      .from('book_transfers')
      .select('*')
      .eq('book_id', bookId)
      .eq('status', 'pending')
      .single();

    if (transferError || !transfer) {
      return NextResponse.json({ error: 'No pending transfer found for this book' }, { status: 400 });
    }

    // Get claimer's library (should exist, but let's check)
    const { data: claimerLibrary, error: libraryError } = await supabase
      .from('libraries')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (libraryError || !claimerLibrary) {
      return NextResponse.json({ error: 'Your library not found' }, { status: 400 });
    }

    // Start transaction: Update book and transfer
    const now = new Date().toISOString();

    // 1. Update the book to transfer to new library
    const { error: bookUpdateError } = await supabase
      .from('books')
      .update({
        library_id: claimerLibrary.id,
        // Clear claim fields since transfer is complete
        claimed_by_user_id: null,
        claimed_at: null,
        claim_expires_at: null,
        is_free_to_good_home: false, // No longer free since it's been claimed
        updated_at: now
      })
      .eq('id', bookId);

    if (bookUpdateError) {
      console.error('Error updating book:', bookUpdateError);
      return NextResponse.json({ error: 'Failed to transfer book' }, { status: 500 });
    }

    // 2. Update transfer record as completed
    const { error: transferUpdateError } = await supabase
      .from('book_transfers')
      .update({
        status: 'completed',
        transfer_completed_at: now
      })
      .eq('id', transfer.id);

    if (transferUpdateError) {
      console.error('Error updating transfer:', transferUpdateError);
      // Book was already transferred, so don't fail the request
      // Just log the error
    }

    return NextResponse.json({ 
      message: 'Book transfer completed successfully',
      book_title: book.title,
      book_author: book.author
    });

  } catch (error) {
    console.error('PUT /api/books/[id]/confirm-received error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}