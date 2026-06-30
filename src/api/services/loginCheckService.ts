// src/api/services/loginCheckService.ts

import { callApi } from '../apiClient';
import { LOGIN_CHECK } from '../endpoints';

export interface LoginCheckRegisterRequest {
  username:     string;
  mobileNumber: string;
}

export interface LoginLog {
  ID:            number;
  USERNAME:      string;
  MOBILE_NUMBER: string;
  CREATED_AT:    string | null;
}

interface LoginListResponse {
  status:  boolean;
  message: string;
  data:    LoginLog[];
}

export const loginCheckService = {
  /** POST /api/v1/logincheck/register — record a login-check entry */
  register: (body: LoginCheckRegisterRequest) =>
    callApi<LoginCheckRegisterRequest, { status: boolean; message: string }>({
      method: 'post',
      url:    LOGIN_CHECK.REGISTER,
      data:   body,
    }),

  /** GET /api/v1/logincheck/list — fetch login-check entries */
  list: (params?: { mobileNumber?: string; fromDate?: string; toDate?: string }) =>
    callApi<null, LoginListResponse>({
      method: 'get',
      url:    LOGIN_CHECK.LIST,
      params,
    }),
};
