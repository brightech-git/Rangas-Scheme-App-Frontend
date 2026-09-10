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
  checkStatus:  (orderId: string) => Promise<void>;
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

      console.log('=== POST /api/v1/payments/initiate REQUEST ===');
      console.log(JSON.stringify(body, null, 2));
      console.log('=============================================');

      const res = await paymentService.initiate(body);

      console.log('=== POST /api/v1/payments/initiate RESPONSE ===');
      console.log(JSON.stringify(res, null, 2));
      console.log('===============================================');

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
      console.log(`=== GET /api/v1/payments/status/${orderId} REQUEST ===`);

      const res = await paymentService.getStatus(orderId);

      console.log(`=== GET /api/v1/payments/status/${orderId} RESPONSE ===`);
      console.log(JSON.stringify(res, null, 2));
      console.log('======================================================');

      setStatusData(res);

      const s = res.status?.toLowerCase();
      if (s === 'success' || s === 'captured')          setStatus('success');
      else if (s === 'failed' || s === 'failure')       { setStatus('failed'); setError(res.message ?? 'Payment failed'); }
      else                                               setStatus('pending');
    } catch (err: any) {
      setStatus('failed');
      setError(err?.message ?? 'Status check failed');
    }
  };

  return { status, initiateData, statusData, error, initiate, checkStatus, reset };
}
