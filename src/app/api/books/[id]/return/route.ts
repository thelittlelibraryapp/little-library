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

    const { id } = await params;  // ← Fix: await params
    const bookId = id;
    const body = await request.json();
    const { userId } = body;

    // Verify book is currently borrowed by this user
    const { data: currentStatus, error: statusCheckError } = await supabase
      .from('book_status')
      .select('status, borrower_id')
      .eq('book_id', bookId)
      .single();

    if (statusCheckError || !currentStatus) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (currentStatus.status !== 'borrowed') {
      return NextResponse.json({ error: 'Book is not currently borrowed' }, { status: 400 });
    }

    if (currentStatus.borrower_id !== userId) {
      return NextResponse.json({ error: 'You are not the borrower of this book' }, { status: 403 });
    }

    // Update book status to return_pending
    const { error: statusError } = await supabase
      .from('book_status')
      .update({ 
        status: 'return_pending',
        notes: 'Book marked as returned by borrower, awaiting owner confirmation'
      })
      .eq('book_id', bookId);

    if (statusError) {
      return NextResponse.json({ error: statusError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Book marked as returned successfully',
      status: 'return_pending'
    }, { status: 200 });

  } catch (error) {
    console.error('PUT /api/books/[id]/return error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}