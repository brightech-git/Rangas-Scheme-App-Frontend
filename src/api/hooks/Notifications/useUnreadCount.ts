// src/api/hooks/Notifications/useUnreadCount.ts

import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../../services/notificationService';
import { AsyncStorageHelper } from '../../../utils/AsyncStorageHelper';

export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const id = await AsyncStorageHelper.getUserId();
      if (!id) return;
      const count = await notificationService.getUnreadCount(Number(id));
      setUnreadCount(count);
    } catch {}
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    const timer = setInterval(refreshUnreadCount, 2000);
    return () => clearInterval(timer);
  }, [refreshUnreadCount]);

  return { unreadCount, refreshUnreadCount };
}
