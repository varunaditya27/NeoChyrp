/**
 * Auth Cookie Utilities
 * Provides a single place to manage cookie name changes and backward compatibility.
 */

import { NextRequest } from 'next/server';

// Canonical cookie name moving forward
export const AUTH_COOKIE_NAME = 'auth-token';

// Legacy cookie names kept temporarily for backward compatibility
const LEGACY_COOKIE_NAMES = ['auth_token'];

/**
 * Retrieve auth token from request cookies supporting legacy names.
 */
export function getAuthTokenFromRequest(req: NextRequest): string | undefined {
  // Prefer canonical cookie
  const primary = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (primary) return primary;
  for (const legacy of LEGACY_COOKIE_NAMES) {
    const v = req.cookies.get(legacy)?.value;
    if (v) return v;
  }
  return undefined;
}

/**
 * Helper to note deprecation timeline of legacy cookies.
 * TODO: Remove legacy support after migration window (Q3 2025).
 */
export function isLegacyCookieName(name: string): boolean {
  return LEGACY_COOKIE_NAMES.includes(name);
}
