export interface AppearanceLabels {
  group: string; theme: string; light: string; dark: string; system: string;
  corners: string; cornersDesc: string; accent: string; accentDesc: string;
  density: string; comfortable: string; compact: string; finish: string; flat: string; material: string; language: string; ink: string;
}
export declare const APPEARANCE_LABELS: Readonly<Record<"zh-CN" | "zh-Hant" | "en", AppearanceLabels>>;
