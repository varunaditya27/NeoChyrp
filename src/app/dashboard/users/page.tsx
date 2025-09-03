import { Container } from '@/src/components/layout/Container';
import { prisma } from '@/src/lib/db';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  return (
    <div className="py-8">
      <Container>
        <h1 className="mb-6 text-2xl font-bold">Users</h1>
        {users.length === 0 ? <p className="text-sm text-gray-500">No users.</p> : (
          <div className="overflow-x-auto rounded border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-600">Username</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Display Name</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Role</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t last:border-b">
                    <td className="px-4 py-2">{u.username}</td>
                    <td className="px-4 py-2">{u.displayName}</td>
                    <td className="px-4 py-2"><span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize">{u.role.toLowerCase()}</span></td>
                    <td className="px-4 py-2 text-gray-500">{u.createdAt.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </div>
  );
}
