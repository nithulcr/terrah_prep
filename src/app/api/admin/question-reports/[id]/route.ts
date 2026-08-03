import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { questionReportsService } from '@/lib/services/question-reports.service';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, rewardPoints } = body;

    const reportId = parseInt(params.id);

    if (action === 'approve') {
      if (!rewardPoints || rewardPoints < 1) {
        return NextResponse.json({ error: 'Reward points must be at least 1' }, { status: 400 });
      }

      const result = await questionReportsService.approveReport(reportId, rewardPoints);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Report approved and points awarded' 
      });
    } else if (action === 'reject') {
      const result = await questionReportsService.rejectReport(reportId);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Report rejected' 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in PUT /api/admin/question-reports/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const reportId = parseInt(params.id);

    const { data: report, error } = await supabase
      .from('question_reports')
      .select(`
        *,
        question:questions(question, category:categories(name)),
        user:profiles(email, full_name)
      `)
      .eq('id', reportId)
      .single();

    if (error || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error in GET /api/admin/question-reports/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}