import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to create Supabase client
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// DELETE - Remove a book
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient();
    const bookId = params.id;
    
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's library
    const { data: library } = await supabase
      .from('libraries')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!library) {
      return NextResponse.json({ error: 'Library not found' }, { status: 404 });
    }

    // Verify book belongs to user's library
    const { data: book } = await supabase
      .from('books')
      .select('id, library_id')
      .eq('id', bookId)
      .eq('library_id', library.id)
      .single();

    if (!book) {
      return NextResponse.json({ error: 'Book not found or not owned by user' }, { status: 404 });
    }

    // Delete book_status first (if it exists) to avoid foreign key constraint
    await supabase
      .from('book_status')
      .delete()
      .eq('book_id', bookId);

    // Delete the book
    const { error: deleteError } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Book deleted successfully'
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a book (simple version)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient();
    const bookId = params.id;
    
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's library
    const { data: library } = await supabase
      .from('libraries')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!library) {
      return NextResponse.json({ error: 'Library not found' }, { status: 404 });
    }

    // Verify book belongs to user's library
    const { data: book } = await supabase
      .from('books')
      .select('id')
      .eq('id', bookId)
      .eq('library_id', library.id)
      .single();

    if (!book) {
      return NextResponse.json({ error: 'Book not found or not owned by user' }, { status: 404 });
    }

    // Get book data from request
    const bookData = await request.json();
    
    // Validate required fields
    if (!bookData.title || !bookData.author) {
      return NextResponse.json({ error: 'Title and author are required' }, { status: 400 });
    }

    // Update the book
    const { data: updatedBook, error: updateError } = await supabase
      .from('books')
      .update({
        title: bookData.title,
        author: bookData.author,
        isbn: bookData.isbn,
        genre: bookData.genre,
        publication_year: bookData.publicationYear,
        condition: bookData.condition || 'good',
        notes: bookData.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
    }

    // Transform response to match frontend interface
    const transformedBook = {
      id: updatedBook.id,
      title: updatedBook.title,
      author: updatedBook.author,
      isbn: updatedBook.isbn,
      genre: updatedBook.genre,
      publicationYear: updatedBook.publication_year,
      condition: updatedBook.condition,
      notes: updatedBook.notes,
      status: 'available', // Default status for now
      addedAt: updatedBook.added_at
    };

    return NextResponse.json({ 
      success: true,
      book: transformedBook
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}