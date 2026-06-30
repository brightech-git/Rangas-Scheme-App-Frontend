// src/types/schemeSlider.ts

export interface SchemeSlider {
  SliderId: number;
  image_path: string;
  title?: string;
  link_url?: string;
}

export interface SchemeSliderResponse {
  sliders: SchemeSlider[];
}