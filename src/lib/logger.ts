/**
 * Minimal logger abstraction.
 * - Replace with pino/logtail/winston later if needed.
 * - Provides consistent interface for server components + server actions.
 */
export const logger = {
  info: (msg: string, meta?: unknown) => console.log('[info]', msg, meta ?? ''),
  warn: (msg: string, meta?: unknown) => console.warn('[warn]', msg, meta ?? ''),
  error: (msg: string, meta?: unknown) => console.error('[error]', msg, meta ?? '')
};
