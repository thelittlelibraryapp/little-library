// File: /src/app/api/books/[id]/upload-image/route.ts
// POST endpoint to upload book cover and spine images

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
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

    const params = await context.params;
    const bookId = params.id;

    // Verify book ownership
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select(`
        id,
        title,
        library:libraries!inner(owner_id)
      `)
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (book.library.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to upload images for this book' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const coverImage = formData.get('cover') as File | null;
    const spineImage = formData.get('spine') as File | null;

    if (!coverImage && !spineImage) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const results: any = {};

    // Upload cover image
    if (coverImage) {
      const coverFileName = `${user.id}/${bookId}/cover-${Date.now()}.${coverImage.name.split('.').pop()}`;
      
      const { data: coverData, error: coverUploadError } = await supabase.storage
        .from('book-images')
        .upload(coverFileName, coverImage, {
          cacheControl: '3600',
          upsert: true
        });

      if (coverUploadError) {
        console.error('Cover upload error:', coverUploadError);
        return NextResponse.json({ error: 'Failed to upload cover image' }, { status: 500 });
      }

      // Get public URL
      const { data: coverUrlData } = supabase.storage
        .from('book-images')
        .getPublicUrl(coverFileName);

      results.cover_image_url = coverUrlData.publicUrl;
    }

    // Upload spine image
    if (spineImage) {
      const spineFileName = `${user.id}/${bookId}/spine-${Date.now()}.${spineImage.name.split('.').pop()}`;
      
      const { data: spineData, error: spineUploadError } = await supabase.storage
        .from('book-images')
        .upload(spineFileName, spineImage, {
          cacheControl: '3600',
          upsert: true
        });

      if (spineUploadError) {
        console.error('Spine upload error:', spineUploadError);
        return NextResponse.json({ error: 'Failed to upload spine image' }, { status: 500 });
      }

      // Get public URL
      const { data: spineUrlData } = supabase.storage
        .from('book-images')
        .getPublicUrl(spineFileName);

      results.spine_image_url = spineUrlData.publicUrl;
    }

    // Update book record with image URLs
    const updateData: any = {};
    if (results.cover_image_url) {
      updateData.cover_image_url = results.cover_image_url;
      updateData.has_custom_cover = true;
    }
    if (results.spine_image_url) {
      updateData.spine_image_url = results.spine_image_url;
      updateData.has_custom_spine = true;
    }

    const { error: updateError } = await supabase
      .from('books')
      .update(updateData)
      .eq('id', bookId);

    if (updateError) {
      console.error('Book update error:', updateError);
      return NextResponse.json({ error: 'Failed to update book with image URLs' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Images uploaded successfully',
      book_id: bookId,
      ...results
    });

  } catch (error) {
    console.error('POST /api/books/[id]/upload-image error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}