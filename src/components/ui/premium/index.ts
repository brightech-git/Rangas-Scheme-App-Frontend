// src/components/ui/premium/index.ts
//
// V2 "Noir Hero / Light Body" UI kit.
// Presentation only — every component here is driven by AppTheme
// tokens and takes plain props. No hooks, services or API awareness.

// ── Scaffolding ────────────────────────────────────────────────
export { default as ScreenCanvas } from './ScreenCanvas';
export { default as AuthShell } from './AuthShell';
export { default as DashboardHeader } from './DashboardHeader';
export { default as PageHeader } from './PageHeader';
export { default as SectionHeading } from './SectionHeading';
export { default as BottomActionBar } from './BottomActionBar';

// ── Surfaces ───────────────────────────────────────────────────
export { default as HeroCard } from './HeroCard';
export { default as SummaryCard } from './SummaryCard';
export { default as MetricCard } from './MetricCard';
export { default as WalletCard } from './WalletCard';
export { default as SchemeCardV2 } from './SchemeCardV2';
export { default as FeatureCard } from './FeatureCard';
export { default as AnalyticsCard } from './AnalyticsCard';
export { default as GoldRateWidget } from './GoldRateWidget';
export { default as TimelineCard } from './TimelineCard';
export { default as DashboardGrid } from './DashboardGrid';

// ── Controls & atoms ───────────────────────────────────────────
export { default as PremiumButton } from './PremiumButton';
export { default as FormField } from './FormField';
export { default as PaymentTile } from './PaymentTile';
export { default as StatusChip } from './StatusChip';
export { default as ProgressWidget } from './ProgressWidget';
export { default as FloatingWidget } from './FloatingWidget';
export { default as Sparkline } from './Sparkline';

// ── States ─────────────────────────────────────────────────────
export { default as EmptyState } from './EmptyState';
export {
  default as Skeleton,
  Skeleton as SkeletonBlock,
  SkeletonMetric,
  SkeletonSchemeCard,
  SkeletonTimeline,
  SkeletonHero,
} from './SkeletonLoader';

// ── Helpers ────────────────────────────────────────────────────
export {
  asText,
  money,
  moneyCompact,
  grams,
  prettyDate,
  shortDate,
  clamp01,
  greeting,
  initial,
  METAL_NAME,
  METAL_GLYPH,
} from './tokens';

// ── Types ──────────────────────────────────────────────────────
export type { HeroStat } from './HeroCard';
export type { SummaryRow } from './SummaryCard';
export type { MetricTone } from './MetricCard';
export type { SchemeCardStat } from './SchemeCardV2';
export type { GridAction } from './DashboardGrid';
export type { TimelineEntry, TimelineTone } from './TimelineCard';
export type { ChipTone, ChipSurface } from './StatusChip';
export type { RangeOption } from './AnalyticsCard';
export type { PageHeaderAction } from './PageHeader';
export type {
  PremiumButtonVariant,
  PremiumButtonSize,
} from './PremiumButton';
