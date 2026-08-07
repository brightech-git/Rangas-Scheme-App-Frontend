// src/utils/schemeMetrics.ts
//
// Single source of truth for scheme figures shown in the UI.
//
// WHY THIS EXISTS
//   Bonus is optional in this deployment and is NOT part of the product,
//   so `bonusAmount`, `bonusPercent` and `totalAmountWithBonus` are
//   deliberately ignored everywhere. Screens used to read them directly,
//   which meant a member with no bonus configured saw "₹0 bonus" cards
//   and a maturity value identical to their principal — noise, not
//   information.
//
//   Everything below is derived from fields the backend always sends:
//     schemeSummary.instalment                    total instalments
//     schemeSummary.schemaSummaryTransBalance     insPaid / amtrecd
//     schemeSummary.totalWeight / lastWeight      metal accrued
//     amount                                      per-instalment amount
//     totalAmount                                 principal paid to date
//     nextDueDate / maturityDate / remainingDueDates
//
// Pure functions — no API calls, no hooks, no side effects.

import { PPData } from '../types/Account/PhoneDetails';

/** Tolerant numeric parse — the API mixes strings and numbers. */
export const num = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = parseFloat(String(v ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isNaN(n) ? 0 : n;
};

export type SchemeMetrics = {
  /** Instalments settled so far */
  paid: number;
  /** Instalments in the scheme (0 when the backend omits it) */
  total: number;
  /** Instalments still owed */
  left: number;
  /** Amount of one instalment */
  perInstalment: number;
  /** Principal paid to date (never includes bonus) */
  invested: number;
  /** Full commitment: perInstalment x total. 0 when total is unknown. */
  committed: number;
  /** Still to pay across the remaining term */
  remaining: number;
  /** 0..1 completion by instalment count */
  progress: number;
  /** Metal accrued, in grams */
  weight: number;
  /** Metal added by the most recent payment, in grams */
  lastWeight: number;
  /** true once the scheme has a close type set */
  closed: boolean;
  /** 'active' | 'pending' | 'completed' */
  state: 'active' | 'pending' | 'completed';
  nextDueDate: string | null;
  maturityDate: string | null;
  /** Remaining scheduled due dates, when the backend supplies them */
  dueDatesLeft: number;
};

export function schemeMetrics(pp: PPData): SchemeMetrics {
  const s = pp?.schemeSummary;
  const bal = s?.schemaSummaryTransBalance;

  const paid = Math.max(0, Math.floor(num(bal?.insPaid)));
  const total = Math.max(0, Math.floor(num(s?.instalment)));

  // `amount` is the per-instalment figure. Fall back to deriving it from
  // what has actually been received, so the card still shows something
  // sensible on schemes where `amount` comes back empty.
  const perInstalment =
    num(pp?.amount) || (paid > 0 ? num(bal?.amtrecd || pp?.totalAmount) / paid : 0);

  // amtrecd is the bonus-free received total; totalAmount is the same
  // figure at the root. Prefer amtrecd, fall back to totalAmount.
  const invested = num(bal?.amtrecd) || num(pp?.totalAmount);

  const committed = total > 0 ? perInstalment * total : 0;
  const remaining = committed > 0 ? Math.max(0, committed - invested) : 0;

  const closed = (pp?.schemeClosedSummary?.closeType ?? '').trim() !== '';
  const state: SchemeMetrics['state'] = closed
    ? 'completed'
    : paid > 0
    ? 'active'
    : 'pending';

  return {
    paid,
    total,
    left: total > 0 ? Math.max(0, total - paid) : 0,
    perInstalment,
    invested,
    committed,
    remaining,
    progress: total > 0 ? Math.min(1, Math.max(0, paid / total)) : 0,
    weight: num(s?.totalWeight),
    lastWeight: num(s?.lastWeight),
    closed,
    state,
    nextDueDate: pp?.nextDueDate || null,
    maturityDate: pp?.maturityDate || null,
    dueDatesLeft: Array.isArray(pp?.remainingDueDates)
      ? pp.remainingDueDates.length
      : 0,
  };
}

export type PortfolioMetrics = {
  /** Every enrolment, including closed ones */
  count: number;
  activeCount: number;
  closedCount: number;
  /** Principal paid across all schemes */
  invested: number;
  /** Full commitment across all OPEN schemes */
  committed: number;
  /** Still to pay across all OPEN schemes */
  remaining: number;
  /** Metal accrued across all schemes, in grams */
  weight: number;
  /** Instalments paid / total, summed across OPEN schemes */
  paid: number;
  totalInstalments: number;
  instalmentsLeft: number;
  /** 0..1 overall completion by instalment count (open schemes) */
  progress: number;
  /** Sum of one instalment across all open schemes — the monthly outgoing */
  monthlyOutgoing: number;
  /** Soonest upcoming due date across open schemes, ISO string */
  nextDueDate: string | null;
};

export function portfolioMetrics(list: PPData[]): PortfolioMetrics {
  const rows = (list ?? []).map(schemeMetrics);
  const open = rows.filter((r) => !r.closed);

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  const committed = sum(open.map((r) => r.committed));
  const investedOpen = sum(open.map((r) => r.invested));
  const paid = sum(open.map((r) => r.paid));
  const totalInstalments = sum(open.map((r) => r.total));

  const dues = (list ?? [])
    .filter((p) => (p?.schemeClosedSummary?.closeType ?? '').trim() === '')
    .map((p) => p?.nextDueDate)
    .filter(Boolean)
    .map((d) => new Date(d as string))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  return {
    count: rows.length,
    activeCount: open.length,
    closedCount: rows.length - open.length,
    invested: sum(rows.map((r) => r.invested)),
    committed,
    remaining: Math.max(0, committed - investedOpen),
    weight: sum(rows.map((r) => r.weight)),
    paid,
    totalInstalments,
    instalmentsLeft: Math.max(0, totalInstalments - paid),
    progress: totalInstalments > 0 ? Math.min(1, paid / totalInstalments) : 0,
    monthlyOutgoing: sum(open.map((r) => r.perInstalment)),
    nextDueDate: dues[0] ? dues[0].toISOString() : null,
  };
}
