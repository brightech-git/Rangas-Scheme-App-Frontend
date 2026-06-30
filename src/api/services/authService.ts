// src/api/services/authService.ts

import { callApi } from '../apiClient';
import { AUTH } from '../endpoints';
import {
  RegisterRequest,
  LoginRequest,
  VerifyOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  GoogleContactUpdateRequest,
  GoogleContactVerifyOtpRequest,
  UserData,
} from '../../types/auth';

export const authService = {
  register: (data: RegisterRequest) =>
    callApi<RegisterRequest, UserData>({
      method: 'post',
      url: AUTH.REGISTER,
      data,
    }),

  verifyOtp: (params: VerifyOtpRequest) =>
    callApi<null, UserData>({
      method: 'post',
      url: AUTH.VERIFY_OTP,
      params: {
        contactNumber: params.contactNumber,
        otp: params.otp,
        ...(params.newPassword ? { newPassword: params.newPassword } : {}),
      },
    }),

  login: (data: LoginRequest) =>
    callApi<LoginRequest, UserData>({
      method: 'post',
      url: AUTH.LOGIN,
      data,
    }),

  forgotPassword: (data: ForgotPasswordRequest) =>
    callApi<ForgotPasswordRequest, { message: string }>({
      method: 'post',
      url: AUTH.FORGOT_PASSWORD,
      data,
    }),

  resetPassword: (data: ResetPasswordRequest) =>
    callApi<ResetPasswordRequest, { message: string }>({
      method: 'post',
      url: AUTH.RESET_PASSWORD,
      data,
    }),

  getProfile: () =>
    callApi<null, UserData>({
      method: 'get',
      url: AUTH.PROFILE,
    }),

  googleLogin: (data: { idToken: string }) =>
    callApi<{ idToken: string }, UserData>({
      method: 'post',
      url: AUTH.GOOGLE_LOGIN,
      data,
    }),

  requestGoogleContactUpdate: (params: GoogleContactUpdateRequest) =>
    callApi<null, { message: string; otp?: string }>({
      method: 'post',
      url: AUTH.GOOGLE_CONTACT_UPDATE,
      params: {
        userId:           params.userId,
        newContactNumber: params.newContactNumber,
        ...(params.usedReferralCode ? { usedReferralCode: params.usedReferralCode } : {}),
        ...(params.hashKey          ? { hashKey: params.hashKey }                  : {}),
      },
    }),

  verifyGoogleContactOtp: (params: GoogleContactVerifyOtpRequest) =>
    callApi<null, UserData>({
      method: 'post',
      url: AUTH.GOOGLE_CONTACT_VERIFY_OTP,
      params: {
        newContactNumber: params.newContactNumber,
        otp:              params.otp,
      },
    }),
};
