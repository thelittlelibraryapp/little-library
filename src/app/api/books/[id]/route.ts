// src/app/api/books/[id]/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// PUT - Update book
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const bookId = params.id;
    
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

    // Verify book belongs to user
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select(`
        *,
        library:libraries!inner(owner_id)
      `)
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (book.library.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { title, author, isbn, genre, publicationYear, condition, notes } = body;

    // Validate required fields
    if (!title || !author || !condition) {
      return NextResponse.json({ error: 'Title, author, and condition are required' }, { status: 400 });
    }

    // Update book
    const { data: updatedBook, error: updateError } = await supabase
      .from('books')
      .update({
        title,
        author,
        isbn: isbn || null,
        genre: genre || null,
        publication_year: publicationYear || null,
        condition,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Get current status
    const { data: statusData } = await supabase
      .from('book_status')
      .select('status')
      .eq('book_id', bookId)
      .single();

    // Transform response
    const transformedBook = {
      id: updatedBook.id,
      title: updatedBook.title,
      author: updatedBook.author,
      isbn: updatedBook.isbn,
      genre: updatedBook.genre,
      publicationYear: updatedBook.publication_year,
      condition: updatedBook.condition,
      notes: updatedBook.notes,
      status: statusData?.status || 'available',
      addedAt: updatedBook.created_at
    };

    return NextResponse.json({ book: transformedBook });

  } catch (error) {
    console.error('PUT /api/books/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete book
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const bookId = params.id;
    
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

    // Verify book belongs to user
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select(`
        *,
        library:libraries!inner(owner_id)
      `)
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (book.library.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete book status first (foreign key constraint)
    await supabase
      .from('book_status')
      .delete()
      .eq('book_id', bookId);

    // Delete book
    const { error: deleteError } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Book deleted successfully' });

  } catch (error) {
    console.error('DELETE /api/books/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}