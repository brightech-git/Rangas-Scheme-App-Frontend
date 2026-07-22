# Phase 5 — Build Out Stub Screens (Results)

Status: **done**. Date: 2026-07-22. `tsc --noEmit` passes clean (0 errors). All three screens are theme-tokenized (0 raw hex/rgba).

## Important discovery

The three "screens" existed as 21-line placeholder files but were **never registered in the navigator** — they were orphan files. Home's quick actions called `navigate('BuyGold')` / `navigate('Transactions')` against routes that didn't exist. Phase 5 both built them out and wired them in.

## What was built

### PortfolioScreen (21 → 226 lines) — real data
Uses `useMySchemes()` (`PPData[]`). Computes a live holdings summary and renders:
- A value hero (total portfolio value, total weight in grams, total bonus).
- Four stat tiles: Invested, Schemes, Active, Completed.
- A holdings list — one card per scheme (name, reg #, join date, active/completed badge, invested / weight / next-due). Tapping an active scheme opens `PayInstallment`.
- Loading spinner, error state (retry), and empty state (→ browse schemes), all via `AppEmptyState` / theme tokens. Pull-to-refresh via `ScreenWrapper`.

### TransactionsScreen (21 → 198 lines) — real data
Flattens `paymentHistoryList` across all `mySchemes` into a single date-sorted feed:
- Summary strip (total paid + payment count for the current filter).
- Per-scheme filter chips (All + one per scheme).
- Transaction rows: scheme name, date, instalment #, receipt #, amount, weight.
- `FlatList` with pull-to-refresh; loading / error / empty states.

### BuyGoldScreen (21 → 205 lines) — live-rate calculator
- Live gold rate (916) from `ratesService.getRates()` with a refresh button.
- Two-way calculator: **By Amount (₹)** ↔ **By Weight (g)**, with quick-amount chips (₹500–₹5,000) and a "you pay / you get" conversion summary.

**Deliberate decision on payment:** the existing Razorpay flow is tightly bound to scheme/installment domain data (GROUPCODE, REGNO, installment recording via `/account/insert`). There is **no generic "buy gold" order endpoint or fulfilment path**. Wiring live checkout here would risk charging money without recording a purchase, so the "Buy Gold" CTA currently shows an "instant buy coming soon" message and routes the user to the supported savings path (schemes). The calculator + live rate are fully functional; only the purchase settlement is intentionally deferred until a backend endpoint exists.

## Wiring

- `navigation/index.ts` — exported the three screens.
- `navigation/RootNavigator.tsx` — added `BuyGold` / `Portfolio` / `Transactions` to `RootStackParamList` and registered `Stack.Screen`s (slide-from-right).
- Entry points: **BuyGold** and **Transactions** are reachable from the Home quick-action strip (now that the routes exist); **Portfolio** and **Transactions** were also added as rows in Profile → Account & Security.

## Reused building blocks

`ScreenWrapper`, `SubPageHeader`, `AppEmptyState`, `useTheme` + `makeStyles` factories, theme tokens, `useMySchemes`, `ratesService`, `useToast`. No new dependencies.

## Verification

- `npx tsc --noEmit` → 0 errors.
- Grep: 0 raw hex/rgba in all three new screens.
- Routes registered in `RootNavigator` and exported from the barrel.

## Deferred / recommended

- **BuyGold purchase settlement** — needs a backend "buy digital gold" order + fulfilment endpoint before enabling live checkout.
- Portfolio growth chart (value over time) — needs a historical-value endpoint; current screen shows current-state holdings.

## Suggested manual QA

On device (both themes): open Portfolio (with and without schemes), Transactions (filter by scheme, pull to refresh), and BuyGold (toggle amount/weight, quick chips, refresh rate). Confirm the Home quick actions for Buy Gold / History now navigate correctly, and the Profile → My Portfolio / Transactions rows work.
