// File: /api/borrow/requests/[id]/route.ts
// PUT endpoint to approve or decline borrow requests

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
    const requestId = id;
    const body = await request.json();
    const { action, userId } = body; // action: 'approve' or 'decline'

    // Get the borrow request
    const { data: borrowRequest, error: requestError } = await supabase
      .from('borrow_requests')
      .select(`
        *,
        books!inner(
          *,
          libraries!inner(owner_id)
        )
      `)
      .eq('id', requestId)
      .eq('status', 'pending')
      .single();

    if (requestError || !borrowRequest) {
      return NextResponse.json({ error: 'Borrow request not found or already processed' }, { status: 404 });
    }

    // Verify the user owns the book
    if (borrowRequest.books.libraries.owner_id !== userId) {
      return NextResponse.json({ error: 'You do not own this book' }, { status: 403 });
    }

    if (action === 'approve') {
      // Approve the request
      const { error: updateRequestError } = await supabase
        .from('borrow_requests')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateRequestError) {
        return NextResponse.json({ error: updateRequestError.message }, { status: 500 });
      }

      // Update book status to borrowed
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 2 weeks from now

      const { error: statusError } = await supabase
        .from('book_status')
        .update({
          status: 'borrowed',
          borrower_id: borrowRequest.requester_id,
          checked_out_at: new Date().toISOString(),
          due_date: dueDate.toISOString(),
          notes: 'Approved by owner'
        })
        .eq('book_id', borrowRequest.book_id);

      if (statusError) {
        return NextResponse.json({ error: statusError.message }, { status: 500 });
      }

      // Create borrowing history record
      const { error: historyError } = await supabase
        .from('borrowing_history')
        .insert({
          book_id: borrowRequest.book_id,
          borrower_id: borrowRequest.requester_id,
          owner_id: borrowRequest.books.libraries.owner_id,
          checked_out_at: new Date().toISOString(),
          due_date: dueDate.toISOString(),
          owner_notes: 'Approved by owner'
        });

      if (historyError) {
        console.error('Failed to create borrowing history:', historyError);
        // Don't fail the request, just log the error
      }

      return NextResponse.json({ 
        message: 'Borrow request approved successfully',
        status: 'approved'
      }, { status: 200 });

    } else if (action === 'decline') {
      // Decline the request
      const { error: updateRequestError } = await supabase
        .from('borrow_requests')
        .update({ 
          status: 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateRequestError) {
        return NextResponse.json({ error: updateRequestError.message }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Borrow request declined successfully',
        status: 'declined'
      }, { status: 200 });

    } else {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "decline"' }, { status: 400 });
    }

  } catch (error) {
    console.error('PUT /api/borrow/requests/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}