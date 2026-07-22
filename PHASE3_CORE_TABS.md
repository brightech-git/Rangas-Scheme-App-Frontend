# Phase 3 — Core Tabs (Results)

Status: **done**. Date: 2026-07-22. `tsc --noEmit` passes clean (0 errors).

## Scope

The five bottom-tab screens: `HomeScreen`, `Scheme`, `NotificationScreen`, `contact`, `ProfileScreen`.

## Key difference from Phases 1–2

Unlike the auth/MPIN screens, **all five core-tab screens already used the reactive `useTheme()` hook** — so there was no static-import problem. The remaining work was tokenizing hardcoded colors (mostly in module-level `StyleSheet`s and inline props) and fixing `COLORS.white` card backgrounds that stayed white in dark mode.

## What changed

### HomeScreen (was the worst: 32 hex + 3 rgba → 0)
Fully tokenized. Module-level stylesheets (`sh`, `dots`, `rt`, `qa`, `qs`, `ms`, `ref`) had their hardcoded colors stripped and replaced with inline `COLORS` overrides:
- Section-header accent bar / "See all" pill → `primary` / `primaryPale`.
- Dot indicators → `primary` / `border` (added `useTheme` to `DotIndicator`).
- Rate-tile up/down pills → semantic `successBg`/`errorBg` + `success`/`error` (the new Phase 0 status tokens).
- Quick-action accents → `primary` / `goldDark` / `info` / `success` (4 distinct tokens; purple had no token).
- Rate-tile gold/silver accents → `secondary` / `gray400`.
- "My schemes" empty state → `primaryPale` / `card` / `border` / `primary`.
- Referral banner (branded red gradient) → brand tokens (`primary`→`primaryDark` gradient, `secondary` gold, `whiteOpacity70`), which stay branded in both themes intentionally.
- Loading spinners → `primary`.

### Scheme.tsx
- Three scheme cards used `COLORS.white` as background → **`COLORS.card`** (fixes white cards in dark mode).
- `statusColor` pending state `#FF9800` → `COLORS.warningDark` (kept distinct from completed's `warning`).
- Dead fallback `COLORS.error ?? '#E53935'` → `COLORS.error`.

### ProfileScreen.tsx
- Hero username / phone / email / "remove photo" text → `COLORS.white` / `COLORS.whiteOpacity70`.
- Edit modals' backdrop scrim → `COLORS.blackOpacity50` (tokenized, stripped from the static sheet).

### NotificationScreen.tsx & contact.tsx
No changes needed:
- Notification's single `COLORS.white` is button text (a token, correct in both themes).
- Contact's hardcoded hex are **external brand colors** (WhatsApp #25D366, Facebook #1877F2, Instagram, YouTube, etc.) — intentionally fixed; its `COLORS.white` uses are button text.

## Accepted exceptions (theme-independent by design)

- **Social-media brand colors** in `contact.tsx` — must match each platform.
- **`shadowColor: '#000'`** in `Scheme.tsx` `activeTab` — conventional shadow color (every `SHADOWS` preset uses black).
- **Commented-out hero meta strip** in `ProfileScreen.tsx` (wallet/KYC/Aadhaar) — dead code, not rendered.
- **`COLORS.white` used as text/icon color on colored buttons/active states** across screens — correct (white in both themes).

## Verification

- `npx tsc --noEmit` → 0 errors.
- HomeScreen: grep confirms **0** raw hex/rgba remaining.
- Scheme: only the conventional `#000` shadow remains.
- Profile: only dead commented code remains.

## Suggested manual QA

On device, both light + dark: Home (rates, cards, quick actions, referral banner, empty state), Scheme tabs, Notifications (list + retry), Contact (social buttons + form), Profile (hero + edit modals + biometric toggle). Toggle theme mid-screen to confirm everything updates live.
