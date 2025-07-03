// File: /src/app/api/books/[id]/mark-handed-off/route.ts
// PUT endpoint for owner to mark book as handed off to claimer

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

    // Get book with library info to verify ownership
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select(`
        id,
        title,
        library_id,
        claimed_by_user_id,
        is_free_to_good_home,
        claim_expires_at,
        library:libraries!inner(owner_id)
      `)
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Verify user owns this book
    if (book.library.owner_id !== user.id) {
      return NextResponse.json({ error: 'You can only mark your own books as handed off' }, { status: 403 });
    }

    // Verify book is free to good home and claimed
    if (!book.is_free_to_good_home) {
      return NextResponse.json({ error: 'Book is not marked as free to good home' }, { status: 400 });
    }

    if (!book.claimed_by_user_id) {
      return NextResponse.json({ error: 'Book has not been claimed by anyone' }, { status: 400 });
    }

    // Check if claim is still valid (not expired)
    if (book.claim_expires_at && new Date(book.claim_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Claim has expired' }, { status: 400 });
    }

    // Get claimer's library
    const { data: claimerLibrary, error: libraryError } = await supabase
      .from('libraries')
      .select('id')
      .eq('owner_id', book.claimed_by_user_id)
      .single();

    if (libraryError || !claimerLibrary) {
      return NextResponse.json({ error: 'Claimer library not found' }, { status: 400 });
    }

    // Check if transfer already exists
    const { data: existingTransfer, error: transferCheckError } = await supabase
      .from('book_transfers')
      .select('id, status')
      .eq('book_id', bookId)
      .eq('status', 'pending')
      .maybeSingle();

    if (transferCheckError) {
      console.error('Error checking existing transfer:', transferCheckError);
      return NextResponse.json({ error: 'Error checking transfer status' }, { status: 500 });
    }

    if (existingTransfer) {
      return NextResponse.json({ error: 'Transfer already pending for this book' }, { status: 400 });
    }

    // Create transfer record
    const { data: transfer, error: createTransferError } = await supabase
      .from('book_transfers')
      .insert([{
        book_id: bookId,
        from_library_id: book.library_id,
        to_library_id: claimerLibrary.id,
        transfer_initiated_at: new Date().toISOString(),
        status: 'pending'
      }])
      .select()
      .single();

    if (createTransferError) {
      console.error('Error creating transfer:', createTransferError);
      return NextResponse.json({ error: 'Failed to initiate transfer' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Book marked as handed off successfully',
      transfer_id: transfer.id,
      book_title: book.title
    });

  } catch (error) {
    console.error('PUT /api/books/[id]/mark-handed-off error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}