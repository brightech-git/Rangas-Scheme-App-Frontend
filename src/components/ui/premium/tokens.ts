// src/components/ui/premium/tokens.ts
//
// Shared helpers for the V2 "Noir Hero / Light Body" design language.
// UI-only: no business logic, no API awareness.

import type { TextStyle } from 'react-native';

/**
 * theme.js is plain JS, so string literals in FONTS widen to `string`
 * (e.g. textTransform: "uppercase"). This narrows them back for RN.
 */
export const asText = (style: unknown): TextStyle => style as TextStyle;

/** Metal code -> display label. Mirrors types/Scheme/Scheme.ts. */
export const METAL_NAME: Record<string, string> = {
  G: 'Gold',
  S: 'Silver',
  P: 'Platinum',
  D: 'Diamond',
};

/** Metal code -> Ionicons glyph. */
export const METAL_GLYPH: Record<string, string> = {
  G: 'diamond',
  S: 'ellipse',
  P: 'square',
  D: 'sparkles',
};

/** ₹ formatter — Indian grouping, no decimals by default. */
export function money(value?: number | string | null, decimals = 0): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (n == null || Number.isNaN(n)) return '—';
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/** Compact ₹ for tight tiles: ₹1.2L, ₹45.3K */
export function moneyCompact(value?: number | string | null): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}

/** Grams formatter. */
export function grams(value?: number | string | null, decimals = 3): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toFixed(decimals)} g`;
}

/** Safe date -> "12 Mar 2026". Returns the raw string if unparseable. */
export function prettyDate(raw?: string | null): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Safe date -> "12 Mar". */
export function shortDate(raw?: string | null): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

/** Clamp a 0..1 progress value. */
export const clamp01 = (n: number): number =>
  Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;

/** Time-of-day greeting. */
export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** First initial, uppercased, with a safe fallback. */
export const initial = (name?: string | null): string =>
  (name?.trim()?.[0] ?? 'U').toUpperCase();
