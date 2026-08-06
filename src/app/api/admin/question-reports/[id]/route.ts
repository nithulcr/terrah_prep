import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { authenticateAdmin } from '@/lib/supabase/server';
import { questionReportsService } from '@/lib/services/question-reports.service';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Admin API: PUT /api/admin/question-reports/[id] ===');
    
    // First authenticate using anon client
    const auth = await authenticateAdmin(request);
    
    if (auth.error) {
      console.error('Admin API: Auth failed:', auth.error);
      return NextResponse.json({ 
        success: false,
        error: auth.error,
        debug: { 
          userId: auth.user?.id,
          userEmail: auth.user?.email,
          profileId: auth.profile?.id,
          profileRole: auth.profile?.role
        }
      }, { status: auth.error === 'Unauthorized' ? 401 : 403 });
    }

    // Create admin client with SERVICE_ROLE_KEY to bypass RLS
    const adminSupabase = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    console.log('Admin API: Using SERVICE_ROLE_KEY - bypassing RLS');

    // Await params in Next.js 16
    const resolvedParams = await params;
    console.log('PUT [id]: params =', resolvedParams);
    console.log('PUT [id]: params.id =', resolvedParams.id);
    
    const body = await request.json();
    const { action, rewardPoints, updatedQuestion } = body;

    const reportId = parseInt(resolvedParams.id);

    // Validate report ID
    if (!Number.isFinite(reportId) || reportId <= 0) {
      console.error('Admin API: Invalid report ID:', resolvedParams.id);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid report ID',
        debug: { paramsId: resolvedParams.id, parsedId: reportId }
      }, { status: 400 });
    }

    console.log('Admin API: Action request:', { reportId, action, rewardPoints, hasUpdatedQuestion: !!updatedQuestion });

    if (action === 'approve') {
      if (!rewardPoints || rewardPoints < 1) {
        return NextResponse.json({ 
          success: false,
          error: 'Reward points must be at least 1' 
        }, { status: 400 });
      }

      // If question was updated, update it first
      if (updatedQuestion) {
        console.log('Admin API: Updating question with new data');
        
        // Get the report to find the question ID
        const { data: report, error: reportError } = await adminSupabase
          .from('question_reports')
          .select('question_id')
          .eq('id', reportId)
          .single();

        if (reportError || !report) {
          console.error('Admin API: Error fetching report:', reportError);
          return NextResponse.json({ 
            success: false,
            error: 'Report not found',
            debug: { reportError: reportError?.message }
          }, { status: 404 });
        }

        // Validate question_id
        const questionId = Number(report.question_id);
        console.log('Admin API: Question ID from report:', questionId, 'isFinite:', Number.isFinite(questionId));
        
        if (!Number.isFinite(questionId) || questionId <= 0) {
          console.error('Admin API: Invalid question_id:', report.question_id);
          return NextResponse.json({ 
            success: false,
            error: 'Invalid question ID',
            debug: { questionId: report.question_id }
          }, { status: 400 });
        }

        // Validate category_id if provided
        const categoryId = updatedQuestion.category_id ? Number(updatedQuestion.category_id) : null;
        if (categoryId !== null && (!Number.isFinite(categoryId) || categoryId <= 0)) {
          console.error('Admin API: Invalid category_id:', updatedQuestion.category_id);
          return NextResponse.json({ 
            success: false,
            error: 'Invalid category ID',
            debug: { categoryId: updatedQuestion.category_id }
          }, { status: 400 });
        }

        console.log('Admin API: Updating question:', questionId);
        
        const { error: questionUpdateError } = await adminSupabase
          .from('questions')
          .update({
            question: updatedQuestion.question,
            option_a: updatedQuestion.option_a,
            option_b: updatedQuestion.option_b,
            option_c: updatedQuestion.option_c,
            option_d: updatedQuestion.option_d,
            correct_option: updatedQuestion.correct_option,
            explanation: updatedQuestion.explanation,
            category_id: categoryId,
          })
          .eq('id', questionId);

        if (questionUpdateError) {
          console.error('Admin API: Error updating question:', questionUpdateError);
          return NextResponse.json({ 
            success: false,
            error: 'Failed to update question: ' + questionUpdateError.message,
            debug: { questionUpdateError: questionUpdateError.message }
          }, { status: 400 });
        }
        
        console.log('Admin API: Question updated successfully');
      }

      // Approve the report
      console.log('Admin API: Step 1 - Approving report and awarding points');
      const result = await questionReportsService.approveReport(
        adminSupabase,
        reportId,
        rewardPoints,
        auth.user.id
      );

      console.log('Admin API: Approve result:', { success: result.success, error: result.error });

      if (!result.success) {
        return NextResponse.json({ 
          success: false,
          error: result.error || 'Failed to approve report',
          debug: result.debug
        }, { status: 400 });
      }

      console.log('Admin API: Step 2 - Report approved, points awarded');
      
      // Always return success if the report was approved and points were awarded
      // Transaction creation failures are non-blocking and logged in the service
      return NextResponse.json({ 
        success: true, 
        message: 'Report approved and points awarded successfully' 
      });
    } else if (action === 'reject') {
      const result = await questionReportsService.rejectReport(
        adminSupabase,
        reportId,
        auth.user.id
      );

      console.log('Admin API: Reject result:', { success: result.success, error: result.error });

      if (!result.success) {
        return NextResponse.json({ 
          success: false,
          error: result.error || 'Failed to reject report',
          debug: result.debug
        }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Report rejected successfully' 
      });
    }

    return NextResponse.json({ 
      success: false,
      error: 'Invalid action' 
    }, { status: 400 });
  } catch (error: any) {
    console.error('Admin API: Unexpected error in PUT:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      debug: { message: error.message, stack: error.stack }
    }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Admin API: GET /api/admin/question-reports/[id] ===');
    
    // First authenticate using anon client
    const auth = await authenticateAdmin(request);
    
    if (auth.error) {
      console.error('Admin API: Auth failed:', auth.error);
      return NextResponse.json({ 
        success: false,
        error: auth.error,
        debug: { 
          userId: auth.user?.id,
          userEmail: auth.user?.email,
          profileId: auth.profile?.id,
          profileRole: auth.profile?.role
        }
      }, { status: auth.error === 'Unauthorized' ? 401 : 403 });
    }

    // Create admin client with SERVICE_ROLE_KEY to bypass RLS
    const adminSupabase = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    console.log('Admin API: Using SERVICE_ROLE_KEY - bypassing RLS');

    // Await params in Next.js 16
    const resolvedParams = await params;
    console.log('GET [id]: params =', resolvedParams);
    console.log('GET [id]: params.id =', resolvedParams.id);
    
    const reportId = parseInt(resolvedParams.id);

    // Validate report ID
    console.log('GET [id]: Parsing report ID from params:', resolvedParams.id);
    console.log('GET [id]: Parsed reportId:', reportId, 'isFinite:', Number.isFinite(reportId));
    
    if (!Number.isFinite(reportId) || reportId <= 0) {
      console.error('GET [id]: Invalid report ID:', resolvedParams.id);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid report ID',
        debug: { paramsId: resolvedParams.id, parsedId: reportId }
      }, { status: 400 });
    }

    console.log('GET [id]: Fetching report details for ID:', reportId);

    const result = await questionReportsService.getReportById(adminSupabase, reportId);
    
    console.log('GET [id]: Service result:', { 
      success: result.success, 
      hasReport: !!result.report,
      reportId: result.report?.id,
      error: result.error 
    });

    console.log('Admin API: Service result:', { success: result.success, error: result.error });

    if (!result.success) {
      return NextResponse.json({ 
        success: false,
        error: result.error || 'Report not found',
        debug: result.debug
      }, { status: 404 });
    }

    console.log('Admin API: Success - returning report details');
    
    return NextResponse.json({ 
      success: true,
      report: result.report
    });
  } catch (error: any) {
    console.error('Admin API: Unexpected error in GET [id]:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      debug: { message: error.message, stack: error.stack }
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Admin API: DELETE /api/admin/question-reports/[id] ===');
    
    // First authenticate using anon client
    const auth = await authenticateAdmin(request);
    
    if (auth.error) {
      console.error('Admin API: Auth failed:', auth.error);
      return NextResponse.json({ 
        success: false,
        error: auth.error,
        debug: { 
          userId: auth.user?.id,
          userEmail: auth.user?.email,
          profileId: auth.profile?.id,
          profileRole: auth.profile?.role
        }
      }, { status: auth.error === 'Unauthorized' ? 401 : 403 });
    }

    // Create admin client with SERVICE_ROLE_KEY to bypass RLS
    const adminSupabase = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    console.log('Admin API: Using SERVICE_ROLE_KEY - bypassing RLS');

    // Await params in Next.js 16
    const resolvedParams = await params;
    const reportId = parseInt(resolvedParams.id);

    // Validate report ID
    console.log('DELETE [id]: Deleting report ID:', reportId);
    
    if (!Number.isFinite(reportId) || reportId <= 0) {
      console.error('DELETE [id]: Invalid report ID:', resolvedParams.id);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid report ID',
        debug: { paramsId: resolvedParams.id, parsedId: reportId }
      }, { status: 400 });
    }

    // Delete the report
    const { error: deleteError } = await adminSupabase
      .from('question_reports')
      .delete()
      .eq('id', reportId);

    if (deleteError) {
      console.error('DELETE [id]: Error deleting report:', deleteError);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to delete report',
        debug: { deleteError: deleteError.message }
      }, { status: 400 });
    }

    console.log('DELETE [id]: Report deleted successfully');
    
    return NextResponse.json({ 
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error: any) {
    console.error('Admin API: Unexpected error in DELETE:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      debug: { message: error.message, stack: error.stack }
    }, { status: 500 });
  }
}
