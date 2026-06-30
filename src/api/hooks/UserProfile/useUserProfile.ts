// src/api/hooks/UserProfile/useUserProfile.ts

import { useState, useCallback } from 'react';
import { userProfileService, UpdateProfileRequest } from '../../services/userProfileService';
import { UserData } from '../../../types/auth';

export function useUserProfile() {
  const [user, setUser]       = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // ── Get user by ID ────────────────────────────────────────────
  const fetchUser = useCallback(async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await userProfileService.getUser(userId);
      setUser(data);
      return data;
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to fetch user';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Update user profile (PATCH) ───────────────────────────────
  const updateUser = useCallback(async (userId: number, data: UpdateProfileRequest) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await userProfileService.updateUser(userId, data);
      console.log('Updated user:', updated);
      setUser(prev => ({ ...prev, ...updated }));
      return updated;
    } catch (e: any) {
      console.error('Error updating profile:', e);
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to update profile';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Update profile photo ──────────────────────────────────────
  const updatePhoto = useCallback(async (userId: string, photoFile: {
    uri: string;
    name: string;
    type: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const photoPath = await userProfileService.updatePhoto(userId, photoFile);
      setUser(prev => prev ? { ...prev, picture: photoPath } : prev);
      return photoPath;
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to update photo';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Delete profile photo ──────────────────────────────────────
  const deletePhoto = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      await userProfileService.deletePhoto(userId);
      setUser(prev => prev ? { ...prev, picture: undefined } : prev);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to delete photo';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Delete user account ───────────────────────────────────────
  const deleteUser = useCallback(async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      await userProfileService.deleteUser(userId);
      setUser(null);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to delete account';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    fetchUser,
    updateUser,
    updatePhoto,
    deletePhoto,
    deleteUser,
  };
}
