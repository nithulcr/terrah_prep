export type NotificationType = 
  | 'report'
  | 'reward'
  | 'subscription'
  | 'payment'
  | 'system'
  | 'broadcast'
  | 'message';

export interface Notification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  action_url?: string | null;
  data: Record<string, any>;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationCreate {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  action_url?: string;
  data?: Record<string, any>;
}

export interface NotificationFilters {
  is_read?: boolean;
  type?: NotificationType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
}

export interface BroadcastNotification {
  title: string;
  message: string;
  type: NotificationType;
  action_url?: string;
  data?: Record<string, any>;
  recipient_type: 'all' | 'plan' | 'specific';
  plan_slug?: string;
  user_ids?: string[];
}

export interface UserNotification {
  title: string;
  message: string;
  type: NotificationType;
  action_url?: string;
  data?: Record<string, any>;
  user_id: string;
}