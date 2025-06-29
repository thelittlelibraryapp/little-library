import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { bookId, ownerId, borrowerId, message } = await request.json();

    if (!bookId || !ownerId || !borrowerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if request already exists (check by null checked_out_at = still pending)
    const { data: existing } = await supabase
      .from('borrowing_history')
      .select('id')
      .eq('book_id', bookId)
      .eq('borrower_id', borrowerId)
      .is('checked_out_at', null)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Request already sent' }, { status: 400 });
    }

    // Create borrow request
    const { data: borrowRequest, error } = await supabase
      .from('borrowing_history')
      .insert({
        book_id: bookId,
        borrower_id: borrowerId,
        library_owner_id: ownerId,
        checked_out_at: null,
        due_date: null,
        checked_in_at: null,
        was_overdue: false,
        borrower_rating: null,
        owner_rating: null,
        borrower_notes: message || null,
        owner_notes: null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, request: borrowRequest });

  } catch (error) {
    console.error('Borrow request error:', error);
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}