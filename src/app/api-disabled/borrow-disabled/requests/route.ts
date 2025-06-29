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

    // Get requests where user is the owner (incoming) - pending requests have null checked_out_at
    const { data: incomingRequests } = await supabase
      .from('borrowing_history')
      .select(`
        id,
        book_id,
        created_at,
        borrower_notes,
        checked_out_at,
        book:book_id(title, author),
        borrower:borrower_id(first_name, last_name, email)
      `)
      .eq('library_owner_id', userId)
      .is('checked_out_at', null);

    // Get requests where user is the borrower (outgoing)
    const { data: outgoingRequests } = await supabase
      .from('borrowing_history')
      .select(`
        id,
        book_id,
        created_at,
        borrower_notes,
        checked_out_at,
        book:book_id(title, author),
        owner:library_owner_id(first_name, last_name, email)
      `)
      .eq('borrower_id', userId);

    // Transform data to match your BorrowRequest interface
    const requests = [
      ...(incomingRequests || []).map((req: any) => ({
        id: req.id,
        bookId: req.book_id,
        bookTitle: req.book?.title || 'Unknown',
        bookAuthor: req.book?.author || 'Unknown',
        borrowerId: req.borrower?.id,
        borrowerName: `${req.borrower?.first_name} ${req.borrower?.last_name}`,
        ownerId: userId,
        ownerName: 'You',
        status: req.checked_out_at ? 'approved' : 'pending',
        requestedAt: req.created_at,
        message: req.borrower_notes
      })),
      ...(outgoingRequests || []).map((req: any) => ({
        id: req.id,
        bookId: req.book_id,
        bookTitle: req.book?.title || 'Unknown',
        bookAuthor: req.book?.author || 'Unknown',
        borrowerId: userId,
        borrowerName: 'You',
        ownerId: req.owner?.id,
        ownerName: `${req.owner?.first_name} ${req.owner?.last_name}`,
        status: req.checked_out_at ? 'approved' : 'pending',
        requestedAt: req.created_at,
        message: req.borrower_notes
      }))
    ];

    return NextResponse.json({ requests });

  } catch (error) {
    console.error('Get requests error:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}