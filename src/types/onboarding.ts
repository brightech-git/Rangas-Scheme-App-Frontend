// src/types/onboarding.ts

export interface Banner {
  BannerId: number;
  title: string;
  image_path: string;
  created_at: string;
  updated_at: string | null;
}

export interface BannersResponse {
  banners: Banner[];
}
