import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { questionReportsService } from '@/lib/services/question-reports.service';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient(request);
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        debug: { authError: authError?.message }
      }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, reason, comment } = body;

    if (!questionId || !reason) {
      return NextResponse.json({ 
        success: false,
        error: 'Question ID and reason are required' 
      }, { status: 400 });
    }

    const result = await questionReportsService.submitReport(
      supabase,
      questionId,
      reason,
      comment,
      user.id
    );

    if (!result.success) {
      return NextResponse.json({ 
        success: false,
        error: result.error,
        debug: result.debug
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: result.message 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/question-reports:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      debug: { message: error.message, stack: error.stack }
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient(request);
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ 
        success: false,
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const result = await questionReportsService.getAllReports(supabase);

    if (!result.success) {
      return NextResponse.json({ 
        success: false,
        error: result.error,
        debug: result.debug
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      reports: result.reports,
      total: result.total
    });
  } catch (error: any) {
    console.error('Error in GET /api/question-reports:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      debug: { message: error.message }
    }, { status: 500 });
  }
}