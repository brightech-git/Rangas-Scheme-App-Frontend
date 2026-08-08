// src/utils/buildReceiptData.ts
//
// Maps the app's domain objects (PPData + PaymentHistory + Company) onto the
// ReceiptData shape the PDF engine expects. Kept separate so PaymentReceiptPDF
// stays free of app-specific types and can be unit-tested on plain objects.

import { PPData, PaymentHistory } from '../types/Account/PhoneDetails';
import { Company } from '../types/Company/Company';
import { schemeMetrics } from './schemeMetrics';
import type { ReceiptData } from './PaymentReceiptPDF';

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isNaN(n) ? 0 : n;
};

const clean = (v: unknown): string | undefined => {
  const s = String(v ?? '').trim();
  return s && s !== 'null' && s !== 'undefined' ? s : undefined;
};

/** Human-readable payment mode from the backend's cheque/bank fields. */
function paymentMode(p: PaymentHistory): string {
  const bank = clean(p.chqBank);
  if (bank && /razor/i.test(bank)) return 'Online · Razorpay';
  if (clean(p.chq_CardNo)) return 'Card / Online';
  if (bank) return 'Bank';
  return 'Cash';
}

export function buildReceiptData(
  ppData: PPData,
  payment: PaymentHistory,
  company?: Company | null,
): ReceiptData {
  const mx = schemeMetrics(ppData);
  const pi = ppData.personalInfo;

  const addressLines = [
    clean(company?.ADDRESS1),
    clean(company?.ADDRESS2),
    clean(company?.ADDRESS3),
    clean(company?.ADDRESS4),
  ].filter(Boolean) as string[];

  const memberAddress = [
    [clean(pi?.doorNo), clean(pi?.area)].filter(Boolean).join(', '),
    [clean(pi?.city), clean(pi?.state), clean(pi?.pinCode)].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join('\n');

  return {
    company: {
      name: clean(company?.COMPANYNAME) ?? 'Rangas DigiGold',
      addressLines,
      phone: clean(company?.PHONE),
      email: clean(company?.EMAIL),
      // The backend exposes several tax numbers; GSTIN maps to LOCALTAXNO here.
      gstin: clean(company?.LOCALTAXNO) ?? clean(company?.TINNO),
      logoUrl: clean(company?.LOGO),
    },
    member: {
      name: clean(ppData.pName) ?? clean(pi?.pName) ?? 'Member',
      memberId: clean(pi?.personalId),
      regNo: ppData.regNo,
      groupCode: clean(ppData.groupCode),
      mobile: [clean(pi?.mobile), clean(pi?.mobile2)].filter(Boolean).join(' · ') || undefined,
      address: memberAddress || undefined,
    },
    payment: {
      receiptNo: clean(payment.receiptNo) ?? '—',
      amount: num(payment.amount),
      installmentNo: clean(payment.installment),
      paidAt: clean(payment.updateTime),
      weight: num(payment.weight) || undefined,
      mode: paymentMode(payment),
      bank: clean(payment.chqBank),
      branch: clean(payment.chqBranch),
      reference: clean(payment.chq_CardNo),
    },
    scheme: {
      name: clean(ppData.schemeSummary?.schemeName) ?? 'Savings scheme',
      code: clean(ppData.schemeSummary?.schemeSName),
      totalInstalments: mx.total || undefined,
      paidInstalments: mx.paid,
      paidToDate: mx.invested,
      // Bonus is not part of this product, so the receipt reports the
      // commitment balance instead of a maturity-with-bonus figure.
      remaining: mx.remaining || undefined,
      maturityDate: clean(ppData.maturityDate),
      nextDueDate: clean(ppData.nextDueDate),
    },
  };
}
