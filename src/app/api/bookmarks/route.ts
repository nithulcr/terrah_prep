// ============================================
// Terrah Qbank - BOOKMARKS API
// ============================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { createServerClient } from '@/lib/supabase/server';

// GET /api/bookmarks - Get user's bookmarks
export async function GET(request: Request) {
  try {
    // Try to get token from Authorization header first
    const authHeader = request.headers.get('Authorization');
    let supabase;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      // Create Supabase client with token from client
      supabase = createClient(
        config.supabase.url,
        config.supabase.anonKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
          global: {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          },
        }
      );
    } else {
      // Fall back to cookie-based auth (for server components)
      supabase = await createServerClient();
    }
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's bookmarks with question details
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select('*, question:questions(*, category:categories(*), batch:batches(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (bookmarksError) {
      console.error('Error fetching bookmarks:', bookmarksError);
      return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
    }

    return NextResponse.json({ bookmarks: bookmarks ?? [] });
  } catch (error) {
    console.error('Error in GET /api/bookmarks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/bookmarks - Add a bookmark
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    // Try to get token from Authorization header first
    const authHeader = request.headers.get('Authorization');
    let supabase;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      // Create Supabase client with token from client
      supabase = createClient(
        config.supabase.url,
        config.supabase.anonKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
          global: {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          },
        }
      );
    } else {
      // Fall back to cookie-based auth (for server components)
      supabase = await createServerClient();
    }
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add bookmark
    const { data: bookmark, error: bookmarkError } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        question_id: questionId,
      })
      .select()
      .single();

    if (bookmarkError) {
      if (bookmarkError.code === '23505') {
        return NextResponse.json({ error: 'Question already bookmarked' }, { status: 409 });
      }
      console.error('Error adding bookmark:', bookmarkError);
      return NextResponse.json({ error: 'Failed to add bookmark' }, { status: 500 });
    }

    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/bookmarks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/bookmarks - Remove a bookmark
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    // Try to get token from Authorization header first
    const authHeader = request.headers.get('Authorization');
    let supabase;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      // Create Supabase client with token from client
      supabase = createClient(
        config.supabase.url,
        config.supabase.anonKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
          global: {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          },
        }
      );
    } else {
      // Fall back to cookie-based auth (for server components)
      supabase = await createServerClient();
    }
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove bookmark
    const { error: deleteError } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('question_id', questionId);

    if (deleteError) {
      console.error('Error removing bookmark:', deleteError);
      return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/bookmarks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}