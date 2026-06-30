// src/api/hooks/Notifications/useNotifications.ts

import { useState, useEffect, useCallback } from 'react';
import {
  notificationService,
  NotifyMessage,
  SendNotificationRequest,
} from '../../services/notificationService';

// ─────────────────────────────────────────────────────────────────
// useNotificationTemplates
// Fetch saved templates — used in Components send test section
// ─────────────────────────────────────────────────────────────────
export function useNotificationTemplates() {
  const [templates, setTemplates] = useState<NotifyMessage[]>([]);
  const [loading, setLoading]     = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await notificationService.getAllTemplates());
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { templates, loading, refresh: fetch };
}

// ─────────────────────────────────────────────────────────────────
// useSendNotification
// Send to user or all users — inline content or scheduled
// ─────────────────────────────────────────────────────────────────
export function useSendNotification() {
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const run = useCallback(async (fn: () => Promise<any>) => {
    setSending(true);
    setError(null);
    try {
      return await fn();
    } catch (e: any) {
      setError(e.message ?? 'Failed to send notification');
      throw e;
    } finally {
      setSending(false);
    }
  }, []);

  const sendToUser = (req: SendNotificationRequest) =>
    run(() => notificationService.sendToUser(req));

  const sendToAll = (req: SendNotificationRequest) =>
    run(() => notificationService.sendToAll(req));

  return { sending, error, sendToUser, sendToAll };
}
