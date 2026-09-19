// src/utils/kycStorage.ts
//
// Local KYC completion tracker, keyed per member (personalId). There is
// no backend "KYC status" field on PersonalInfo yet, so completion is
// derived from whether a KYC draft has been saved on this device.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { KycFormData } from '../types/Kyc/Kyc';

const key = (personalId: string) => `@kyc_data_${personalId}`;

const getKycData = async (personalId: string): Promise<KycFormData | null> => {
  if (!personalId) return null;
  const raw = await AsyncStorage.getItem(key(personalId));
  return raw ? JSON.parse(raw) : null;
};

const isKycComplete = async (personalId: string): Promise<boolean> => {
  if (!personalId) return true; // nothing to key by — don't block payment
  return (await getKycData(personalId)) !== null;
};

const saveKycData = (personalId: string, data: KycFormData) =>
  AsyncStorage.setItem(key(personalId), JSON.stringify(data));

export const kycStorage = { getKycData, isKycComplete, saveKycData };
