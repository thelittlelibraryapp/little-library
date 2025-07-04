// src/app/api/books/import/goodreads/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

    // Parse CSV data from request body
    const { csvData, importOptions } = await request.json();
    
    const results = {
      total: csvData.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    // Process each book
    for (const row of csvData) {
      try {
        // Skip if not owned (based on "Owned Copies" column)
        if (importOptions.onlyOwned && (!row["Owned Copies"] || parseInt(row["Owned Copies"]) === 0)) {
          results.skipped++;
          continue;
        }

        // Skip if already exists (check by ISBN or title+author)
        const isbn = row["ISBN13"] || row["ISBN"];
        let existingBook = null;
        
        if (isbn) {
          const { data: existing } = await supabase
            .from('books')
            .select('id')
            .eq('library_id', library.id)
            .eq('isbn', isbn)
            .single();
          existingBook = existing;
        }
        
        if (!existingBook && row["Title"] && row["Author"]) {
          const { data: existing } = await supabase
            .from('books')
            .select('id')
            .eq('library_id', library.id)
            .eq('title', row["Title"])
            .eq('author', row["Author"])
            .single();
          existingBook = existing;
        }

        if (existingBook) {
          results.skipped++;
          continue;
        }

        // Map Goodreads shelf to genre
        const mapGenre = (bookshelves) => {
          if (!bookshelves) return null;
          const shelves = bookshelves.toLowerCase();
          
          if (shelves.includes('fiction')) return 'fiction';
          if (shelves.includes('non-fiction') || shelves.includes('nonfiction')) return 'non-fiction';
          if (shelves.includes('mystery')) return 'mystery';
          if (shelves.includes('romance')) return 'romance';
          if (shelves.includes('science-fiction') || shelves.includes('sci-fi')) return 'science-fiction';
          if (shelves.includes('fantasy')) return 'fantasy';
          if (shelves.includes('biography')) return 'biography';
          if (shelves.includes('history')) return 'history';
          if (shelves.includes('self-help')) return 'self-help';
          if (shelves.includes('business')) return 'business';
          if (shelves.includes('technology')) return 'technology';
          
          return 'other';
        };

        // Create comprehensive notes
        const createNotes = (row) => {
          let notes = "📚 Imported from Goodreads\n";
          
          if (row["My Rating"] && parseInt(row["My Rating"]) > 0) {
            notes += `⭐ Rating: ${row["My Rating"]}/5 stars\n`;
          }
          
          if (row["Date Read"]) {
            notes += `📅 Read: ${row["Date Read"]}\n`;
          }
          
          if (row["Binding"]) {
            notes += `📖 Format: ${row["Binding"]}\n`;
          }
          
          if (row["Bookshelves"]) {
            notes += `🏷️ Shelves: ${row["Bookshelves"]}\n`;
          }
          
          if (row["My Review"]) {
            notes += `📝 Review: ${row["My Review"]}\n`;
          }
          
          if (row["Private Notes"]) {
            notes += `💭 Notes: ${row["Private Notes"]}\n`;
          }
          
          return notes.trim();
        };

        // Prepare book data
        const bookData = {
          library_id: library.id,
          title: row["Title"] || 'Unknown Title',
          author: row["Author"] || 'Unknown Author',
          isbn: isbn || null,
          genre: mapGenre(row["Bookshelves"]),
          publication_year: row["Year Published"] ? parseInt(row["Year Published"]) : null,
          condition: 'good', // Default for imports
          notes: createNotes(row),
          added_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Create book
        const { data: book, error: bookError } = await supabase
          .from('books')
          .insert([bookData])
          .select()
          .single();

        if (bookError) {
          results.errors.push(`${row["Title"]}: ${bookError.message}`);
          results.failed++;
          continue;
        }

        // Create book status
        await supabase
          .from('book_status')
          .insert([{
            book_id: book.id,
            status: 'available',
            created_at: new Date().toISOString()
          }]);

        results.successful++;

      } catch (error) {
        results.errors.push(`${row["Title"] || 'Unknown'}: ${error.message}`);
        results.failed++;
      }
    }

    return NextResponse.json({ results }, { status: 200 });

  } catch (error) {
    console.error('Goodreads import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}