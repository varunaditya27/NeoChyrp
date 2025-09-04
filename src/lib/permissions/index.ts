import { getUserFromBearer } from '@/src/lib/auth/currentUser';
import type { NextRequest } from 'next/server';

export type Permission =
  | 'post:create'
  | 'post:edit'
  | 'post:delete'
  | 'comment:moderate'
  | 'asset:upload'
  | 'admin:access';

const roleGrants: Record<string, Permission[]> = {
  USER: ['asset:upload'],
  AUTHOR: ['post:create','post:edit','asset:upload'],
  MODERATOR: ['post:create','post:edit','comment:moderate','asset:upload'],
  ADMIN: ['post:create','post:edit','post:delete','comment:moderate','asset:upload','admin:access'],
  OWNER: ['post:create','post:edit','post:delete','comment:moderate','asset:upload','admin:access']
};

export async function requirePermission(req: NextRequest | Request, perm: Permission) {
  const auth = (req.headers.get('authorization'));
  const user = await getUserFromBearer(auth);
  if (!user) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  const grants = roleGrants[user.role] || [];
  if (!grants.includes(perm)) throw Object.assign(new Error('Forbidden'), { status: 403 });
  return user;
}

export function userHas(userRole: string | undefined | null, perm: Permission) {
  if (!userRole) return false;
  return (roleGrants[userRole] || []).includes(perm);
}
