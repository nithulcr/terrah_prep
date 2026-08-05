import { SupabaseClient } from '@supabase/supabase-js';
import { QuestionReport } from '@/types';

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
            category:categories(name)
          ),
          user:profiles!question_reports_user_id_fkey(email, full_name),
          reviewer:profiles!question_reports_reviewed_by_fkey(email, full_name)
        `, { count: 'exact' });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`question.question.ilike.%${filters.search}%,user.email.ilike.%${filters.search}%,reason.ilike.%${filters.search}%`);
      }

      // Pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, error, count } = await query;

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
      const { data, error } = await supabase
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
            category:categories(name)
          ),
          user:profiles!question_reports_user_id_fkey(email, full_name),
          reviewer:profiles!question_reports_reviewed_by_fkey(email, full_name)
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
      // Get report details
      const { data: report, error: reportError } = await supabase
        .from('question_reports')
        .select('user_id, question_id')
        .eq('id', reportId)
        .single();

      if (reportError || !report) {
        return { 
          success: false, 
          error: 'Report not found',
          debug: { reportError: reportError?.message, reportId }
        };
      }

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
        console.error('Error approving report:', {
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

      // Add points to user using the database function
      const { error: pointsError } = await supabase.rpc('add_points_to_user', {
        p_user_id: report.user_id,
        p_points: rewardPoints,
        p_transaction_type: 'report_reward',
        p_description: `Reward for approved question report #${reportId}`,
        p_reference_id: reportId,
        p_reference_type: 'question_report',
      });

      if (pointsError) {
        console.error('Error adding points:', {
          code: pointsError.code,
          message: pointsError.message,
          details: pointsError.details,
          hint: pointsError.hint,
        });
        
        return { 
          success: false, 
          error: pointsError.message || 'Failed to add points',
          debug: {
            code: pointsError.code,
            details: pointsError.details,
          }
        };
      }

      return { 
        success: true,
        debug: { 
          reportId, 
          userId: report.user_id, 
          points: rewardPoints 
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
      const { error } = await supabase
        .from('question_reports')
        .update({
          status: 'rejected',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) {
        console.error('Error rejecting report:', {
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

      return { success: true };
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