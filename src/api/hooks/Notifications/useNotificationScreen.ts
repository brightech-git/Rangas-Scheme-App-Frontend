// src/api/hooks/Notifications/useNotificationScreen.ts

import { useState, useEffect, useCallback } from 'react';
import { notificationService, NotificationItem } from '../../services/notificationService';
import { AsyncStorageHelper } from '../../../utils/AsyncStorageHelper';

export type { NotificationItem };

export function useNotificationScreen() {
  const [userId, setUserId]               = useState<number | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // ── Get userId from AsyncStorage once ────────────────────────
  useEffect(() => {
    AsyncStorageHelper.getUserId().then((id) => {
      if (id) setUserId(Number(id));
    });
  }, []);

  // ── Fetch notifications + unread count ───────────────────────
  const fetchAll = useCallback(async (uid: number) => {
    setLoading(true);
    setError(null);
    try {
      const [items, count] = await Promise.all([
        notificationService.getUserNotifications(uid),
        notificationService.getUnreadCount(uid),
      ]);
      setNotifications(items);
      setUnreadCount(count);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) fetchAll(userId);
  }, [userId, fetchAll]);

  const refresh = useCallback(() => {
    if (userId) fetchAll(userId);
  }, [userId, fetchAll]);

  // ── Mark single as read ───────────────────────────────────────
  const markRead = useCallback(async (notificationId: number) => {
    if (!userId) return;
    try {
      await notificationService.markAsRead(notificationId, userId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n),
      );
      const count = await notificationService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch {}
  }, [userId]);

  // ── Mark all as read ─────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    if (!userId) return;
    try {
      await notificationService.markAllAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  }, [userId]);

  // ── Delete single ─────────────────────────────────────────────
  const deleteOne = useCallback(async (id: number) => {
    if (!userId) return;
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => {
        const remaining = prev.filter(n => n.id !== id);
        setUnreadCount(remaining.filter(n => !n.read).length);
        return remaining;
      });
    } catch {}
  }, [userId]);

  // ── Delete all ────────────────────────────────────────────────
  const deleteAll = useCallback(async () => {
    if (!userId) return;
    try {
      await notificationService.deleteAllNotifications(userId);
      setNotifications([]);
      setUnreadCount(0);
    } catch {}
  }, [userId]);

  return {
    userId,
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
    deleteOne,
    deleteAll,
  };
}
