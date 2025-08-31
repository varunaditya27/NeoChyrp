/**
 * Marketing / landing page.
 * - Introduces project; links to blog + docs.
 * - Add dynamic stats later (post count, latest release, etc.).
 */
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="prose max-w-none">
        <h1>NeoChyrp</h1>
        <p>Modern, modular, API-ready evolution of the classic Chyrp engine. Built with Next.js 15, Prisma, and Supabase.</p>
        <p>
          Explore the <Link href="/blog">blog</Link> or access the <Link href="/dashboard">dashboard</Link> (auth stub).
        </p>
      </section>
    </div>
  );
}
