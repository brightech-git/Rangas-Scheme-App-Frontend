// src/api/services/pincodeService.ts

import axios from 'axios';

export const getPincodeDetails = async (pincode: string) => {
  const response = await axios.get(
    `https://api.postalpincode.in/pincode/${pincode}`
  );

  return response.data?.[0];
};