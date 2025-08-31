/**
 * Seed script:
 * - Creates an initial OWNER user (placeholder, replace in dev).
 * - Inserts sample categories and tags.
 * - Avoid seeding large content here (keep idempotent-ish).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      username: 'owner',
      displayName: 'Site Owner',
      role: 'OWNER'
    }
  });

  await prisma.category.upsert({
    where: { slug: 'general' },
    update: {},
    create: { name: 'General', slug: 'general' }
  });

  console.log('Seed complete:', { owner });
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
