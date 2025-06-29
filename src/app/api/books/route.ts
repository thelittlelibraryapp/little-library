import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to create Supabase client INSIDE the function
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// GET - Fetch all books for a user
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    
    // Get user from auth header (simplified for now)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch books for this user
    const { data: books, error } = await supabase
      .from('books')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      books: books || []
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add a new book
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    
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

    // Get book data from request
    const bookData = await request.json();
    
    // Validate required fields
    if (!bookData.title || !bookData.author) {
      return NextResponse.json({ error: 'Title and author are required' }, { status: 400 });
    }

    // Insert new book
    const { data: book, error } = await supabase
      .from('books')
      .insert({
        title: bookData.title,
        author: bookData.author,
        isbn: bookData.isbn,
        genre: bookData.genre,
        publication_year: bookData.publicationYear,
        condition: bookData.condition || 'good',
        notes: bookData.notes,
        owner_id: user.id,
        status: 'available'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create book' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      book: book
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}