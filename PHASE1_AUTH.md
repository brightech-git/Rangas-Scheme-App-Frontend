# Phase 1 — Onboarding & Auth (Results)

Status: **done**. Date: 2026-07-22. `tsc --noEmit` passes clean (0 errors).

## The core problem found

8 of the 9 auth screens imported the **static** theme (`import { COLORS, ... } from '../../theme/theme'`) and built their `StyleSheet` at module scope. That meant they were frozen to the light palette and **could not respond to the dark/light toggle** fixed in Phase 0. Several also used `COLORS.white` for card backgrounds, so cards stayed white even in dark mode.

## What changed

Every static-theme screen was converted to the reactive `useTheme()` hook with a memoized `makeStyles(theme)` factory, and hardcoded colors were replaced with theme tokens:

| Screen | Change |
|--------|--------|
| `login/LoginScreen.tsx` | useTheme + factory; tokenized 11 hex/rgba (header, logo, card, google btn, links) |
| `register/RegisterScreen.tsx` | useTheme + factory; google button `white` → `card` |
| `register/RegisterOTPVerifyScreen.tsx` | useTheme + factory; card `white` → `card` |
| `ForgotPassword/EnterMobileScreen.tsx` | useTheme + factory; card `white` → `card` |
| `ForgotPassword/VerifyOTPScreen.tsx` | useTheme + factory; card `white` → `card` |
| `googlelogin/GoogleContactUpdateScreen.tsx` | useTheme + factory; card `white` → `card` |
| `googlelogin/GoogleContactVerifyOTPScreen.tsx` | useTheme + factory; card `white` → `card` |
| `onboarding/OnboardingScreen.tsx` | tokenized 12 hex/rgba to brand colors (kept intentionally dark — it's a full-screen image-overlay intro) |

`login/LoginLogs.tsx` already used `useTheme` correctly — left as-is.

## Result (guardrails)

Hardcoded colors in the 9 auth screens went from ~40 down to **2 accepted exceptions**, both in `LoginLogs.tsx`:
- A fixed decorative avatar palette (distinct color per user).
- White text rendered on those colored avatars.

Both are correct in either theme by design.

## Notes

- **OTP resend timers already existed** on all three OTP screens (`resendCountdown={30}` on `AppOTPInput`) — no feature gap there. Android SMS auto-detect and hash handling are also already wired.
- The branded red auth header (LoginScreen) intentionally stays red in both themes (brand), while the form cards on top now correctly follow the theme.

## Verification

- `npx tsc --noEmit` → 0 errors.
- Grep confirms 0 raw hex/rgba remaining in 8 of 9 screens (2 accepted exceptions in LoginLogs).

## Suggested manual QA before closing

Because the app can't be rendered here, please spot-check on device: run the full **signup → OTP → login → forgot-password** loop in **both light and dark**, and toggle the theme mid-flow to confirm cards/text update live.
