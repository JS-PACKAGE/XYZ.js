export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const severity: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

/** Shared diagnostics; production applications can set level to 'silent'. */
export const logger = {
  level: 'warn' as LogLevel,
  debug(...args: unknown[]): void {
    if (severity[this.level] <= severity.debug) console.debug('[XYZ]', ...args);
  },
  info(...args: unknown[]): void {
    if (severity[this.level] <= severity.info) console.info('[XYZ]', ...args);
  },
  warn(...args: unknown[]): void {
    if (severity[this.level] <= severity.warn) console.warn('[XYZ]', ...args);
  },
  error(...args: unknown[]): void {
    if (severity[this.level] <= severity.error) console.error('[XYZ]', ...args);
  },
};
