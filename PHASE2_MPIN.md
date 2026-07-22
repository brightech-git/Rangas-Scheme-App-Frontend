# Phase 2 — MPIN Security Flow (Results)

Status: **done**. Date: 2026-07-22. `tsc --noEmit` passes clean (0 errors).

## Scope

Four screens: `CreateMpinScreen`, `VerifyMpinScreen`, `ForgotAndVerifyMpinScreen`, `ResetMpinScreen`.

## The problem found

Same pattern as Phase 1: all four MPIN screens imported the **static** theme and built module-scope stylesheets, so they were frozen to light mode. Each also used `COLORS.white` for its card, which stayed white in dark mode.

## What changed

Each screen converted to the reactive `useTheme()` hook with a memoized `makeStyles(theme)` factory; every card's `COLORS.white` → `COLORS.card` so it follows the theme.

| Screen | Notes |
|--------|-------|
| `CreateMpinScreen.tsx` | 2-step set/confirm PIN; step-indicator dots use `gray200`/`primary` tokens (now dark-correct) |
| `VerifyMpinScreen.tsx` | MPIN login; brand/greeting + forgot/switch-account footer |
| `ForgotAndVerifyMpinScreen.tsx` | send-OTP → verify + new MPIN; card fix + auto-detect banner |
| `ResetMpinScreen.tsx` | verify current → set new MPIN |

## Result (guardrails)

All four screens: **0 static theme imports, 0 hardcoded hex, 0 `COLORS.white`**, now fully theme-reactive.

## Existing behavior confirmed (no gaps to fill)

- **Confirm-PIN mismatch** handling exists in Create (resets to step 1 with error).
- **OTP resend countdown** (`resendCountdown={30}`) + Android SMS auto-detect already wired in ForgotAndVerify.
- **"MPIN already set" (409)** is handled → redirects to MPIN login.
- **New ≠ old MPIN** guard exists in Reset.
- **Incorrect-MPIN** errors surface via toast + inline error on Verify.

## Deferred (needs product decision + native dependency)

- **Biometric unlock** (Face ID / fingerprint) on the Verify screen — requires adding `expo-local-authentication` and a settings toggle; not added here to avoid an untested native dependency. Recommend handling in Phase 6 polish or as a dedicated task.
- **Client-side attempt lockout** — currently lockout relies on backend error messages. A local attempt-counter + cooldown could be added if desired; flagged for product input.

## Verification

- `npx tsc --noEmit` → 0 errors.
- Grep confirms all four screens are token-only and reactive.

## Suggested manual QA

On device, in both light and dark: create MPIN (with a deliberate mismatch), log in with MPIN, run forgot-MPIN (OTP → new PIN), and change MPIN. Toggle theme mid-flow to confirm cards/keypad update live.
