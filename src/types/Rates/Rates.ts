// src/types/Rates/Rates.ts

export interface RateEntry {
  date:       string;   // "DD MMM YYYY"
  dateRaw:    string;   // "YYYY-MM-DD" for sorting
  rate:       number;   // price per gram in ₹
  change:     number;   // absolute change from previous day
  changePct:  number;   // % change from previous day
}

export interface MetalRates {
  metal:       'Gold' | 'Silver';
  unit:        string;            // "per gram" / "per kg"
  purity:      string;            // "916 (22K)" / "999"
  currentRate: number;
  change:      number;
  changePct:   number;
  updatedAt:   string;
  history:     RateEntry[];       // last 10 days, index 0 = oldest
}

export interface RatesResponse {
  gold:   MetalRates;
  silver: MetalRates;
}
