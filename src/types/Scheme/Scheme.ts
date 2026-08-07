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

// Metal identity colours, aligned to the Cinnamon / Champagne palette.
// Mirrors COLORS.metalGold / metalSilver / metalPlatinum / metalDiamond
// in theme.js — kept here as plain constants because these are data-layer
// display helpers consumed by screens that don't hold a theme reference.
export const METAL_COLOR: Record<string, string> = {
  G: '#C2A06B',
  S: '#8C9199',
  P: '#6B7C88',
  D: '#3EA0B5',
};

export const METAL_GRADIENT: Record<string, [string, string]> = {
  G: ['#D8C3AF', '#A98C68'],
  S: ['#A6ABB2', '#6E737A'],
  P: ['#8494A0', '#4E5D68'],
  D: ['#5FB8CB', '#2C7E8F'],
};
