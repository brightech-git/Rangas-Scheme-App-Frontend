// src/api/services/notificationService.ts

import { axiosInstance } from '../axiosInstance';
import { NOTIFICATIONS } from '../endpoints';

// ── Types ─────────────────────────────────────────────────────────

export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  imageUrl?: string;
  url?: string;
  read: boolean;
  createdAt: string;
  status?: string;
};

export type NotifyMessage = {
  id: number;
  title: string;
  message: string;
  imageUrl?: string;
  url?: string;
  schemeId?: number;
  scheduledTime?: string;
};

export type SendNotificationRequest = {
  userId?: number;
  title?: string;
  message?: string;
  imageUrl?: string;
  url?: string;
  schemeId?: number;
  scheduledTime?: string;
};

// ── Mapper — Pascal Case API → camelCase ──────────────────────────

export function mapNotification(raw: any): NotificationItem {
  return {
    id:        raw.Id        ?? raw.id,
    title:     raw.Title     ?? raw.title     ?? '',
    message:   raw.Message   ?? raw.message   ?? '',
    imageUrl:  raw.ImageUrl  ?? raw.imageUrl,
    url:       raw.Url       ?? raw.url,
    read:      raw.IsRead    ?? raw.read      ?? false,
    createdAt: raw.CreatedAt ?? raw.createdAt ?? '',
    status:    raw.Status    ?? raw.status,
  };
}

// ── User notifications ────────────────────────────────────────────

const getUserNotifications = async (userId: number): Promise<NotificationItem[]> => {
  const res = await axiosInstance.get(NOTIFICATIONS.GET_USER(userId));
  return (res.data?.data ?? []).map(mapNotification);
};

const getUnreadCount = async (userId: number): Promise<number> => {
  const res = await axiosInstance.get(NOTIFICATIONS.UNREAD_COUNT(userId));
  return res.data?.unreadCount ?? 0;
};

const markAsRead = async (notificationId: number, userId: number): Promise<void> => {
  await axiosInstance.post(NOTIFICATIONS.MARK_READ(notificationId, userId));
};

const markAllAsRead = async (userId: number): Promise<void> => {
  await axiosInstance.post(NOTIFICATIONS.MARK_ALL_READ(userId));
};

const deleteNotification = async (id: number): Promise<void> => {
  await axiosInstance.delete(NOTIFICATIONS.DELETE_ONE(id));
};

const deleteAllNotifications = async (userId: number): Promise<void> => {
  await axiosInstance.delete(NOTIFICATIONS.DELETE_BY_USER(userId));
};

// ── Send ──────────────────────────────────────────────────────────

const sendToUser = async (req: SendNotificationRequest) => {
  const res = await axiosInstance.post(NOTIFICATIONS.SEND, req);
  return res.data;
};

const sendToAll = async (req: SendNotificationRequest) => {
  const res = await axiosInstance.post(NOTIFICATIONS.SEND_ALL, req);
  return res.data;
};

// ── Templates ─────────────────────────────────────────────────────

const getAllTemplates = async (): Promise<NotifyMessage[]> => {
  const res = await axiosInstance.get(NOTIFICATIONS.GET_ALL_TEMPLATES);
  return res.data?.data ?? [];
};

// ── Export ────────────────────────────────────────────────────────

export const notificationService = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  sendToUser,
  sendToAll,
  getAllTemplates,
};
