export interface AppearanceLabels {
  group: string; theme: string; light: string; dark: string; system: string;
  corners: string; cornersDesc: string; accent: string; accentDesc: string;
  density: string; comfortable: string; compact: string; finish: string; flat: string; material: string; language: string; ink: string;
}
export declare const APPEARANCE_LABELS: Readonly<Record<"zh-CN" | "zh-Hant" | "en", AppearanceLabels>>;

export interface FeedbackLabels {
  retry: string; done: string; failed: string; saving: string; saved: string; notSaved: string; autoSave: string; copyFailed: string;
  /** 两次确认进入确认时念的：「再按一次{label}」 */
  confirmTwiceHint: string;
}
export declare const FEEDBACK_LABELS: Readonly<Record<"zh-CN" | "zh-Hant" | "en", FeedbackLabels>>;
