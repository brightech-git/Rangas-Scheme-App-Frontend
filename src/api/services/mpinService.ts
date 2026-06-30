// src/api/services/mpinService.ts

import { callApi } from '../apiClient';
import { MPIN } from '../endpoints';

export const mpinService = {
  create: (mpin: string) =>
    callApi<null, string>({
      method: 'post',
      url: MPIN.CREATE,
      params: { mpin },
    }),

  verify: (enteredMpin: string) =>
    callApi<null, string>({
      method: 'post',
      url: MPIN.VERIFY,
      params: { enteredMpin },

      
    }),

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
