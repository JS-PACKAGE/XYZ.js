/** Logical canvas pixels; no backend-specific DOM visual sizes. */
export const uiDefaults = {
  textInputWidth: 220,
  textInputHeight: 40,
  textInputPadding: 8,
} as const;

export const uiLimits = {
  nativeMaxLength: 2147483647,
} as const;
