// src/api/hooks/Payment/usePayment.ts

import { useState } from 'react';
import { paymentService } from '../../services/paymentService';
import {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  PaymentStatusResponse,
} from '../../../types/Payment/Payment';

export type PaymentStatus = 'idle' | 'initiating' | 'pending' | 'success' | 'failed';

export interface UsePaymentReturn {
  status:       PaymentStatus;
  initiateData: InitiatePaymentResponse | null;
  statusData:   PaymentStatusResponse | null;
  error:        string | null;
  initiate:     (body: InitiatePaymentRequest, onInitiated: (url: string, orderId: string) => void) => Promise<void>;
  checkStatus:  (orderId: string) => Promise<PaymentStatusResponse | undefined>;
  reset:        () => void;
}

export function usePayment(): UsePaymentReturn {
  const [status,       setStatus]       = useState<PaymentStatus>('idle');
  const [initiateData, setInitiateData] = useState<InitiatePaymentResponse | null>(null);
  const [statusData,   setStatusData]   = useState<PaymentStatusResponse | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  const reset = () => {
    setStatus('idle');
    setInitiateData(null);
    setStatusData(null);
    setError(null);
  };

  const initiate = async (
    body: InitiatePaymentRequest,
    onInitiated: (url: string, orderId: string) => void,
  ) => {
    try {
      setStatus('initiating');
      setError(null);

      const res = await paymentService.initiate(body);

      setInitiateData(res);
      setStatus('pending');

      // Open the CCAvenue WebView
      onInitiated(res.initiateUrl, res.orderId);
    } catch (err: any) {
      setStatus('failed');
      setError(err?.message ?? 'Payment initiation failed');
    }
  };

  const checkStatus = async (orderId: string) => {
    try {
      console.log('[usePayment] checkStatus → calling API for orderId:', orderId);
      const res = await paymentService.getStatus(orderId);
      console.log('[usePayment] checkStatus ← response:', JSON.stringify(res, null, 2));
      setStatusData(res);

      // API returns orderStatus: 'SUCCESSFUL' | 'UNSUCCESSFUL'
      // with a legacy status field as fallback
      const raw = (res.orderStatus ?? res.status ?? '').toUpperCase();
      console.log('[usePayment] checkStatus raw status:', raw);
      if (raw === 'SUCCESSFUL' || raw === 'SUCCESS' || raw === 'CAPTURED') {
        setStatus('success');
      } else if (raw === 'UNSUCCESSFUL' || raw === 'FAILED' || raw === 'FAILURE') {
        setStatus('failed');
        setError(res.failureMessage ?? res.statusMessage ?? res.message ?? 'Payment was unsuccessful');
      } else {
        setStatus('pending');
      }
      return res;
    } catch (err: any) {
      console.log('[usePayment] checkStatus ✗ error:', err);
      setStatus('failed');
      setError(err?.message ?? 'Status check failed');
    }
  };

  return { status, initiateData, statusData, error, initiate, checkStatus, reset };
}
