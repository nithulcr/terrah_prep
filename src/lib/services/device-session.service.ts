// ============================================
// TERRAH PREP - DEVICE SESSION SERVICE
// ============================================

import { supabase } from '@/lib/supabase/client';

export interface DeviceSession {
  id?: number;
  user_id: string;
  device_id: string;
  browser: string;
  os: string;
  device_name: string;
  last_seen: string;
  is_active: boolean;
  created_at?: string;
}

export interface DeviceInfo {
  browser: string;
  os: string;
  deviceName: string;
}

/**
 * Device Session Service
 * Manages multi-device session tracking and limits
 */
export const deviceSessionService = {
  /**
   * Get device information from user agent
   */
  getDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
      return {
        browser: 'Unknown',
        os: 'Unknown',
        deviceName: 'Unknown Device',
      };
    }

    const userAgent = navigator.userAgent;
    
    // Detect browser
    let browser = 'Unknown';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser = 'Chrome';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'Safari';
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
    } else if (userAgent.includes('Edg')) {
      browser = 'Edge';
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
      browser = 'Opera';
    }

    // Detect OS
    let os = 'Unknown';
    if (userAgent.includes('Windows')) {
      os = 'Windows';
    } else if (userAgent.includes('Mac OS X')) {
      os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
    } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      os = 'iOS';
    }

    // Generate device name
    const deviceName = `${browser} on ${os}`;

    return {
      browser,
      os,
      deviceName,
    };
  },

  /**
   * Get or create a persistent device ID from localStorage
   */
  getDeviceId(): string {
    if (typeof window === 'undefined') {
      return 'server-device-id';
    }

    const storageKey = 'terrah-prep-device-id';
    let deviceId = localStorage.getItem(storageKey);

    if (!deviceId) {
      // Generate a new device ID
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem(storageKey, deviceId);
    }

    return deviceId;
  },

  /**
   * Count active device sessions for a user
   */
  async countActiveDevices(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('device_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error counting active devices:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error counting active devices:', error);
      return 0;
    }
  },

  /**
   * Check if the current device is already registered
   */
  async isCurrentDeviceRegistered(userId: string, deviceId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('device_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking device registration:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking device registration:', error);
      return false;
    }
  },

  /**
   * Check if user has reached device limit
   */
  async checkDeviceLimit(
    userId: string,
    maxDevices: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const deviceId = this.getDeviceId();
      const isRegistered = await this.isCurrentDeviceRegistered(userId, deviceId);

      // If device is already registered, allow login
      if (isRegistered) {
        return { allowed: true };
      }

      // Count active sessions
      const activeCount = await this.countActiveDevices(userId);

      // Check if limit reached
      if (activeCount >= maxDevices) {
        return {
          allowed: false,
          reason: 'Maximum device limit reached. Please log out from another device.',
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking device limit:', error);
      // On error, allow login (fail open)
      return { allowed: true };
    }
  },

  /**
   * Register or update device session
   */
  async registerDevice(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const deviceId = this.getDeviceId();
      const deviceInfo = this.getDeviceInfo();
      const now = new Date().toISOString();

      // Upsert device session
      const { error } = await supabase
        .from('device_sessions')
        .upsert(
          {
            user_id: userId,
            device_id: deviceId,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            device_name: deviceInfo.deviceName,
            last_seen: now,
            is_active: true,
          },
          {
            onConflict: 'user_id,device_id',
          }
        );

      if (error) {
        console.error('Error registering device:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error registering device:', error);
      return { success: false, error: 'Failed to register device' };
    }
  },

  /**
   * Update device heartbeat (last_seen)
   */
  async updateHeartbeat(userId: string): Promise<void> {
    try {
      const deviceId = this.getDeviceId();
      const now = new Date().toISOString();

      await supabase
        .from('device_sessions')
        .update({ last_seen: now })
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .eq('is_active', true);
    } catch (error) {
      console.error('Error updating device heartbeat:', error);
      // Non-critical, don't throw
    }
  },

  /**
   * Logout device (set is_active=false)
   */
  async logoutDevice(userId: string): Promise<void> {
    try {
      const deviceId = this.getDeviceId();
      const now = new Date().toISOString();

      await supabase
        .from('device_sessions')
        .update({
          is_active: false,
          last_seen: now,
        })
        .eq('user_id', userId)
        .eq('device_id', deviceId);
    } catch (error) {
      console.error('Error logging out device:', error);
      // Non-critical, don't throw
    }
  },

  /**
   * Start heartbeat interval (call every 3 minutes)
   */
  startHeartbeat(userId: string): (() => void) | null {
    if (typeof window === 'undefined') {
      return null;
    }

    // Update immediately
    this.updateHeartbeat(userId);

    // Set up interval (every 3 minutes)
    const interval = setInterval(() => {
      this.updateHeartbeat(userId);
    }, 3 * 60 * 1000); // 3 minutes

    // Return cleanup function
    return () => clearInterval(interval);
  },
};