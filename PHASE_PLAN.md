# Rangas Scheme App — Phase-Wise Modification Plan

Scope: **all screens**, covering UI/visual redesign, new features/logic, bug fixes/cleanup, and responsiveness/polish.
Date: 2026-07-22

## Guiding principles

- The app already has a solid foundation: a design system (`src/components/ui/appcomponents/*`), a light/dark theme (`src/theme`), i18n (`src/i18n/translations.ts`), Redux store (`src/store`), and API hooks (`src/api`). **Reuse and extend these — do not rewrite them per screen.**
- Every screen change follows the same order: **(1) fix bugs → (2) restyle with the design system → (3) add/adjust features → (4) responsiveness pass**. This keeps each screen shippable at the end of its phase.
- One phase = one reviewable, testable batch. Do not start the next phase until the current one builds and runs cleanly on both light and dark themes.
- Wrap every screen in `ScreenWrapper` / `KeyboardWrapper` and use `scale/verticalScale/moderateScale` from the theme instead of hard-coded pixels (this is the responsiveness backbone).

## Screen inventory (26 screens)

Grouped by domain, with current size as a rough complexity signal:

- **Foundation / dev:** ComponentsUsageScreen (1540, dev-only)
- **Onboarding & Auth:** OnboardingScreen (266), RegisterScreen (298), RegisterOTPVerifyScreen (177), LoginScreen (308), LoginLogs (221), ForgotPassword/EnterMobileScreen (118), ForgotPassword/VerifyOTPScreen (224), GoogleContactUpdateScreen (136), GoogleContactVerifyOTPScreen (185)
- **MPIN:** CreateMpinScreen (178), VerifyMpinScreen (162), ForgotAndVerifyMpinScreen (208), ResetMpinScreen (246)
- **Core tabs:** HomeScreen (504), Scheme (583), NotificationScreen (463), contact (351), ProfileScreen (762)
- **Schemes & Payments:** SchemeTermsScreen (260), SchemeJoinScreen (1460), PayInstallmentScreen (551), RatesScreen (377)
- **Stubs (not built yet):** BuyGoldScreen (21), PortfolioScreen (21), TransactionsScreen (21)

---

## Phase 0 — Foundation & guardrails (do this first)

Goal: make every later phase faster and consistent. No user-facing screen ships here.

1. **Design-system audit.** Walk `ComponentsUsageScreen` as the living catalog. Confirm each `App*` component (AppText, AppButton, AppInput, AppCard, AppOTPInput, AppPinInput, AppModal, AppBottomSheet, AppEmptyState, AppSkeletonLoader, etc.) supports the variants the redesign needs. Add any missing variants/props here, once.
2. **Theme tokens.** Verify `theme/light.js`, `dark.js`, `theme.js` expose complete color/spacing/font/shadow scales. Fill gaps (e.g. semantic colors: success/warning/danger/info) so screens never hard-code hex values.
3. **Responsiveness helpers.** Confirm `scale/verticalScale/moderateScale/fontScale` are used everywhere; add a lint rule or checklist item against raw pixel values and inline colors.
4. **Shared skeleton/empty/error states.** Standardize loading (`AppSkeletonLoader`), empty (`AppEmptyState`), and error/toast (`Toast`, `CustomAlert`) so every data screen behaves identically.
5. **i18n baseline.** Ensure all new copy goes through `translations.ts`. Add any missing keys as screens are touched.

**Exit criteria:** design system + theme cover 100% of what phases 1–5 will need; ComponentsUsage renders every component in light and dark.

---

## Phase 1 — Onboarding & Auth

Screens: OnboardingScreen, RegisterScreen, RegisterOTPVerifyScreen, LoginScreen, LoginLogs, ForgotPassword/EnterMobileScreen, ForgotPassword/VerifyOTPScreen, GoogleContactUpdateScreen, GoogleContactVerifyOTPScreen.

- **Bugs/cleanup:** validate phone/OTP inputs consistently; unify error handling from `authService`; fix keyboard-avoidance and back-navigation edge cases.
- **UI redesign:** consistent auth layout (logo, heading, input group, primary CTA, footer link) using `AppInput`, `AppButton`, `AppOTPInput`. Shared `PoweredByFooter`.
- **Features:** resend-OTP timer, inline validation, show/hide password, Google login state handling (`GoogleContact*` screens), remember-last-login on LoginLogs.
- **Responsiveness:** small-device layouts, keyboard behavior via `KeyboardWrapper`, safe-area handling.

**Exit criteria:** full signup → OTP → login → forgot-password loop works on light/dark and small/large devices.

---

## Phase 2 — MPIN security flow

Screens: CreateMpinScreen, VerifyMpinScreen, ForgotAndVerifyMpinScreen, ResetMpinScreen.

- **Bugs/cleanup:** consolidate MPIN logic against `mpinService` + `mpinSlice`; fix pin-length/lockout edge cases.
- **UI redesign:** unified `AppPinInput` keypad, consistent success/error feedback, biometric prompt slot (if applicable).
- **Features:** attempt limit + lockout messaging, "forgot MPIN" recovery path, optional biometric unlock.
- **Responsiveness:** keypad scales on all devices; no overflow on short screens.

**Exit criteria:** create → verify → forgot → reset MPIN all pass; lockout behaves predictably.

---

## Phase 3 — Core tabs (Home, Scheme, Notifications, Contact, Profile)

Screens: HomeScreen, Scheme, NotificationScreen, contact, ProfileScreen. These are the highest-traffic screens (bottom tab bar).

- **Bugs/cleanup:** fix data-refresh/pull-to-refresh, badge counts (`useUnreadCount`), and stale-state issues; tidy the large ProfileScreen (762 lines) and Scheme (583).
- **UI redesign:** restyle Home cards (`AppGoldPriceCard`, `HomeBanner`, scheme cards), Scheme grid/list (`AppSchemeCard`/`GlassSchemeCard`/`SchemeListCard`), Notification list rows, Contact layout, and Profile sections.
- **Features:** Home quick-actions, notification read/mark-all, profile edit + theme/language toggle (`AppLanguage`, `AppSwitch`), scheme search/filter (`AppSearchBar`).
- **Responsiveness:** grid columns adapt to width; long lists virtualized; tab bar (`BottomTabNavigator`) spacing on notched devices.

**Exit criteria:** all five tabs redesigned, data loads with skeletons/empty states, badges accurate.

---

## Phase 4 — Schemes & Payments (revenue-critical)

Screens: SchemeTermsScreen, SchemeJoinScreen (1460 — split into subcomponents), PayInstallmentScreen, RatesScreen.

- **Bugs/cleanup:** **refactor SchemeJoinScreen** into smaller components (form steps, summary, T&C) before restyling; verify Razorpay flow (`useRazorpay`, `RazorpayWebCheckout`, `razorpayService`); fix amount/validation edge cases in PayInstallment.
- **UI redesign:** stepper for scheme join, clean terms screen, payment summary card, live rate cards on RatesScreen.
- **Features:** installment history + due reminders, payment retry/failure handling, rate auto-refresh, receipt/export (`Appexportsheet`).
- **Responsiveness:** long forms scroll cleanly with keyboard; payment CTAs stay reachable.

**Exit criteria:** join a scheme → accept terms → pay an installment end-to-end on a test account; rates update live.

---

## Phase 5 — Build out stub screens

Screens: BuyGoldScreen, PortfolioScreen, TransactionsScreen (currently 21-line placeholders).

- **BuyGold:** real buy-gold flow (amount/weight toggle, live rate, checkout via Razorpay).
- **Portfolio:** holdings summary, per-scheme breakdown, growth charts.
- **Transactions:** filterable/searchable transaction history with export.

Reuse everything built in Phases 3–4 (cards, rates, payment, export, empty/skeleton states). Add navigation entries in `RootNavigator` / tab bar as needed.

**Exit criteria:** all three screens are fully functional, not placeholders, and consistent with the rest of the app.

---

## Phase 6 — Cross-cutting polish & QA

- **Consistency sweep:** every screen uses design-system components, theme tokens, i18n copy — no stray hex colors or raw pixels.
- **Motion:** shared transitions, list/skeleton animations, button press states.
- **Accessibility:** hit targets ≥44px, contrast in both themes, screen-reader labels.
- **Performance:** memoize heavy lists, lazy-load charts, trim re-renders.
- **Full-device QA matrix:** small/large phones × light/dark × logged-out/logged-in.
- **Dev cleanup:** gate or remove `ComponentsUsageScreen` from production builds.

**Exit criteria:** consistent, responsive, accessible app across the full device/theme matrix.

---

## Suggested execution notes

- Do phases in order — later phases depend on components hardened earlier (Phase 0 unblocks all; Phase 4 reuses Phase 3 cards; Phase 5 reuses Phase 4 payment/rates).
- Ship each phase behind review; keep `main` runnable at every phase boundary.
- Track per-screen status (Bugs / UI / Features / Responsive) in a simple checklist so nothing in the 26-screen list is missed.
- Always test **both themes** and at least one small + one large device before closing a phase.
