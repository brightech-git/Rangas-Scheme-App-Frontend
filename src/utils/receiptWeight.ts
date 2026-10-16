import { PaymentHistory, PPData } from '../types/Account/PhoneDetails';

// Preserve scientific notation (e.g. "4E-8"); stripping letters turns it into 4 grams.
function weightNumber(value: unknown): number {
  const parsed = Number(String(value ?? '').trim().replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Sum payment-level weights through this receipt, never the current scheme balance. */
export function receiptWeight(ppData: PPData, payment: PaymentHistory) {
  const timestamp = (value: string) => Date.parse(value.replace(' ', 'T'));
  const history = [...(ppData.paymentHistoryList ?? [])].sort((a, b) =>
    weightNumber(a.installment) - weightNumber(b.installment) ||
    (timestamp(a.updateTime) - timestamp(b.updateTime) || 0),
  );
  // Use the same instalment order as the history screen.
  // Stop at the actual selected receipt, including when several receipts
  // share an instalment number or timestamp.
  const selectedIndex = history.findIndex((row) => row === payment);
  const receiptIndex = selectedIndex >= 0 ? selectedIndex : history.findIndex((row) =>
    String(row.receiptNo) === String(payment.receiptNo) &&
    String(row.installment) === String(payment.installment) &&
    row.updateTime === payment.updateTime,
  );
  const rows = receiptIndex >= 0
    ? history.slice(0, receiptIndex + 1)
    : [...history.filter((row) => {
      const rowTime = timestamp(row.updateTime);
      const selectedTime = timestamp(payment.updateTime);
      return Number.isFinite(rowTime) && Number.isFinite(selectedTime) && rowTime < selectedTime;
    }), payment];

  const totals = rows.reduce((totals, row) => {
    totals.savedWeight += weightNumber(row.weight);
    totals.bonusWeight += weightNumber(row.bonusWeight);
    return totals;
  }, { savedWeight: 0, bonusWeight: 0 });

  if (__DEV__) {
    let runningTotal = 0;
    console.log('[ReceiptWeight] Calculation', JSON.stringify({
      selectedReceipt: payment.receiptNo,
      selectedInstalment: payment.installment,
      matchedHistoryIndex: receiptIndex,
      historyCount: history.length,
      includedPayments: rows.map((row) => {
        const weight = weightNumber(row.weight);
        const bonusWeight = weightNumber(row.bonusWeight);
        runningTotal += weight + bonusWeight;
        return {
          receiptNo: row.receiptNo,
          instalment: row.installment,
          rawWeight: row.weight,
          rawBonusWeight: row.bonusWeight,
          weight,
          bonusWeight,
          paymentTotal: weight + bonusWeight,
          runningTotal,
        };
      }),
      savedWeight: totals.savedWeight,
      bonusWeight: totals.bonusWeight,
      totalSavedWeight: totals.savedWeight + totals.bonusWeight,
      displayedTotal: `${(totals.savedWeight + totals.bonusWeight).toFixed(4)} g`,
    }, null, 2));
  }

  return totals;
}
