// src/api/services/paymentService.ts

import { callApi } from '../apiClient';
import { PAYMENTS } from '../endpoints';
import {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  PaymentStatusResponse,
} from '../../types/Payment/Payment';

export const paymentService = {
  initiate: (body: InitiatePaymentRequest) =>
    callApi<InitiatePaymentRequest, InitiatePaymentResponse>({
      method: 'post',
      url:    PAYMENTS.INITIATE,
      data:   body,
    }),

  getStatus: (orderId: string) =>
    callApi<null, PaymentStatusResponse>({
      method: 'get',
      url:    PAYMENTS.STATUS(orderId),
    }),
};
