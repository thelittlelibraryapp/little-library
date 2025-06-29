import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: requestId } = await params;
    const { action, userId } = await request.json();

    if (!requestId || !action || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the request to verify ownership
    const { data: borrowRequest, error: fetchError } = await supabase
      .from('borrowing_history')
      .select('*')
      .eq('id', requestId)
      .eq('library_owner_id', userId) // Only owner can approve/decline
      .is('checked_out_at', null) // Only pending requests
      .single();

    if (fetchError || !borrowRequest) {
      return NextResponse.json({ error: 'Request not found or unauthorized' }, { status: 404 });
    }

    if (action === 'approved') {
      // Set checked_out_at to current time and add 2 week due date
      const now = new Date();
      const dueDate = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000)); // 2 weeks

      const { error: updateError } = await supabase
        .from('borrowing_history')
        .update({
          checked_out_at: now.toISOString(),
          due_date: dueDate.toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Update book status to borrowed
      const { error: bookError } = await supabase
        .from('book_status')
        .update({ status: 'borrowed' })
        .eq('book_id', borrowRequest.book_id);

      if (bookError) console.error('Failed to update book status:', bookError);

      return NextResponse.json({ 
        success: true, 
        message: 'Request approved! Book is now borrowed.',
        dueDate: dueDate.toISOString()
      });

    } else if (action === 'declined') {
      // Delete the request
      const { error: deleteError } = await supabase
        .from('borrowing_history')
        .delete()
        .eq('id', requestId);

      if (deleteError) throw deleteError;

      return NextResponse.json({ 
        success: true, 
        message: 'Request declined and removed.' 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Approve/decline error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}