import { SupabaseClient } from '@supabase/supabase-js';
import { QuestionReport } from '@/types';
import { notificationService } from './notification.service';

export const questionReportsService = {
  /**
   * Submit a new question report
   */
  async submitReport(
    supabase: SupabaseClient,
    questionId: number,
    reason: string,
    comment?: string,
    userId?: string
  ): Promise<{ success: boolean; message?: string; error?: string; debug?: any }> {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      // Verify question exists
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .select('id')
        .eq('id', questionId)
        .single();

      if (questionError || !question) {
        return { 
          success: false, 
          error: 'Question not found',
          debug: { questionError: questionError?.message, questionId }
        };
      }

      // Check for duplicate report
      const { data: existingReport, error: duplicateError } = await supabase
        .from('question_reports')
        .select('id')
        .eq('question_id', questionId)
        .eq('user_id', userId)
        .single();

      if (existingReport) {
        return { 
          success: false, 
          error: 'You have already reported this question.',
          debug: { existingReportId: existingReport.id }
        };
      }

      // Check daily limit (10 reports per day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: reportsToday, error: countError } = await supabase
        .from('question_reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today.toISOString());

      if (countError) {
        console.error('Error checking daily limit:', countError);
      }

      if (reportsToday && reportsToday >= 10) {
        return { 
          success: false, 
          error: 'You have reached the maximum of 10 reports per day.',
          debug: { reportsToday }
        };
      }

      // Submit report
      const { data: newReport, error: insertError } = await supabase
        .from('question_reports')
        .insert({
          question_id: questionId,
          user_id: userId,
          reason,
          comment: comment || null,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error submitting report:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        });
        
        return { 
          success: false, 
          error: insertError.message || 'Failed to submit report',
          debug: {
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
          }
        };
      }

      // Send notification to all admins
      try {
        // Get all admin users
        const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin');

        if (admins && admins.length > 0) {
          const adminIds = admins.map(admin => admin.id);
          
          // Create notifications for all admins
          await notificationService.createBulkNotifications(supabase, adminIds, {
            title: 'New Question Report',
            message: `User reported Question #${questionId}\n\nReason: ${reason}${comment ? `\n\nComment: ${comment}` : ''}`,
            type: 'report',
            action_url: `/admin/question-reports/${newReport.id}`,
            data: {
              report_id: newReport.id,
              question_id: questionId,
              user_id: userId,
            },
          });
        }
      } catch (notificationError) {
        console.error('Error sending notification to admins:', notificationError);
        // Don't fail the report submission if notification fails
      }

      return { 
        success: true, 
        message: 'Report submitted successfully! Thank you for helping us improve.',
        debug: { reportId: newReport.id }
      };
    } catch (error: any) {
      console.error('Error in submitReport:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to submit report',
        debug: { stack: error.stack }
      };
    }
  },

  /**
   * Get all reports (admin only)
   */
  async getAllReports(
    supabase: SupabaseClient,
    filters?: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ success: boolean; reports?: QuestionReport[]; error?: string; debug?: any; total?: number }> {
    try {
      console.log('getAllReports: Loading ALL reports for admin - NO user filtering');
      console.log('getAllReports: Filters:', filters);
      
      let query = supabase
        .from('question_reports')
        .select(`
          *,
          question:questions(
            question, 
            option_a,
            option_b,
            option_c,
            option_d,
            correct_option,
            explanation,
            category:categories(id, name)
          ),
          user:profiles!question_reports_user_id_fkey(email, full_name),
          reviewer:profiles!question_reports_reviewed_by_fkey(email, full_name)
        `, { count: 'exact' });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        console.log('getAllReports: Filtering by status:', filters.status);
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        console.log('getAllReports: Filtering by search:', filters.search);
        query = query.or(`question.question.ilike.%${filters.search}%,user.email.ilike.%${filters.search}%,reason.ilike.%${filters.search}%`);
      }

      // Pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      console.log('getAllReports: Pagination:', { page, limit, from, to });

      query = query.order('created_at', { ascending: false }).range(from, to);

      console.log('getAllReports: Executing query...');
      const { data, error, count } = await query;
      
      console.log('getAllReports: Query result:', {
        hasData: !!data,
        dataLength: data?.length || 0,
        count: count || 0,
        error: error?.message,
        ids: data?.map(r => r.id),
        userIds: data?.map(r => r.user_id)
      });

      if (error) {
        console.error('Error fetching reports:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        
        return { 
          success: false, 
          error: error.message || 'Failed to fetch reports',
          debug: {
            code: error.code,
            details: error.details,
            hint: error.hint,
          }
        };
      }

      // Transform data to ensure user and reviewer are always present
      const reports = (data || []).map((report: any) => ({
        ...report,
        user: report.user || { email: 'Unknown', full_name: 'Unknown' },
        reviewer: report.reviewer || null,
      }));

      console.log('getAllReports: Final result:', {
        totalReports: reports.length,
        ids: reports.map(r => r.id),
        users: reports.map(r => r.user_id)
      });

      return { 
        success: true, 
        reports,
        total: count || 0,
      };
    } catch (error: any) {
      console.error('Error in getAllReports:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch reports',
        debug: { stack: error.stack }
      };
    }
  },

  /**
   * Get report by ID (admin only)
   */
  async getReportById(
    supabase: SupabaseClient,
    reportId: number
  ): Promise<{ success: boolean; report?: QuestionReport; error?: string; debug?: any }> {
    try {
      // Validate reportId
      if (!Number.isFinite(reportId) || reportId <= 0) {
        console.error('getReportById: Invalid reportId:', reportId);
        return { 
          success: false, 
          error: 'Invalid report ID',
          debug: { reportId }
        };
      }

      console.log('getReportById: Fetching report:', reportId);
      
      const { data, error } = await supabase
        .from('question_reports')
        .select(`
          *,
          question:questions(
            id,
            question, 
            option_a,
            option_b,
            option_c,
            option_d,
            correct_option,
            explanation,
            category:categories(id, name)
          ),
          user:profiles!question_reports_user_id_fkey(id, email, full_name),
          reviewer:profiles!question_reports_reviewed_by_fkey(id, email, full_name)
        `)
        .eq('id', reportId)
        .single();

      if (error || !data) {
        console.error('Error fetching report:', {
          code: error?.code,
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
        });
        
        return { 
          success: false, 
          error: error?.message || 'Report not found',
          debug: {
            code: error?.code,
            details: error?.details,
            reportId,
          }
        };
      }

      // Transform data to ensure user and reviewer are always present
      const report = {
        ...data,
        user: data.user || { email: 'Unknown', full_name: 'Unknown' },
        reviewer: data.reviewer || null,
      };
      
      return { success: true, report };
    } catch (error: any) {
      console.error('Error in getReportById:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch report',
        debug: { stack: error.stack }
      };
    }
  },

  /**
   * Approve a report and reward points (admin only)
   */
  async approveReport(
    supabase: SupabaseClient,
    reportId: number,
    rewardPoints: number,
    adminId: string
  ): Promise<{ success: boolean; error?: string; debug?: any }> {
    try {
      // Validate all inputs
      console.log('approveReport: Validating inputs:', { reportId, rewardPoints, adminId });
      
      if (!Number.isFinite(reportId) || reportId <= 0) {
        console.error('approveReport: Invalid reportId:', reportId);
        return { success: false, error: 'Invalid report ID', debug: { reportId } };
      }

      if (!Number.isFinite(rewardPoints) || rewardPoints < 1) {
        console.error('approveReport: Invalid rewardPoints:', rewardPoints);
        return { success: false, error: 'Invalid reward points', debug: { rewardPoints } };
      }

      if (!adminId || typeof adminId !== 'string') {
        console.error('approveReport: Invalid adminId:', adminId);
        return { success: false, error: 'Invalid admin ID', debug: { adminId } };
      }

      console.log('approveReport: Step 1 - Getting report details for reportId:', reportId);
      
      // Get report details
      const { data: report, error: reportError } = await supabase
        .from('question_reports')
        .select('user_id, question_id')
        .eq('id', reportId)
        .single();

      if (reportError || !report) {
        console.error('approveReport: Report not found:', reportError);
        return { 
          success: false, 
          error: 'Report not found',
          debug: { reportError: reportError?.message, reportId }
        };
      }

      console.log('approveReport: Step 2 - Updating report status to approved');
      console.log('approveReport: Report data:', { 
        userId: report.user_id, 
        questionId: report.question_id 
      });
      
      // Update report status
      const { error: updateError } = await supabase
        .from('question_reports')
        .update({
          status: 'approved',
          reward_points: rewardPoints,
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (updateError) {
        console.error('approveReport: Error updating report:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        });
        
        return { 
          success: false, 
          error: updateError.message || 'Failed to approve report',
          debug: {
            code: updateError.code,
            details: updateError.details,
          }
        };
      }

      console.log('approveReport: Step 3 - Adding points to user:', report.user_id, 'points:', rewardPoints);
      
      // Validate user_id before awarding points
      if (!report.user_id || typeof report.user_id !== 'string') {
        console.error('approveReport: Invalid user_id:', report.user_id);
        return { 
          success: false, 
          error: 'Invalid user ID for points award',
          debug: { userId: report.user_id, reportId }
        };
      }
      
      // Get current user points
      const { data: userPoints, error: pointsFetchError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', report.user_id)
        .maybeSingle();

      if (pointsFetchError) {
        console.error('approveReport: Error fetching user points:', pointsFetchError);
        return { 
          success: false, 
          error: 'Failed to fetch user points',
          debug: { pointsFetchError: pointsFetchError.message }
        };
      }

      // If user_points record doesn't exist, create one
      if (!userPoints) {
        console.log('approveReport: Creating user_points record for:', report.user_id);
        const { data: newUserPoints, error: createError } = await supabase
          .from('user_points')
          .insert({
            user_id: report.user_id,
            total_points: rewardPoints,
            available_points: rewardPoints,
          })
          .select()
          .single();

        if (createError) {
          console.error('approveReport: Error creating user points:', createError);
          return { 
            success: false, 
            error: 'Failed to create user points record',
            debug: { createError: createError.message }
          };
        }
      } else {
        // Update existing user points
        console.log('approveReport: Updating user_points for:', report.user_id);
        const { error: updateError } = await supabase
          .from('user_points')
          .update({
            total_points: (userPoints.total_points || 0) + rewardPoints,
            available_points: (userPoints.available_points || 0) + rewardPoints,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', report.user_id);

        if (updateError) {
          console.error('approveReport: Error updating user points:', updateError);
          return { 
            success: false, 
            error: 'Failed to update user points',
            debug: { updateError: updateError.message }
          };
        }
      }

      // Create point transaction (non-blocking - log error but don't fail)
      console.log('approveReport: Step 4 - Creating point transaction');
      const { error: transactionError } = await supabase
        .from('point_transactions')
        .insert({
          user_id: report.user_id,
          transaction_type: 'question_report_reward',
          points: rewardPoints,
          description: `Question report #${reportId} approved`,
          reference_id: reportId,
          reference_type: 'question_report',
        });

      if (transactionError) {
        console.error('approveReport: Error creating transaction (non-blocking):', transactionError);
        // Don't fail the approval if transaction creation fails
        // Points were already awarded successfully
      } else {
        console.log('approveReport: Point transaction created successfully');
      }

      console.log('approveReport: Step 4 - Points added successfully');
      
      // Send notification to user
      try {
        await notificationService.createNotification(supabase, {
          user_id: report.user_id,
          title: 'Report Approved',
          message: `Your question report has been approved.\n\nYou received ${rewardPoints} points.\n\nThank you for helping improve Terrah PSC.`,
          type: 'reward',
          action_url: '/user/reports',
          data: {
            report_id: reportId,
            points: rewardPoints,
          },
        });
      } catch (notificationError) {
        console.error('Error sending approval notification:', notificationError);
        // Don't fail the approval if notification fails
      }
      
      return { 
        success: true,
        debug: { 
          reportId, 
          userId: report.user_id, 
          points: rewardPoints,
          questionId: report.question_id
        }
      };
    } catch (error: any) {
      console.error('Error in approveReport:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to approve report',
        debug: { stack: error.stack }
      };
    }
  },

  /**
   * Reject a report (admin only)
   */
  async rejectReport(
    supabase: SupabaseClient,
    reportId: number,
    adminId: string
  ): Promise<{ success: boolean; error?: string; debug?: any }> {
    try {
      // Validate inputs
      console.log('rejectReport: Validating inputs:', { reportId, adminId });
      
      if (!Number.isFinite(reportId) || reportId <= 0) {
        console.error('rejectReport: Invalid reportId:', reportId);
        return { success: false, error: 'Invalid report ID', debug: { reportId } };
      }

      if (!adminId || typeof adminId !== 'string') {
        console.error('rejectReport: Invalid adminId:', adminId);
        return { success: false, error: 'Invalid admin ID', debug: { adminId } };
      }

      console.log('rejectReport: Updating report status to rejected for reportId:', reportId);
      
      const { error } = await supabase
        .from('question_reports')
        .update({
          status: 'rejected',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          reward_points: 0,
        })
        .eq('id', reportId);

      if (error) {
        console.error('rejectReport: Error updating report:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        
        return { 
          success: false, 
          error: error.message || 'Failed to reject report',
          debug: {
            code: error.code,
            details: error.details,
          }
        };
      }

      console.log('rejectReport: Report rejected successfully');
      
      // Get report details for notification
      const { data: reportData } = await supabase
        .from('question_reports')
        .select('user_id, admin_comment')
        .eq('id', reportId)
        .single();

      // Send notification to user
      if (reportData) {
        try {
          await notificationService.createNotification(supabase, {
            user_id: reportData.user_id,
            title: 'Report Rejected',
            message: `Your question report has been reviewed.\n\nReason:\n${adminId ? 'Admin reviewed your report' : 'Report did not meet approval criteria'}`,
            type: 'report',
            data: {
              report_id: reportId,
            },
          });
        } catch (notificationError) {
          console.error('Error sending rejection notification:', notificationError);
          // Don't fail the rejection if notification fails
        }
      }
      
      return { 
        success: true,
        debug: { reportId }
      };
    } catch (error: any) {
      console.error('Error in rejectReport:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to reject report',
        debug: { stack: error.stack }
      };
    }
  },
};