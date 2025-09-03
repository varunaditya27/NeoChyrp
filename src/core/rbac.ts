/**
 * RBAC Utilities
 * Lightweight role & permission helpers bridging UserRole + Group/Permission tables.
 */
import { prisma } from '@/src/lib/db';

export type Role = 'USER' | 'AUTHOR' | 'MODERATOR' | 'ADMIN' | 'OWNER';

// Static role capability map (coarse) – fine-grained permissions stored in Permission table.
const ROLE_CAPS: Record<Role, string[]> = {
  USER: ['post.read', 'comment.create'],
  AUTHOR: ['post.read', 'post.create', 'post.edit.own', 'comment.create'],
  MODERATOR: ['post.read', 'comment.create', 'comment.moderate'],
  ADMIN: ['*'],
  OWNER: ['*']
};

export async function userCapabilities(userId: string): Promise<Set<string>> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { groups: { include: { group: { include: { permissions: { include: { permission: true } } } } } } } });
  if (!user) return new Set();
  const caps = new Set<string>();
  ROLE_CAPS[user.role as Role]?.forEach(c => caps.add(c));
  // Group permissions
  user.groups.forEach(ug => ug.group.permissions.forEach(gp => caps.add(gp.permission.key)));
  return caps;
}

export async function can(userId: string, needed: string | string[]): Promise<boolean> {
  const required = Array.isArray(needed) ? needed : [needed];
  const caps = await userCapabilities(userId);
  if (caps.has('*')) return true;
  return required.every(r => caps.has(r));
}

export function requireCap(userId: string, cap: string | string[]): Promise<void> {
  return can(userId, cap).then(ok => { if (!ok) throw Object.assign(new Error('Forbidden'), { status: 403 }); });
}
