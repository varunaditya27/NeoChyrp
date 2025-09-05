/**
 * Admin Access Control Utilities
 * Provides strict demarcation between admin and regular users
 */

export const ADMIN_USERNAME = 'CloneFest2025';
export const ADMIN_PASSWORD = 'CloneFest2025';

export const ADMIN_ROLES = ['ADMIN', 'OWNER'] as const;
export const AUTHOR_ROLES = ['AUTHOR'] as const;
// Regular roles simplified (MEMBER deprecated - use USER)
export const REGULAR_ROLES = ['USER'] as const; // 'MEMBER' removed

export type AdminRole = typeof ADMIN_ROLES[number];
export type AuthorRole = typeof AUTHOR_ROLES[number];
export type RegularRole = typeof REGULAR_ROLES[number];
export type UserRole = AdminRole | AuthorRole | RegularRole;

/**
 * Check if user is a site administrator
 */
export function isAdmin(user: { role: string; username: string } | null): boolean {
  if (!user) return false;
  return ADMIN_ROLES.includes(user.role as AdminRole) || user.username === ADMIN_USERNAME;
}

/**
 * Check if user can create content
 */
export function canCreateContent(user: { role: string; username?: string } | null): boolean {
  if (!user) return false;
  // Treat the primary admin username as having creation rights even if role somehow downgraded
  if (user.username === ADMIN_USERNAME) return true;
  return [...ADMIN_ROLES, ...AUTHOR_ROLES].includes(user.role as AdminRole | AuthorRole);
}

/**
 * Check if user is a regular user (not admin or author)
 */
export function isRegularUser(user: { role: string; username: string } | null): boolean {
  if (!user) return false;
  return REGULAR_ROLES.includes(user.role as RegularRole) && user.username !== ADMIN_USERNAME;
}

/**
 * Check if user can manage site settings
 */
export function canManageSettings(user: { role: string; username: string } | null): boolean {
  if (!user) return false;
  return isAdmin(user);
}

/**
 * Check if user can access admin area (ADMIN ONLY - not authors)
 */
export function canAccessAdmin(user: { role: string; username: string } | null): boolean {
  if (!user) return false;
  // Hard fallback to username to avoid lockout if role changed unintentionally
  if (user.username === ADMIN_USERNAME) return true;
  return isAdmin(user); // Only actual admins can access admin area
}

/**
 * Check if user can access author dashboard (content creation)
 */
export function canAccessAuthorDashboard(user: { role: string; username: string } | null): boolean {
  if (!user) return false;
  return canCreateContent(user); // Authors and admins can create content
}

/**
 * Get user access level description
 */
export function getUserAccessLevel(user: { role: string; username: string } | null): string {
  if (!user) return 'Guest';

  if (user.username === ADMIN_USERNAME) return 'Site Administrator';
  if (ADMIN_ROLES.includes(user.role as AdminRole)) return 'Administrator';
  if (AUTHOR_ROLES.includes(user.role as AuthorRole)) return 'Content Author';
  if (REGULAR_ROLES.includes(user.role as RegularRole)) return 'User';

  return 'Unknown';
}

/**
 * Redirect path for unauthorized users
 */
export function getUnauthorizedRedirect(user: { role: string } | null): string {
  if (!user) return '/login';
  return '/'; // Regular users go to homepage
}
