// File: /api/books/[id]/cancel-return/route.ts
// PUT endpoint for borrower to cancel their return request

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

    // Verify book is in return_pending status
    const { data: currentStatus, error: statusCheckError } = await supabase
      .from('book_status')
      .select('status, borrower_id')
      .eq('book_id', bookId)
      .single();

    if (statusCheckError || !currentStatus) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (currentStatus.status !== 'return_pending') {
      return NextResponse.json({ error: 'Book is not pending return' }, { status: 400 });
    }

    if (currentStatus.borrower_id !== userId) {
      return NextResponse.json({ error: 'You are not the borrower of this book' }, { status: 403 });
    }

    // Update book status back to borrowed
    const { error: statusError } = await supabase
      .from('book_status')
      .update({ 
        status: 'borrowed',
        notes: 'Return request cancelled by borrower'
      })
      .eq('book_id', bookId);

    if (statusError) {
      return NextResponse.json({ error: statusError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Return request cancelled successfully',
      status: 'borrowed'
    }, { status: 200 });

  } catch (error) {
    console.error('PUT /api/books/[id]/cancel-return error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}