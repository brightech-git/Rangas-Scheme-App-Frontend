// src/api/services/paymentService.ts

import { callApi } from '../apiClient';
import { PAYMENTS } from '../endpoints';
import {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  PaymentStatusResponse,
} from '../../types/Payment/Payment';

export const paymentService = {
  initiate: (body: InitiatePaymentRequest) => {
    console.log('[paymentService] initiate payload:', JSON.stringify(body, null, 2));
    return callApi<InitiatePaymentRequest, InitiatePaymentResponse>({
      method: 'post',
      url:    PAYMENTS.INITIATE,
      data:   body,
    });
  },

  getStatus: (orderId: string) => {
    console.log('[paymentService] getStatus → orderId:', orderId, 'url:', PAYMENTS.STATUS(orderId));
    return callApi<null, PaymentStatusResponse>({
      method: 'get',
      url:    PAYMENTS.STATUS(orderId),
    }).then((res) => {
      console.log('[paymentService] getStatus ← response:', JSON.stringify(res, null, 2));
      return res;
    });
  },
};
