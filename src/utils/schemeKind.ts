// src/utils/schemeKind.ts
//
// A scheme's payment shape is fully determined by three backend flags
// (see GET /schemes): FixedIns, Instalment, WeightLedger. Three shapes
// fall out of that combination:
//
//   'fixed'    FixedIns=Y                               — member picks one of a fixed set of
//                                                          monthly amounts (a GROUPCODE/REGNO group)
//   'lumpsum'  FixedIns=N, Instalment<=1                 — a single one-time payment, no
//                                                          recurring instalments after it
//   'flexible' FixedIns=N, Instalment>1, WeightLedger=Y  — pay any number of times, any
//                                                          amount, entered by rupees or by
//                                                          gram weight (DigiGold-style)
//
// Both ApiScheme (catalogue, PascalCase fields) and SchemeSummary (an
// existing enrolment, camelCase fields) carry the same three flags
// under different casing, so callers just pass the three raw values.

import { num } from './schemeMetrics';

export type SchemeKind = 'fixed' | 'lumpsum' | 'flexible';

export function classifySchemeKind(
  fixedIns?: string | null,
  instalment?: number | string | null,
  weightLedger?: string | null,
): SchemeKind {
  if (fixedIns === 'Y') return 'fixed';
  if (weightLedger === 'Y' && num(instalment) > 1) return 'flexible';
  return 'lumpsum';
}
