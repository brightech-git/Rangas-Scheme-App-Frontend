// src/api/hooks/Razorpay/useRazorpay.ts

import { useState, useRef } from 'react';
import { razorpayService } from '../../services/razorpayService';
import {
  CreateOrderRequest,
  CreateOrderData,
  VerifyPaymentData,
  RazorpaySuccessPayment,
  RazorpayError,
  UserDetails,
} from '../../../types/Razorpay/Razorpay';

export type PaymentStatus =
  | 'idle'
  | 'creating_order'
  | 'checkout_open'
  | 'verifying'
  | 'success'
  | 'failed'
  | 'cancelled';

export interface UseRazorpayReturn {
  status:     PaymentStatus;
  orderData:  CreateOrderData | null;
  verifyData: VerifyPaymentData | null;
  error:      string | null;
  pay: (
    orderReq:        CreateOrderRequest,
    checkoutOptions: Record<string, any>,
    userDetails?:    UserDetails,
    afterVerify?:    AfterVerifyFn,
  ) => Promise<void>;
  reset: () => void;
}

/**
 * Optional hook invoked AFTER the payment signature is verified and BEFORE the
 * status flips to 'success'. Receives the raw Razorpay success payload (with the
 * payment / order ids) so the caller can create a member, post an installment,
 * etc. If it throws, the flow is marked as 'failed'.
 */
export type AfterVerifyFn = (
  payment:    RazorpaySuccessPayment,
  verifyData: VerifyPaymentData | null,
) => Promise<void> | void;

/**
 * Orchestrates the 3-step Razorpay flow:
 *   1. create-order  -> get order_id + key
 *   2. open WebView checkout -> user pays
 *   3. verify-payment (with userDetails) OR payment-failed
 */
export function useRazorpay(): UseRazorpayReturn {
  const [status,     setStatus]     = useState<PaymentStatus>('idle');
  const [orderData,  setOrderData]  = useState<CreateOrderData | null>(null);
  const [verifyData, setVerifyData] = useState<VerifyPaymentData | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const orderIdRef = useRef<string | null>(null);

  const reset = () => {
    setStatus('idle');
    setOrderData(null);
    setVerifyData(null);
    setError(null);
    orderIdRef.current = null;
  };

  const pay = async (
    orderReq:        CreateOrderRequest,
    checkoutOptions: Record<string, any>,
    userDetails?:    UserDetails,
    afterVerify?:    AfterVerifyFn,
  ) => {
    const { _checkoutFn, ...rzpOptions } = checkoutOptions;

    if (!_checkoutFn) {
      setError('_checkoutFn not provided');
      setStatus('failed');
      return;
    }

    try {
      // ── Step 1: Create order ──────────────────────────────────
      setStatus('creating_order');
      setError(null);

      const createRes = await razorpayService.createOrder(orderReq);
      if (!createRes.data) throw new Error(createRes.message ?? 'Order creation failed');

      const order = createRes.data;
      orderIdRef.current = order.order_id;
      setOrderData(order);

      // ── Step 2: Open Razorpay WebView checkout ────────────────
      setStatus('checkout_open');

      const paymentData: RazorpaySuccessPayment = await _checkoutFn({
        ...rzpOptions,
        key:      order.key,
        order_id: order.order_id,
        amount:   order.amount,
        currency: order.currency ?? 'INR',
        prefill: {
          name:    order.name    ?? rzpOptions.prefill?.name    ?? '',
          email:   order.email   ?? rzpOptions.prefill?.email   ?? '',
          contact: order.contact ?? rzpOptions.prefill?.contact ?? '',
        },
      });

      // ── Step 3: Build verify payload ──────────────────────────
      setStatus('verifying');

      // NOTE: /razorpay/verify-payment binds @RequestBody Map<String,String>
      // on the backend, so it ONLY accepts the three flat string fields below.
      // Sending a nested `userDetails` object makes Spring reject the request
      // with a generic 400 before the controller runs. Member creation is done
      // separately via the `afterVerify` callback (-> /api/v1/member/create).
      const verifyPayload = {
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_order_id:   paymentData.razorpay_order_id,
        razorpay_signature:  paymentData.razorpay_signature,
      };

      // ── Log outgoing verify-payment body ──────────────────────
      console.log('=== /verify-payment REQUEST BODY ===');
      console.log(JSON.stringify(verifyPayload, null, 2));
      console.log('====================================');

      const verifyRes = await razorpayService.verifyPayment(verifyPayload);

      setVerifyData(verifyRes.data ?? null);

      // ── Step 4: Post-verify side-effect (e.g. create member) ──
      // Runs only after the signature is verified. If it fails, the whole
      // flow is treated as failed so the user can retry.
      if (afterVerify) {
        await afterVerify(paymentData, verifyRes.data ?? null);
      }

      setStatus('success');

    } catch (err: any) {
      const rzpErr = err as RazorpayError;
      const isCancelled =
        rzpErr?.code === 'BAD_REQUEST_ERROR' &&
        rzpErr?.description?.toLowerCase().includes('cancel');

      if (isCancelled) {
        setStatus('cancelled');
      } else {
        setStatus('failed');
        setError(
          rzpErr?.description ??
          (err as any)?.message ??
          'Payment failed. Please try again.',
        );
      }

      if (orderIdRef.current) {
        razorpayService.markFailed(orderIdRef.current).catch(() => {});
      }
    }
  };

  return { status, orderData, verifyData, error, pay, reset };
}
