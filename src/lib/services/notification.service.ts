import { SupabaseClient } from '@supabase/supabase-js';
import { Notification, NotificationCreate, NotificationFilters, NotificationStats, BroadcastNotification, UserNotification } from '@/types/notification';

export const notificationService = {
  /**
   * Get notifications for a user
   */
  async getNotifications(
    supabase: SupabaseClient,
    userId: string,
    filters?: NotificationFilters
  ): Promise<{ success: boolean; notifications?: Notification[]; error?: string; total?: number; unread?: number }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply filters
      if (filters?.is_read !== undefined) {
        query = query.eq('is_read', filters.is_read);
      }

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,message.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        return { success: false, error: error.message };
      }

      // Get unread count
      const { count: unreadCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      return {
        success: true,
        notifications: data || [],
        total: count || 0,
        unread: unreadCount || 0,
      };
    } catch (error: any) {
      console.error('Error in getNotifications:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get notification by ID
   */
  async getNotificationById(
    supabase: SupabaseClient,
    notificationId: number,
    userId: string
  ): Promise<{ success: boolean; notification?: Notification; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .eq('user_id', userId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, notification: data };
    } catch (error: any) {
      console.error('Error in getNotificationById:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Create notification
   */
  async createNotification(
    supabase: SupabaseClient,
    notification: NotificationCreate
  ): Promise<{ success: boolean; notification?: Notification; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.user_id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          action_url: notification.action_url,
          data: notification.data || {},
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return { success: false, error: error.message };
      }

      return { success: true, notification: data };
    } catch (error: any) {
      console.error('Error in createNotification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(
    supabase: SupabaseClient,
    userIds: string[],
    notification: Omit<NotificationCreate, 'user_id'>
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        action_url: notification.action_url,
        data: notification.data || {},
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) {
        console.error('Error creating bulk notifications:', error);
        return { success: false, error: error.message };
      }

      return { success: true, count: data?.length || 0 };
    } catch (error: any) {
      console.error('Error in createBulkNotifications:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(
    supabase: SupabaseClient,
    notificationId: number,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in markAsRead:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(
    supabase: SupabaseClient,
    userId: string
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select('id');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, count: data?.length || 0 };
    } catch (error: any) {
      console.error('Error in markAllAsRead:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete notification
   */
  async deleteNotification(
    supabase: SupabaseClient,
    notificationId: number,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in deleteNotification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get notification stats
   */
  async getNotificationStats(
    supabase: SupabaseClient,
    userId: string
  ): Promise<{ success: boolean; stats?: NotificationStats; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('is_read')
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      const total = data?.length || 0;
      const unread = data?.filter(n => !n.is_read).length || 0;
      const read = total - unread;

      return {
        success: true,
        stats: { total, unread, read },
      };
    } catch (error: any) {
      console.error('Error in getNotificationStats:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Broadcast notification to all users
   */
  async broadcastNotification(
    supabase: SupabaseClient,
    notification: BroadcastNotification
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      let userIds: string[] = [];

      if (notification.recipient_type === 'all') {
        // Get all users
        const { data: users } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'user');
        
        userIds = users?.map(u => u.id) || [];
      } else if (notification.recipient_type === 'plan' && notification.plan_slug) {
        // Get users with specific plan
        const { data: users } = await supabase
          .from('profiles')
          .select('id')
          .eq('plan_slug', notification.plan_slug);
        
        userIds = users?.map(u => u.id) || [];
      } else if (notification.recipient_type === 'specific' && notification.user_ids) {
        userIds = notification.user_ids;
      }

      if (userIds.length === 0) {
        return { success: false, error: 'No users found' };
      }

      // Create notifications for all users
      const result = await this.createBulkNotifications(supabase, userIds, {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        action_url: notification.action_url,
        data: notification.data,
      });

      return result;
    } catch (error: any) {
      console.error('Error in broadcastNotification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send notification to specific user
   */
  async sendUserNotification(
    supabase: SupabaseClient,
    notification: UserNotification
  ): Promise<{ success: boolean; notification?: Notification; error?: string }> {
    return this.createNotification(supabase, {
      user_id: notification.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      action_url: notification.action_url,
      data: notification.data,
    });
  },

  /**
   * Get all notifications (admin only)
   */
  async getAllNotifications(
    supabase: SupabaseClient,
    filters?: NotificationFilters
  ): Promise<{ success: boolean; notifications?: Notification[]; error?: string; total?: number }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply filters
      if (filters?.is_read !== undefined) {
        query = query.eq('is_read', filters.is_read);
      }

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,message.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching all notifications:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        notifications: data || [],
        total: count || 0,
      };
    } catch (error: any) {
      console.error('Error in getAllNotifications:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete all read notifications for a user
   */
  async deleteAllRead(
    supabase: SupabaseClient,
    userId: string
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true)
        .select('id');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, count: data?.length || 0 };
    } catch (error: any) {
      console.error('Error in deleteAllRead:', error);
      return { success: false, error: error.message };
    }
  },
};