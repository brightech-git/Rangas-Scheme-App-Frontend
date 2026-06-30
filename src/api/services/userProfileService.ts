// src/api/services/userProfileService.ts

import { axiosInstance } from '../axiosInstance';
import { USER_PROFILE } from '../endpoints';
import { UserData } from '../../types/auth';

export type UpdateProfileRequest = Partial<Pick<UserData,
  | 'username'
  | 'email'
  | 'contactNumber'
  | 'gender'
  | 'dateOfBirth'
  | 'address1'
  | 'address2'
  | 'city'
  | 'state'
  | 'pincode'
  | 'country'
>>;

const getUser = async (userId: number): Promise<UserData> => {
  const res = await axiosInstance.get(USER_PROFILE.GET(userId));
  return res.data;
};

const updateUser = async (userId: number, data: UpdateProfileRequest): Promise<UserData> => {
  console.log('[updateUser] Updating user with data:', data, 'to endpoint:', USER_PROFILE.UPDATE(userId));
  const res = await axiosInstance.patch(USER_PROFILE.UPDATE(userId), data);
  return res.data;
};

const updatePhoto = async (userId: string, photoFile: {
  uri: string;
  name: string;
  type: string;
}): Promise<string> => {
  const formData = new FormData();
  formData.append('photo', photoFile as any);
  const url = USER_PROFILE.UPDATE_PHOTO(userId);
  console.log('[updatePhoto] URL:', url);
  const res = await axiosInstance.put(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  console.log('[updatePhoto] API response:', JSON.stringify(res.data));
  return res.data?.photoPath ?? res.data?.photo ?? res.data?.url ?? res.data?.picture ?? res.data;
};

const deletePhoto = async (userId: string): Promise<void> => {
  await axiosInstance.delete(USER_PROFILE.DELETE_PHOTO(userId));
};

const deleteUser = async (userId: number): Promise<void> => {
  await axiosInstance.delete(USER_PROFILE.DELETE_USER(userId));
};

export const userProfileService = {
  getUser,
  updateUser,
  updatePhoto,
  deletePhoto,
  deleteUser,
};
