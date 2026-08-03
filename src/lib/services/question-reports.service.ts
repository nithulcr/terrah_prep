import { supabase } from '@/lib/supabase/client';
import { QuestionReport } from '@/types';

export const questionReportsService = {
  /**
   * Submit a new question report
   */
  async submitReport(questionId: number, reason: string, comment?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Please login to report questions' };
      }

      // Check if user already reported this question
      const { data: existingReport } = await supabase
        .from('question_reports')
        .select('id')
        .eq('question_id', questionId)
        .eq('user_id', user.id)
        .single();

      if (existingReport) {
        return { success: false, error: 'You have already reported this question.' };
      }

      // Check daily limit (10 reports per day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: reportsToday } = await supabase
        .from('question_reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      if (reportsToday && reportsToday >= 10) {
        return { success: false, error: 'You have reached the maximum of 10 reports per day.' };
      }

      // Submit report
      const { error } = await supabase
        .from('question_reports')
        .insert({
          question_id: questionId,
          user_id: user.id,
          reason,
          comment: comment || null,
        });

      if (error) {
        console.error('Error submitting report:', error);
        return { success: false, error: 'Failed to submit report' };
      }

      return { success: true, message: 'Report submitted successfully! Thank you for helping us improve.' };
    } catch (error) {
      console.error('Error in submitReport:', error);
      return { success: false, error: 'Failed to submit report' };
    }
  },

  /**
   * Get all reports (admin only)
   */
  async getAllReports(): Promise<QuestionReport[]> {
    try {
      const { data, error } = await supabase
        .from('question_reports')
        .select(`
          *,
          question:questions(question, category:categories(name)),
          user:profiles(email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllReports:', error);
      return [];
    }
  },

  /**
   * Get pending reports (admin only)
   */
  async getPendingReports(): Promise<QuestionReport[]> {
    try {
      const { data, error } = await supabase
        .from('question_reports')
        .select(`
          *,
          question:questions(question, category:categories(name)),
          user:profiles(email, full_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending reports:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPendingReports:', error);
      return [];
    }
  },

  /**
   * Approve a report and reward points (admin only)
   */
  async approveReport(reportId: number, rewardPoints: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Unauthorized' };
      }

      // Get report details
      const { data: report, error: reportError } = await supabase
        .from('question_reports')
        .select('user_id')
        .eq('id', reportId)
        .single();

      if (reportError || !report) {
        return { success: false, error: 'Report not found' };
      }

      // Update report status
      const { error: updateError } = await supabase
        .from('question_reports')
        .update({
          status: 'approved',
          reward_points: rewardPoints,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (updateError) {
        console.error('Error approving report:', updateError);
        return { success: false, error: 'Failed to approve report' };
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
        console.error('Error adding points:', pointsError);
        // Note: Report is approved but points might not be added
      }

      return { success: true };
    } catch (error) {
      console.error('Error in approveReport:', error);
      return { success: false, error: 'Failed to approve report' };
    }
  },

  /**
   * Reject a report (admin only)
   */
  async rejectReport(reportId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Unauthorized' };
      }

      const { error } = await supabase
        .from('question_reports')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) {
        console.error('Error rejecting report:', error);
        return { success: false, error: 'Failed to reject report' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in rejectReport:', error);
      return { success: false, error: 'Failed to reject report' };
    }
  },
};