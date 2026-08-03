import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { questionReportsService } from '@/lib/services/question-reports.service';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, reason, comment } = body;

    if (!questionId || !reason) {
      return NextResponse.json({ error: 'Question ID and reason are required' }, { status: 400 });
    }

    const result = await questionReportsService.submitReport(questionId, reason, comment);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: result.message 
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/question-reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const reports = await questionReportsService.getAllReports();

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error in GET /api/question-reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}