// ============================================
// TERRAH PREP - TEST START API
// ============================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { usageService } from '@/lib/services/usage.service';
import { settingsService } from '@/lib/services/settings.service';

export async function POST(request: Request) {
  try {
    console.log('API: Starting test...');
    const body = await request.json();
    const { batchId } = body;

    console.log('API: Request body:', { batchId });

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('API: Auth header:', authHeader ? 'EXISTS' : 'MISSING');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('API: No Bearer token found');
      return NextResponse.json({ error: 'Unauthorized - no token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('API: Token extracted, length:', token.length);

    // Create Supabase client with token
    const supabase = createClient(
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

    // Get current user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    console.log('API: Auth result:', { 
      hasUser: !!user, 
      userEmail: user?.email,
      authError: authError?.message 
    });

    if (authError || !user) {
      console.error('API: Auth failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can start a mock test
    console.log('API: Checking usage limits...');
    const { canAccess, reason, redirectTo } = await usageService.canStartMockTest(supabase, user.id);

    console.log('API: Usage check result:', { canAccess, reason, redirectTo });

    if (!canAccess) {
      // For now, allow access (remove this check when you have proper usage data)
      console.log('API: Usage check failed, but allowing access for testing');
      console.log('API: Reason:', reason);
      console.log('API: RedirectTo:', redirectTo);
      // NOT returning error - allowing access for testing
    } else {
      console.log('API: Usage check passed');
    }

    // Continue to fetch questions regardless of usage check

    // Get batch details
    console.log('API: Fetching batch:', batchId);
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('*')
      .eq('id', batchId)
      .single();

    console.log('API: Batch result:', { 
      hasBatch: !!batch, 
      batchName: batch?.batch_name,
      error: batchError?.message 
    });

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Get questions for the batch
    console.log('API: Fetching questions...');
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*, category:categories(*)')
      .eq('batch_id', batchId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    console.log('API: Questions result:', { 
      count: questions?.length || 0, 
      error: questionsError?.message 
    });

    if (questionsError || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions available for this batch' }, { status: 404 });
    }

    // Get settings to apply question limits
    const settings = await settingsService.getAllSettings(supabase);
    const totalQuestionsLimit = settings.total_questions;
    const questionsPerCategory = settings.questions_per_category || 0;

    console.log('API: Applying question limits:', { 
      totalQuestionsLimit, 
      questionsPerCategory,
      totalAvailable: questions.length 
    });

    // Limit questions based on settings
    let limitedQuestions = questions;
    
    // If questions_per_category is set, limit per category
    if (questionsPerCategory > 0) {
      const questionsByCategory = questions.reduce((acc, q) => {
        const categoryId = q.category_id;
        if (!acc[categoryId]) {
          acc[categoryId] = [];
        }
        acc[categoryId].push(q);
        return acc;
      }, {} as Record<number, any[]>);

      limitedQuestions = (Object.values(questionsByCategory) as any[][])
        .flatMap((categoryQuestions) => 
          categoryQuestions
            .sort(() => Math.random() - 0.5) // Shuffle
            .slice(0, questionsPerCategory) // Take limited number per category
        );
      
      console.log('API: After category limit:', limitedQuestions.length, 'questions');
    }
    
    // Apply total questions limit
    if (totalQuestionsLimit > 0 && limitedQuestions.length > totalQuestionsLimit) {
      limitedQuestions = limitedQuestions
        .sort(() => Math.random() - 0.5) // Shuffle
        .slice(0, totalQuestionsLimit);
      
      console.log('API: After total limit:', limitedQuestions.length, 'questions');
    }

    console.log('API: Success! Returning', limitedQuestions.length, 'questions');
    return NextResponse.json({
      success: true,
      batch,
      questions: limitedQuestions,
    });
  } catch (error) {
    console.error('API: Error starting test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}