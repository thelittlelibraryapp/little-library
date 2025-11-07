import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Helper function to fetch genre from Google Books API
async function fetchGenreFromGoogle(isbn: string): Promise<string | undefined> {
  if (!isbn) return undefined;

  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
    );
    const data = await response.json();

    if (data.items && data.items[0]?.volumeInfo?.categories) {
      const category = data.items[0].volumeInfo.categories[0];

      // Map Google Books categories to our genre list
      const genreMapping: Record<string, string> = {
        'fiction': 'fiction',
        'literary fiction': 'fiction',
        'science fiction': 'science-fiction',
        'fantasy': 'fantasy',
        'mystery': 'mystery',
        'thriller': 'mystery',
        'romance': 'romance',
        'biography': 'biography',
        'autobiography': 'biography',
        'history': 'history',
        'self-help': 'self-help',
        'business': 'business',
        'non-fiction': 'non-fiction'
      };

      const lowerCategory = category.toLowerCase();
      for (const [key, value] of Object.entries(genreMapping)) {
        if (lowerCategory.includes(key)) {
          return value;
        }
      }

      return 'other';
    }
  } catch (error) {
    console.error('Error fetching genre from Google Books:', error);
  }
  return undefined;
}

// POST - Update missing genres for all books
export async function POST(request: NextRequest) {
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

    // Get user's library
    const { data: library, error: libraryError } = await supabase
      .from('libraries')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (libraryError || !library) {
      return NextResponse.json({ error: 'Library not found' }, { status: 404 });
    }

    // Get all books with missing genres (where genre is null or empty)
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, isbn, genre')
      .eq('library_id', library.id)
      .or('genre.is.null,genre.eq.');

    if (booksError) {
      return NextResponse.json({ error: booksError.message }, { status: 500 });
    }

    let updatedCount = 0;
    let failedCount = 0;

    // Process each book with missing genre
    for (const book of books || []) {
      if (book.isbn) {
        try {
          const genre = await fetchGenreFromGoogle(book.isbn);

          if (genre) {
            // Update the book with the fetched genre
            const { error: updateError } = await supabase
              .from('books')
              .update({ genre })
              .eq('id', book.id);

            if (updateError) {
              console.error(`Failed to update genre for book ${book.id}:`, updateError);
              failedCount++;
            } else {
              updatedCount++;
            }
          } else {
            failedCount++;
          }

          // Add a small delay to avoid hitting Google Books API rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error processing book ${book.id}:`, error);
          failedCount++;
        }
      } else {
        failedCount++;
      }
    }

    return NextResponse.json({
      message: `Updated ${updatedCount} books. ${failedCount} books couldn't be updated.`,
      updatedCount,
      failedCount,
      totalProcessed: (books || []).length
    }, { status: 200 });

  } catch (error) {
    console.error('POST /api/books/update-genres error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
