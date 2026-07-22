# Biometric Unlock (Verify MPIN screen)

Status: **done**. Date: 2026-07-22. `tsc --noEmit` passes clean (0 errors). No new npm install needed — `expo-local-authentication` (~17.0.8) and `expo-secure-store` (~15.0.8) were already in `package.json`.

## Design (why it's secure)

Biometric unlock **does not bypass** MPIN verification. The user's MPIN is kept in the OS secure enclave via `expo-secure-store`; on a successful Face ID / fingerprint match, that stored MPIN is retrieved and run through the **exact same `verifyMpin` backend flow** as typing it. So the security model is identical to manual entry — biometrics just replace the typing.

## Files added / changed

- **`src/utils/BiometricHelper.ts`** (new) — wraps `expo-local-authentication` + `expo-secure-store`: `isSupported`, `getLabel` (Face ID / Fingerprint / Biometrics), `authenticate`, secure `saveMpin/getMpin/clearMpin/hasStoredMpin`, `setEnabled/isEnabled`, and `clearAll`.
- **`src/store/mpinSlice.ts`** — after every successful `createMpin`, `verifyMpin`, `resetMpin`, and `forgotMpinVerify`, the MPIN is saved to the secure store (kept fresh so biometrics always unlock the current PIN). All calls are wrapped so they never block the flow.
- **`src/store/authSlice.ts`** — `logoutUser` now calls `BiometricHelper.clearAll()` to wipe the stored MPIN and disable biometric unlock on sign-out.
- **`src/screens/mpin/VerifyMpinScreen.tsx`** — biometric detection on mount; an "Unlock with Face ID / Fingerprint" button (theme-tokenized, shown only when hardware is enrolled); a shared `onVerifiedSuccess()` path used by both manual and biometric verification; auto-prompt on mount when enabled.
- **`app.json`** — added the `expo-local-authentication` config plugin with a `faceIDPermission` string (iOS `NSFaceIDUsageDescription`). Android biometric permissions are added by the plugin automatically.

## Behavior (opt-in only)

Biometric unlock is **off by default** and is never auto-enabled. The user turns it on explicitly from **Profile → Account & Security → "<Face ID/Fingerprint> Unlock"** toggle.

1. Device with no enrolled biometrics → the toggle is hidden; keypad only.
2. Device with enrolled biometrics → the toggle appears in Profile, off by default.
3. User flips it **on** → they're asked to authenticate once (Face ID / fingerprint) to confirm; on success it's enabled. (If no MPIN has been stored yet, an alert asks them to log in with MPIN once first.)
4. Once enabled → the Verify screen auto-prompts biometrics on launch and shows an "Unlock with …" button; keypad remains as fallback.
5. User flips it **off** in Profile → biometric unlock stops immediately; the Verify screen shows keypad only.
6. If the stored MPIN ever fails backend verification (e.g. changed elsewhere), it's cleared and the user enters the MPIN once to re-arm.
7. On logout, stored MPIN + biometric flag are wiped.

## Where it lives

- **Toggle:** `src/screens/profile/ProfileScreen.tsx` — a `ToggleRow` (icon + label + `AppSwitch`) in the Account & Security card, shown only when `BiometricHelper.isSupported()`. Enabling requires a biometric confirmation + a stored MPIN.
- **Unlock:** `src/screens/mpin/VerifyMpinScreen.tsx` — button + auto-prompt gated on `bioSupported && bioEnabled`.

## Native build note

Because this uses a config plugin, the permission/manifest changes only take effect after a fresh native build:

```
npx expo prebuild --clean
# then run a dev/EAS build (not just Metro reload)
```

Face ID / fingerprint APIs do **not** work in Expo Go — use a dev client or a real build.

## Suggested manual QA

On a device with Face ID / fingerprint enrolled: log in once with MPIN, background/relaunch the app, confirm the biometric prompt appears and unlocks to Home; test the manual button; test cancel → keypad fallback; change MPIN and confirm biometrics unlock with the new PIN; log out and confirm biometrics no longer unlock.
