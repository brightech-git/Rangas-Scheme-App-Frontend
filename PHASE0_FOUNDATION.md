# Phase 0 — Foundation & Guardrails (Results)

Status: **done**. Date: 2026-07-22. `tsc --noEmit` passes clean.

Phase 0 hardens the shared layer so Phases 1–6 are fast and consistent. No user-facing screen was redesigned here — this is the groundwork everything else builds on.

## What was changed

### 1. Theme now persists and respects the OS (bug fix)
Previously `ThemeProvider` used `useState(false)` — dark mode reset to light on every app restart and the system dark-mode setting was ignored.

- `src/providers/ThemeProvider.tsx` — rewritten to:
  - Read the OS scheme via `Appearance.getColorScheme()` on first paint.
  - Hydrate the persisted preference from storage on mount.
  - Live-follow OS changes while preference is `system`.
  - Expose `preference` (`'light' | 'dark' | 'system'`) and `setTheme(pref)` alongside the existing `isDark` / `toggleTheme`.
- `src/utils/AsyncStorageHelper.ts` — added `THEME` key + `getThemePreference()` / `setThemePreference()` and a `ThemePreference` type.
- `src/theme/types.ts` — `ThemeContextType` extended with `preference` and `setTheme`.

Existing call sites (`Sidebar`, `RootNavigator`) keep working — `isDark` and `toggleTheme` are unchanged. `toggleTheme` now also persists the choice.

### 2. Dark theme token gaps filled (bug fix)
`dark.js` previously overrode ~15 colors, leaving many light-pink surfaces intact in dark mode (e.g. `Sidebar` uses `COLORS.primaryPale` and `COLORS.gray100/200/800`, which stayed light).

- `src/theme/dark.js` — added dark overrides for tinted surfaces (`primaryPale`, `softCard`, `orangeLight`, `orangeIce`, `backgroundOrange`, `backgroundGold`, `goldLight`), the full neutral `gray50–gray900` scale (inverted), borders (`borderLight`, `borderMedium`), `textDisabled`, and `disabled`.

### 3. Semantic status-background tokens added
There were solid status colors (`success/warning/error/info`) but no subtle background variants for chips/badges/banners.

- `src/theme/theme.js` — added `successBg`, `warningBg`, `errorBg`, `infoBg`.
- `src/theme/dark.js` — dark-tuned values for the same four.

Because `theme/types.ts` derives `ThemeColors` from the base palette, these are now type-safe everywhere via `useTheme().COLORS`.

## Audit findings (baseline for later phases)

The scaling system (`scale/verticalScale/moderateScale/fontScale`) and the design system (`src/components/ui/appcomponents/*`, ~25 `App*` components) are already solid — reuse, don't rewrite.

**Cleanup debt to burn down per-screen in Phases 1–6:**

- **111 hard-coded hex colors** and **25 `rgba()` literals** across screens. Worst offenders:
  - `home/HomeScreen.tsx` — 32
  - `scheme/SchemeJoinScreen.tsx` — 17
  - `rates/RatesScreen.tsx` — 13
  - `login/LoginScreen.tsx` — 11
  - `onboarding/OnboardingScreen.tsx` — 10
  - `contact/contact.tsx` — 8
  - `profile/ProfileScreen.tsx` — 5, `scheme/Scheme.tsx` — 3, `payment/PayInstallmentScreen.tsx` — 2, `login/LoginLogs.tsx` — 2
- These should be replaced with `useTheme().COLORS` tokens as each screen is touched in its phase (not all at once).

## Guardrails checklist (apply to every screen in Phases 1–6)

Before a screen is considered "done" in its phase:

1. **No raw hex / rgba** — all colors come from `useTheme().COLORS`.
2. **No raw pixel literals** — sizes use `SIZES.*` or `scale/verticalScale/moderateScale`; fonts use `fontScale`/`SIZES.font.*`.
3. **Design-system components** — text via `AppText`, buttons via `AppButton`, inputs via `AppInput`/`AppOTPInput`/`AppPinInput`, cards via `AppCard`, etc. No ad-hoc `<Text>`/`<TouchableOpacity>` where a component exists.
4. **States covered** — loading uses `AppSkeletonLoader`, empty uses `AppEmptyState`, errors use `Toast`/`CustomAlert`.
5. **Wrapped** — screen uses `ScreenWrapper` (+ `KeyboardWrapper` for forms) with safe-area handling.
6. **i18n** — all user-facing copy goes through `src/i18n/translations.ts`; no hard-coded strings.
7. **Both themes verified** — screen looks correct in light AND dark.
8. **Two device sizes verified** — one small (<375w) and one large device.

## Verification done

- `npx tsc --noEmit` → exit 0 (clean).
- Public theme API unchanged for existing consumers (`isDark`, `toggleTheme`, `COLORS`, `SIZES`, `FONTS`, `SHADOWS`).
