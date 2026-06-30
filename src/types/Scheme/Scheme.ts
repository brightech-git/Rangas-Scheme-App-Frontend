// src/types/Scheme/Scheme.ts

export type MetalType = 'G' | 'S' | 'P' | 'D';
export type SchemeType = 'A' | string;
export type YN = 'Y' | 'N';

export interface ApiScheme {
  SchemeId: number;
  schemeName: string;
  SchemeSName: string;
  WeightLedger: YN;
  SCHEMETYPE: SchemeType;
  ACTIVE: YN;
  FixedIns: YN;
  image_path: string;
  Instalment: number;
  ADDNEWMEMBER: YN;
  GroupCodeForAllAmount: YN;
  MetalType: MetalType | string;
}

export interface SchemesResponse {
  schemes: ApiScheme[];
}

// ── Display helpers ──────────────────────────────────────────────
export const METAL_LABEL: Record<string, string> = {
  G: 'Gold',
  S: 'Silver',
  P: 'Platinum',
  D: 'Diamond',
};

export const METAL_COLOR: Record<string, string> = {
  G: '#C9A84C',
  S: '#9E9E9E',
  P: '#78909C',
  D: '#00ACC1',
};

export const METAL_GRADIENT: Record<string, [string, string]> = {
  G: ['#E8A020', '#C87010'],
  S: ['#909090', '#606060'],
  P: ['#607D8B', '#455A64'],
  D: ['#00ACC1', '#00838F'],
};
