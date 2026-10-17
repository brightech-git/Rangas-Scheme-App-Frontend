import { PaymentHistory } from '../types/Account/PhoneDetails';

/** Payment metadata for the selected receipt, in display order. */
export function paymentDetails(payment: PaymentHistory) {
  return [
    { label: 'Payment Mode', value: payment.paymentMode },
    { label: 'Tracking ID', value: payment.trackingId },
    { label: 'Order ID', value: payment.orderId },
    { label: 'Order Status', value: payment.orderStatus },
    { label: 'Bank Ref No', value: payment.bankRefNo },
    { label: 'Bank Name', value: payment.bankName },
    { label: 'Payment', value: payment.chqBankCode },
    { label: 'Transaction No', value: payment.chq_CardNo },
    { label: 'Bank', value: payment.chqBank },
    { label: 'Branch', value: payment.chqBranch },
  ].map(({ label, value }) => ({ label, value: String(value ?? '').trim() }))
    .filter(({ value }) => value !== '' && value.toUpperCase() !== 'N/A');
}
