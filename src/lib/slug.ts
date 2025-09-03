/**
 * Slug utility helpers.
 * Simple ASCII/URL friendly slug generator with uniqueness helper.
 */
import { prisma } from '@/src/lib/db';

export function basicSlugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['`"]+/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80) || 'item';
}

export async function uniquePostSlug(base: string) {
  const root = basicSlugify(base);
  let slug = root;
  let i = 2;
  while (await prisma.post.findUnique({ where: { slug } })) {
    slug = `${root}-${i++}`;
  }
  return slug;
}

export async function uniquePageSlug(base: string) {
  const root = basicSlugify(base);
  let slug = root;
  let i = 2;
  while (await prisma.page.findUnique({ where: { slug } })) {
    slug = `${root}-${i++}`;
  }
  return slug;
}

export async function uniqueTagSlug(base: string) {
  const root = basicSlugify(base);
  let slug = root;
  let i = 2;
  while (await prisma.tag.findUnique({ where: { slug } })) {
    slug = `${root}-${i++}`;
  }
  return slug;
}

export async function uniqueCategorySlug(base: string) {
  const root = basicSlugify(base);
  let slug = root;
  let i = 2;
  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${root}-${i++}`;
  }
  return slug;
}
