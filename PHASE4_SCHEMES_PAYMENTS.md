# Phase 4 — Schemes & Payments (Results)

Status: **done** (tokenization + review). Date: 2026-07-22. `tsc --noEmit` passes clean (0 errors).

## Scope

`SchemeTermsScreen` (260), `SchemeJoinScreen` (1460), `PayInstallmentScreen` (551), `RatesScreen` (377). All four already used `useTheme()`.

## What changed

### PayInstallmentScreen (payment-critical)
- Two summary cards + the custom-amount input used `COLORS.white` backgrounds → **`COLORS.card`** (dark-mode fix).
- Failure modal icon `#E53935` / `#E5393518` → `COLORS.error` / `COLORS.error + '18'`.
- Modal backdrop scrim → `COLORS.blackOpacity50` (tokenized).
- `COLORS.white` on the pay button / spinner / modal buttons left as-is (button text, correct in both themes).

### SchemeJoinScreen (the 1,460-line screen)
- The recurring validation-error red `#E53935` (used ~13 times across the field component, DOB picker, age warning, and failure modal) → **`COLORS.error`**; its tint backgrounds `#FFEBEE` / `#E5393512` / `#E5393518` → `COLORS.errorBg` / `COLORS.error + '12'` / `+ '18'`.
- "Optional" chip `#F2F4F7` / `#6B7280` → `COLORS.gray100` / `COLORS.textTertiary`.
- The field component and DOB modal receive a `colors` prop, so edits used `colors.error` there; the main component used `COLORS.error`.

### RatesScreen
- Gain/loss green `#22C55E` / red `#EF4444` (change pills, icons, absolute change, and the history `RateRow`) → **`COLORS.success` / `COLORS.error`**, consistent with the Home rate pills.

### SchemeTermsScreen
No changes needed — its three `COLORS.white` uses are all button text/icon.

## Razorpay flow — reviewed, not modified

The payment pipeline is **correctly and securely structured**, so no changes were made:
`razorpayService.createOrder` → open checkout → `verifyPayment` (**server-side signature verification**) → optional `afterVerify` hook (create member / post installment) → `success`; with a `markFailed` path for cancel/failure. `useRazorpay` exposes a clean `status` state machine (`idle → creating_order → checkout_open → verifying → success/failed/cancelled`). Payment logic is intentionally left untouched — it can't be safely end-to-end tested from here.

## Accepted exceptions (theme-independent by design)

- **Modal backdrop scrims** in `SchemeJoinScreen` (4× `rgba(0,0,0,0.45–0.55)`) — dark translucent backdrops render correctly in both themes; left as-is. (Pay/Profile scrims were tokenized opportunistically where a single `COLORS` scope was obvious.)
- **Metal colors** in `RatesScreen` — `goldColor #C9A84C` / `silverColor #7A8FA6` represent the physical metals; fixed by design.
- **Neutral chart-axis gray** `#9CA3AF` and **white tooltip text** (on a colored tooltip) in the Rates mini-chart — theme-independent.
- **`COLORS.white`** used as button/CTA text across all four screens — correct in both themes.

## Deferred (recommended, not done here)

- **Refactor `SchemeJoinScreen` (1,460 lines) into subcomponents** (form steps, summary, T&C, DOB picker, result modals). This is a large structural change and is risky to do without the ability to run the app; recommend tackling it as a dedicated task with device testing, separate from the theming pass.

## Verification

- `npx tsc --noEmit` → 0 errors.
- Raw-color grep: SchemeTerms 0, PayInstallment 0, RatesScreen 5 (all accepted exceptions), SchemeJoin 4 (backdrop scrims).

## Suggested manual QA

On device, both light + dark: join a scheme (SchemeTerms → SchemeJoin form, DOB/age validation, dropdowns), and pay an installment on a **test** Razorpay account (preset + custom amount, success + failure modals). Toggle theme mid-flow.
