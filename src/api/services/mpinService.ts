// src/api/services/mpinService.ts

import { callApi } from '../apiClient';
import { MPIN } from '../endpoints';
import { API_BASE_URL } from '@env';

export const mpinService = {
  create: (mpin: string) =>
    callApi<null, string>({
      method: 'post',
      url: MPIN.CREATE,
      params: { mpin },
    }),

  verify: (enteredMpin: string) => {
    console.log('[mpinService] verify → POST', `${API_BASE_URL}${MPIN.VERIFY}`);
    console.log('[mpinService] verify → params:', { enteredMpin });
    return callApi<null, string>({
      method: 'post',
      url: MPIN.VERIFY,
      params: { enteredMpin },
    }).then((res) => {
      console.log('[mpinService] verify → response:', res);
      return res;
    }).catch((err) => {
      console.log('[mpinService] verify → error:', err);
      throw err;
    });
  },

  reset: (oldMpin: string, newMpin: string) =>
    callApi<null, string>({
      method: 'post',
      url: MPIN.RESET,
      params: { oldMpin, newMpin },
    }),

  forgotSendOtp: () =>
    callApi<null, { status: string; message: string }>({
      method: 'post',
      url: MPIN.FORGOT_SEND_OTP,
    }),

  forgotVerify: (otp: string, newMpin: string) =>
    callApi<null, { status: string; message: string }>({
      method: 'post',
      url: MPIN.FORGOT_VERIFY,
      params: { otp, newMpin },
    }),
};
