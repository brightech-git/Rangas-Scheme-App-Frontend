// src/utils/BiometricHelper.ts
//
// Wraps expo-local-authentication (Face ID / fingerprint) + expo-secure-store.
// Biometric unlock does NOT bypass MPIN verification — it securely retrieves the
// user's stored MPIN and lets the normal `verifyMpin` backend flow run, so the
// security model is identical to typing the MPIN.

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const MPIN_KEY = 'secure_mpin';
const ENABLED_KEY = 'secure_biometric_enabled';

export type BiometricLabel = 'Face ID' | 'Fingerprint' | 'Biometrics';

/** Device has biometric hardware AND the user has enrolled at least one biometric. */
const isSupported = async (): Promise<boolean> => {
  try {
    const [hasHardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && enrolled;
  } catch {
    return false;
  }
};

/** Human-friendly label for the enrolled biometric, for button copy/prompts. */
const getLabel = async (): Promise<BiometricLabel> => {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'Fingerprint';
    return 'Biometrics';
  } catch {
    return 'Biometrics';
  }
};

/** Present the OS biometric prompt. Returns true only on a successful match. */
const authenticate = async (promptMessage: string): Promise<boolean> => {
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Use MPIN',
      disableDeviceFallback: true, // don't fall back to device passcode; MPIN is our fallback
    });
    return res.success === true;
  } catch {
    return false;
  }
};

// ── Secure MPIN storage ────────────────────────────────────────────
const saveMpin = async (mpin: string): Promise<void> => {
  try { await SecureStore.setItemAsync(MPIN_KEY, mpin); } catch { /* non-fatal */ }
};
const getMpin = async (): Promise<string | null> => {
  try { return await SecureStore.getItemAsync(MPIN_KEY); } catch { return null; }
};
const clearMpin = async (): Promise<void> => {
  try { await SecureStore.deleteItemAsync(MPIN_KEY); } catch { /* ignore */ }
};
const hasStoredMpin = async (): Promise<boolean> => (await getMpin()) !== null;

// ── Enabled preference ─────────────────────────────────────────────
const setEnabled = async (v: boolean): Promise<void> => {
  try { await SecureStore.setItemAsync(ENABLED_KEY, v ? 'true' : 'false'); } catch { /* ignore */ }
};
const isEnabled = async (): Promise<boolean> => {
  try { return (await SecureStore.getItemAsync(ENABLED_KEY)) === 'true'; } catch { return false; }
};

/** Full logout cleanup for biometric data. */
const clearAll = async (): Promise<void> => {
  await clearMpin();
  await setEnabled(false);
};

export const BiometricHelper = {
  isSupported,
  getLabel,
  authenticate,
  saveMpin,
  getMpin,
  clearMpin,
  hasStoredMpin,
  setEnabled,
  isEnabled,
  clearAll,
};
