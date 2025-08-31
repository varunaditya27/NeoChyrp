/**
 * Admin Dashboard (skeleton):
 * - Entry to manage posts, media, categories, tags, users.
 * - Replace with protected route + proper layout.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <ul className="grid gap-4 sm:grid-cols-3">
        <li className="rounded border bg-white p-4 text-sm">Posts</li>
        <li className="rounded border bg-white p-4 text-sm">Media</li>
        <li className="rounded border bg-white p-4 text-sm">Comments</li>
        <li className="rounded border bg-white p-4 text-sm">Categories</li>
        <li className="rounded border bg-white p-4 text-sm">Tags</li>
        <li className="rounded border bg-white p-4 text-sm">Users</li>
      </ul>
      <p className="text-xs text-neutral-500">(All modules are placeholder tiles.)</p>
    </div>
  );
}
