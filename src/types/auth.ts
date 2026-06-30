// src/types/auth.ts

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  contactNumber: string;
  hashKey?: string;
}

export interface LoginRequest {
  contactOrEmailOrUsername: string;
  password: string;
}

export interface VerifyOtpRequest {
  contactNumber: string;
  otp: string;
  newPassword?: string;
}

export interface ForgotPasswordRequest {
  contactNumber: string;
  hashKey?: string;
}

export interface ResetPasswordRequest {
  contactNumber: string;
  otp: string;
  newPassword: string;
}

export interface GoogleContactUpdateRequest {
  userId: number;
  newContactNumber: string;
  usedReferralCode?: string;
  hashKey?: string;
}

export interface GoogleContactVerifyOtpRequest {
  newContactNumber: string;
  otp: string;
}

export interface UserData {
  id?: number;
  username?: string;
  email?: string;
  contactNumber?: string;
  token?: string;
  hashKey?: string;
  otp?: string;
  errorMessage?: string;
  referredBy?: number;
  walletBalance?: number;
  referralCode?: string;
  whatsappLink?: string;
  playStoreLink?: string;
  referralLink?: string;
  gender?: string;
  dateOfBirth?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  termsAccepted?: boolean;
  maskedAadhaar?: string;
  aadhaarVerified?: boolean;
  kycVerified?: boolean;
  used_referral_code?: string;
  picture?: string;
  socialMedia?: string;
}

export interface AuthState {
  user: UserData | null;
  token: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
}
