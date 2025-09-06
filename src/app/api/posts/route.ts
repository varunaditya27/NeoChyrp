/**
 * Posts API
 * Create and manage posts with strict access controls
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { canCreateContent } from '@/src/lib/auth/adminAccess';
import { getRequestUser } from '@/src/lib/auth/requestUser';

import { prisma } from '@/src/lib/db';
import { featherRegistry } from '@/src/lib/feathers/registry';


export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      posts: posts.map(post => ({
        ...post,
        status: (post.visibility || 'published').toLowerCase(),
        body: post.body ? post.body.substring(0, 200) + '...' : '',
      }))
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
  // Unified auth token retrieval (supports legacy cookies)
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    if (!user || !canCreateContent(user)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

  const body = await request.json();
  const { title, slug, body: content, excerpt, feather, visibility, publishedAt, featherData } = body;
  const tagsInput: unknown = (body as any)?.tags;
  const categoriesInput: unknown = (body as any)?.categories;

    if (!title) {
      return NextResponse.json(
        { success: false, message: 'Title is required' },
        { status: 400 }
      );
    }

    // Helpers
    const slugify = (s: string) => s
      .toString()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Generate slug if not provided
    const finalSlug = slug || slugify(title);

    // Check if slug already exists
    const existingPost = await prisma.post.findUnique({
      where: { slug: finalSlug },
    });

    if (existingPost) {
      return NextResponse.json(
        { success: false, message: 'A post with this slug already exists' },
        { status: 400 }
      );
    }

    // Create the post
    // Normalize feather (default TEXT) and visibility
    const normalizedFeather = (feather || 'TEXT').toString().toUpperCase();
    const allowedFeathers = ['TEXT','PHOTO','QUOTE','LINK','VIDEO','AUDIO','UPLOADER'];
    const finalFeather = allowedFeathers.includes(normalizedFeather) ? normalizedFeather : 'TEXT';

  // Default visibility: PUBLISHED (aligns with Prisma schema default) unless explicitly provided
  const normalizedVisibility = (visibility || 'PUBLISHED').toString().toUpperCase();
    const allowedVisibility = ['DRAFT','SCHEDULED','PUBLISHED','PRIVATE','ARCHIVED'];
    const finalVisibility = allowedVisibility.includes(normalizedVisibility) ? normalizedVisibility : 'DRAFT';

    // Validate / sanitize featherData if present
    let sanitizedFeatherData: any = null;
    if (featherData && typeof featherData === 'object') {
      try {
        const featherSlug = finalFeather.toLowerCase();
        const reg = featherRegistry.getFeather(featherSlug as any);
        if (reg && reg.manifest && (reg.manifest as any).schema) {
          sanitizedFeatherData = (reg.manifest as any).schema.parse(featherData);
        } else {
          sanitizedFeatherData = featherData;
        }
      } catch (e: any) {
        return NextResponse.json({ success: false, message: 'Invalid feather data: ' + e.message }, { status: 400 });
      }
    }

    // Unify content source: prefer explicit body, else allow text.markdown from featherData
    let bodyContent: string | null = (typeof content === 'string' && content.trim()) ? content : null;
    if (!bodyContent && finalFeather === 'TEXT' && sanitizedFeatherData && typeof sanitizedFeatherData.markdown === 'string') {
      const md = sanitizedFeatherData.markdown.trim();
      if (md) bodyContent = md;
    }
    // For TEXT feather we require body content (from either source)
    if (finalFeather === 'TEXT' && (!bodyContent || !bodyContent.trim())) {
      return NextResponse.json(
        { success: false, message: 'Content body is required for text posts' },
        { status: 400 }
      );
    }
    if (finalFeather !== 'TEXT' && !sanitizedFeatherData) {
      // Provide a clearer error when media post lacks payload
      return NextResponse.json(
        { success: false, message: `Feather data is required for ${finalFeather.toLowerCase()} posts` },
        { status: 400 }
      );
    }

    // Derive excerpt: prefer explicit excerpt, then body substring (text), else feather generator
    let finalExcerpt: string | undefined = excerpt;
    if (!finalExcerpt) {
      if (bodyContent && typeof bodyContent === 'string' && bodyContent.trim()) {
        finalExcerpt = bodyContent.substring(0, 200) + (bodyContent.length > 200 ? '...' : '');
      } else if (sanitizedFeatherData) {
        try {
          finalExcerpt = featherRegistry.generateExcerpt(finalFeather.toLowerCase(), sanitizedFeatherData) || undefined;
        } catch {
          // ignore excerpt generation failure
        }
      }
    }

    // Normalize tags & categories input
    const tagNames: string[] = Array.isArray(tagsInput)
      ? (tagsInput as any[]).map(v => (typeof v === 'string' ? v : '')).filter(Boolean)
      : [];
    const categoryNames: string[] = Array.isArray(categoriesInput)
      ? (categoriesInput as any[]).map(v => (typeof v === 'string' ? v : '')).filter(Boolean)
      : [];

    const uniqueTagSlugs = Array.from(new Set(tagNames.map(n => slugify(n)))).filter(Boolean);
    const uniqueCategorySlugs = Array.from(new Set(categoryNames.map(n => slugify(n)))).filter(Boolean);

    // Use a transaction to create post, upsert tags/categories, and link them
    const result = await prisma.$transaction(async (tx) => {
      // Upsert tags
      const tagRecords = [] as { id: string; slug: string }[];
      for (const slug of uniqueTagSlugs) {
        const name = tagNames.find(n => slugify(n) === slug) || slug;
        const rec = await tx.tag.upsert({
          where: { slug },
          create: { slug, name },
          update: { name },
        });
        tagRecords.push({ id: rec.id, slug: rec.slug });
      }

      // Upsert categories
      const categoryRecords = [] as { id: string; slug: string }[];
      for (const slug of uniqueCategorySlugs) {
        const name = categoryNames.find(n => slugify(n) === slug) || slug;
        const rec = await tx.category.upsert({
          where: { slug },
          create: { slug, name },
          update: { name },
        });
        categoryRecords.push({ id: rec.id, slug: rec.slug });
      }

      // Create post
    const post = await tx.post.create({
        data: {
          title,
          slug: finalSlug,
      body: bodyContent || null,
          excerpt: finalExcerpt || null,
          feather: finalFeather as any,
          featherData: sanitizedFeatherData,
          visibility: finalVisibility as any,
          publishedAt: finalVisibility === 'PUBLISHED' ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
          authorId: user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      });

      // Link tags & categories if provided
      if (tagRecords.length) {
        await tx.postTag.createMany({
          data: tagRecords.map(tr => ({ postId: post.id, tagId: tr.id })),
          skipDuplicates: true,
        });
      }
      if (categoryRecords.length) {
        await tx.postCategory.createMany({
          data: categoryRecords.map(cr => ({ postId: post.id, categoryId: cr.id })),
          skipDuplicates: true,
        });
      }

      return post;
    });

    // Safety log (shouldn't happen with new validation)
    if (finalFeather !== 'TEXT' && !sanitizedFeatherData) {
      console.warn(`Post ${result.id} created with feather ${finalFeather} but no featherData payload (unexpected).`);
    }

    return NextResponse.json({ success: true, post: result, message: 'Post created successfully' });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create post' },
      { status: 500 }
    );
  }
}
