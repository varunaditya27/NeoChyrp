/**
 * NeoChyrp Seed Script (idempotent-lean):
 * - Owner user & default group/permissions scaffold.
 * - Core settings (site name, description, theme).
 * - Default taxonomy (General category, sample tag).
 * - Default license (CC-BY-4.0) and mapping example.
 * - Sample welcome post (only if no posts yet) with metadata.
 *
 * Safe to run multiple times; it avoids creating duplicates via upsert.
 */
import { PrismaClient, UserRole } from '@prisma/client';

if (!process.env.DATABASE_URL) {
   
  console.error('Missing DATABASE_URL. Set it in .env');
  process.exit(1);
}

const prisma = new PrismaClient();

async function ensureOwner() {
  return prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: { displayName: 'Site Owner' },
    create: {
      email: 'owner@example.com',
      username: 'owner',
      displayName: 'Site Owner',
      role: UserRole.OWNER
    }
  });
}

async function ensureGroupsAndPermissions(ownerId: string) {
  // Minimal baseline permissions; expand as modules take shape.
  const permKeys = [
    'post.create',
    'post.edit.any',
    'post.delete.any',
    'comment.moderate',
    'admin.access'
  ];

  const permissions = [] as string[];
  for (const key of permKeys) {
    let p = await prisma.permission.findUnique({ where: { key } });
    if (!p) p = await prisma.permission.create({ data: { key } });
    permissions.push(p.id);
  }
  let ownersGroup = await prisma.group.findUnique({ where: { name: 'Owners' } });
  if (!ownersGroup) ownersGroup = await prisma.group.create({ data: { name: 'Owners', description: 'Site owners with full access.' } });
  for (const permId of permissions) {
    const existing = await prisma.groupPermission.findFirst({ where: { groupId: ownersGroup.id, permissionId: permId } });
    if (!existing) await prisma.groupPermission.create({ data: { groupId: ownersGroup.id, permissionId: permId } });
  }
  const membership = await prisma.userGroup.findFirst({ where: { userId: ownerId, groupId: ownersGroup.id } });
  if (!membership) await prisma.userGroup.create({ data: { userId: ownerId, groupId: ownersGroup.id } });
}

async function ensureSettings() {
  const settings: Record<string, unknown> = {
    siteName: 'NeoChyrp Dev',
    siteDescription: 'A modern re-imagining of Chyrp.',
    defaultTheme: 'sparrow',
    timezone: 'UTC'
  };
  for (const [key, value] of Object.entries(settings)) {
  const jsonVal = value as any; // value stored as JSON
    const existing = await prisma.setting.findUnique({ where: { key } });
    if (existing) {
      await prisma.setting.update({ where: { key }, data: { value: jsonVal } });
    } else {
      await prisma.setting.create({ data: { key, value: jsonVal } });
    }
  }
}

async function ensureTaxonomy() {
  const general = await prisma.category.upsert({
    where: { slug: 'general' },
    update: {},
    create: { name: 'General', slug: 'general' }
  });
  const introTag = await prisma.tag.upsert({
    where: { slug: 'intro' },
    update: {},
    create: { name: 'Intro', slug: 'intro' }
  });
  return { general, introTag };
}

async function ensureLicense() {
  const existing = await prisma.license.findUnique({ where: { code: 'CC-BY-4.0' } });
  if (existing) return existing;
  return prisma.license.create({ data: { code: 'CC-BY-4.0', name: 'Creative Commons Attribution 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' } });
}

async function ensureWelcomePost(ownerId: string) {
  const existing = await prisma.post.findFirst({ where: { slug: 'welcome' } });
  if (existing) return existing;
  const post = await prisma.post.create({
    data: {
      slug: 'welcome',
      title: 'Welcome to NeoChyrp',
      authorId: ownerId,
      feather: 'TEXT',
      visibility: 'PUBLISHED',
      publishedAt: new Date(),
      body: '# NeoChyrp\nThis is your freshly seeded instance.',
      featherData: { format: 'markdown' }
    }
  });
  // Attach meta
  await prisma.postMeta.create({ data: { postId: post.id, key: 'featured', value: true } });
  return post;
}

async function linkTaxonomyToPost(postId: string) {
  const general = await prisma.category.findUnique({ where: { slug: 'general' } });
  const intro = await prisma.tag.findUnique({ where: { slug: 'intro' } });
  if (general) {
    await prisma.postCategory.upsert({
      where: { postId_categoryId: { postId, categoryId: general.id } },
      update: {},
      create: { postId, categoryId: general.id }
    });
  }
  if (intro) {
    await prisma.postTag.upsert({
      where: { postId_tagId: { postId, tagId: intro.id } },
      update: {},
      create: { postId, tagId: intro.id }
    });
  }
}

async function main() {
  const owner = await ensureOwner();
  await ensureGroupsAndPermissions(owner.id);
  await ensureSettings();
  await ensureTaxonomy();
  await ensureLicense();
  const welcome = await ensureWelcomePost(owner.id);
  await linkTaxonomyToPost(welcome.id);
  console.log('Seed complete:', { owner: owner.email, welcomePost: welcome.slug });
}

main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
