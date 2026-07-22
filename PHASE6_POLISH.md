# Phase 6 — Cross-Cutting Polish & QA (Results)

Status: **done** (high-value items). Date: 2026-07-22. `tsc --noEmit` passes clean (0 errors).

## Critical fixes

### 1. Dark mode was silently disabled at the OS level 🔴
`app.json` had `"userInterfaceStyle": "light"`, which forces Expo/the OS to always report a **light** color scheme. That means the system-dark-mode detection built in Phase 0 (`Appearance.getColorScheme()`) could **never** return `'dark'` — the whole dark theme was effectively unreachable via the "system" preference.
- **Fix:** `"userInterfaceStyle": "automatic"`. Now `preference: 'system'` actually follows the device, and explicit light/dark still work.

### 2. Status bar icons invisible in dark mode
`ScreenWrapper` hardcoded `statusBarStyle = 'dark-content'`, so on a dark background the status-bar icons would be dark-on-dark.
- **Fix:** it now defaults to `isDark ? 'light-content' : 'dark-content'` (still overridable per-screen).

### 3. Dev-only catalog shipped to production
The 1,540-line `ComponentsUsageScreen` (a component gallery) was registered unconditionally.
- **Fix:** its `Stack.Screen` is now wrapped in `{__DEV__ && ...}`, so it's excluded from release builds.

## Shared component tokenization (broad impact)

These render on many screens, so fixing them fixes dark mode everywhere at once:

- **`MainHeader`** (Home header) — 10 hex + 6 rgba → **0**. The branded red gradient, gold accents, and white text now use brand tokens (`primary`/`primaryDark`/`primaryLight`, `secondary`, `white`, `whiteOpacity*`, `goldOpacity*`). Visually identical, theme-consistent.
- **`SubPageHeader`** (all sub-pages incl. the new Phase 5 screens) — 3 hex → **0** (`primary` / `primaryPale`).
- **`HomeBanner`** — 3 hex → **0**; added `useTheme` (it previously used none) and tokenized the gold spinner + carousel dots.

## App-wide consistency scan (current state)

Fully clean (0 raw colors): all **auth, MPIN, core-tab, and payment/scheme screens** we touched, the 3 new Phase 5 screens, and the 3 shared headers above.

Remaining files with raw colors — triaged as **follow-up debt** or **accepted exceptions**:

| Area | Files | Nature |
|------|-------|--------|
| Scheme cards | `GlassSchemeCard` (29), `AppSchemeCard` (15), `SchemeListCard` (1) | Decorative glassmorphism (layered rgba). Need a dedicated visual pass with device testing — risky to tokenize blind. |
| Design-system internals | `Appexportsheet` (23), `AppSkeletonLoader` (8), `Toast` (7), `AppLanguage` (5), `CustomAlert` (3), `AppInput`/`AppLoader`/`AppIcons`/`AppHeader`/`AppModal`/`AppGoldPriceCard`/`AppBottomSheet` (1–2 each) | Mostly semantic/intentional (skeleton shimmer, toast type colors, export styling). Recommend a component-library sweep. |
| Documented exceptions | `contact` (social brand colors), `ProfileScreen` (commented dead code + tokenized scrim), `RatesScreen` (metal + chart-axis + tooltip), `SchemeJoinScreen` (backdrop scrims), `LoginLogs` (avatar palette), `RazorpayWebCheckout`/`WebViewComponent` (web content) | Theme-independent by design (see per-phase docs). |
| Dev-only | `ComponentsUsageScreen` (6) | Now `__DEV__`-gated; not shipped. |

## Not done (recommended follow-ups)

- **Scheme-card + design-system-component tokenization** — a focused pass over `GlassSchemeCard`/`AppSchemeCard` and the `App*` library, verified visually in both themes on device.
- **Accessibility deep pass** — `accessibilityLabel`/`accessibilityRole` on icon-only buttons, contrast audit in dark mode, ≥44px hit targets. Best done with a screen reader on device.
- **Performance** — memoize the heavier lists (Scheme, Notifications) and lazy-load the Rates chart.
- **Full device QA matrix** — small/large × light/dark × logged-out/logged-in. Requires running the app.

## Verification

- `npx tsc --noEmit` → **0 errors** across the whole project.
- Shared headers: grep confirms 0 raw colors.

## Native-build reminders (carried from earlier phases)

- Dark-mode + biometric changes touch native config (`app.json`). Run `npx expo prebuild --clean` + a dev/EAS build; biometrics don't work in Expo Go.
