import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: userId } = await params;  // TO THIS

    // Get user's library
    const { data: library } = await supabase
      .from('libraries')
      .select('id')
      .eq('owner_id', userId)
      .single();

    if (!library) {
      return NextResponse.json({ books: [] });
    }

    // Get available books
    const { data: books, error } = await supabase
      .from('books')
      .select(`
        *,
        book_status!inner(status)
      `)
      .eq('library_id', library.id)
      .eq('book_status.status', 'available')
      .order('added_at', { ascending: false });

    if (error) throw error;

    // Transform to match your Book interface
    const transformedBooks = books?.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      genre: book.genre,
      publicationYear: book.publication_year,
      condition: book.condition,
      notes: book.notes,
      status: book.book_status[0]?.status || 'available',
      addedAt: book.added_at
    })) || [];

    return NextResponse.json({ books: transformedBooks });

  } catch (error) {
    console.error('Get user books error:', error);
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
  }
}