// ============================================
// TERRAH PREP - BOOKMARKS API
// ============================================

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { usageService } from '@/lib/services/usage.service';

// GET /api/bookmarks - Get user's bookmarks
export async function GET() {
  try {
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has bookmark permission
    const { plan } = await usageService.getUserUsageWithPlan(supabase, user.id);
    
    if (!plan || !plan.allow_bookmarks) {
      return NextResponse.json(
        { error: 'Bookmarks are not available in your current plan' },
        { status: 403 }
      );
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
    const supabase = await createServerClient();
    const body = await request.json();
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has bookmark permission
    const { plan } = await usageService.getUserUsageWithPlan(supabase, user.id);
    
    if (!plan || !plan.allow_bookmarks) {
      return NextResponse.json(
        { error: 'Bookmarks are not available in your current plan' },
        { status: 403 }
      );
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
    const supabase = await createServerClient();
    const body = await request.json();
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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