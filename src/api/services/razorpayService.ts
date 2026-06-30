// src/api/services/razorpayService.ts

import { callApi } from '../apiClient';
import { RAZORPAY } from '../endpoints';
import {
  ApiResponse,
  CreateOrderRequest,
  CreateOrderData,
  VerifyPaymentRequest,
  VerifyPaymentData,
  PaymentFailedRequest,
} from '../../types/Razorpay/Razorpay';

export const razorpayService = {
  /** Step 1 — create a Razorpay order on the server */
  createOrder: (body: CreateOrderRequest) =>
    callApi<CreateOrderRequest, ApiResponse<CreateOrderData>>({
      method: 'post',
      url:    RAZORPAY.CREATE_ORDER,
      data:   body,
    }),

  /** Step 2 — verify signature after successful Razorpay checkout */
  verifyPayment: (body: VerifyPaymentRequest) =>
    callApi<VerifyPaymentRequest, ApiResponse<VerifyPaymentData>>({
      method: 'post',
      url:    RAZORPAY.VERIFY_PAYMENT,
      data:   body,
    }),

  /** Step 3 (failure path) — notify server that payment was cancelled / failed */
  markFailed: (razorpay_order_id: string) =>
    callApi<PaymentFailedRequest, ApiResponse<null>>({
      method: 'post',
      url:    RAZORPAY.PAYMENT_FAILED,
      // Backend reads body.get("razorpay_order_id") (lowercase)
      data:   { razorpay_order_id },
    }),

  /** Get payment details by receipt */
  getByReceipt: (receipt: string) =>
    callApi<null, ApiResponse<unknown>>({
      method: 'get',
      url:    RAZORPAY.RECEIPT(receipt),
    }),
};
