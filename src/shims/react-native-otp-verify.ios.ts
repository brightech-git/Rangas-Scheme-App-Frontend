export const getHash = async () => [];
export const getOtp = async () => false;
export const requestHint = async () => '';
export const addListener = () => ({ remove: () => {} } as any);
export const removeListener = () => {};
export const startOtpListener = async () => ({ remove: () => {} } as any);
export const useOtpVerify = () => ({ otp: null, message: null, hash: [], timeoutError: false, startListener: () => {}, stopListener: () => {} });
export default { getHash, getOtp, requestHint, addListener, removeListener, startOtpListener };
