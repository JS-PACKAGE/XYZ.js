export const textDefaults = Object.freeze({
  fontSize: 24,
  fontFamily: 'sans-serif',
  fontFallback: 'sans-serif',
  direction: 'ltr' as const,
  locale: '',
  fontReadiness: 'wait' as const,
  color: '#ffffff',
  padding: 2,
  lineSpacing: 1.2,
});

export const textLayoutLimits = Object.freeze({
  geometryEpsilon: 0.05,
  metricsEpsilon: 0.5,
});
