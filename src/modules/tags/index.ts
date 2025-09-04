/**
 * Tags Module
 * -----------
 * Provides comprehensive tag management functionality:
 * - CRUD operations for tags
 * - Many-to-many relationship management between posts and tags
 * - Tag search, filtering, and auto-completion
 * - Tag statistics and trending analysis
 */

import { z } from 'zod';

import { prisma } from '../../lib/db';
import { eventBus, CoreEvents } from '../../lib/events';
import { registerModule } from '../../lib/modules/registry';

// Tag validation schema
export const TagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Tag name too long'),
  slug: z.string().optional(),
});

export type TagInput = z.infer<typeof TagSchema>;

// Tag service functions
export const tagService = {
  /**
   * Create or get existing tag by name
   */
  async createTag(input: TagInput) {
    const validatedInput = TagSchema.parse(input);

    // Generate slug if not provided
    const slug = validatedInput.slug ||
      validatedInput.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    // Try to find existing tag first
    const existingTag = await prisma.tag.findFirst({
      where: {
        OR: [
          { name: validatedInput.name },
          { slug },
        ],
      },
    });

    if (existingTag) {
      return existingTag;
    }

    // Create new tag
    const tag = await prisma.tag.create({
      data: {
        name: validatedInput.name,
        slug,
      },
    });

    // Emit event for new tag
    await eventBus.emit(CoreEvents.TagCreated, {
      tagId: tag.id,
      name: tag.name,
      slug: tag.slug,
    });

    return tag;
  },

  /**
   * Get or create multiple tags by names
   */
  async getOrCreateTags(tagNames: string[]) {
    const tags = [];

    for (const name of tagNames) {
      const tag = await this.createTag({ name: name.trim() });
      tags.push(tag);
    }

    return tags;
  },

  /**
   * Associate tags with a post
   */
  async setPostTags(postId: string, tagNames: string[]) {
    // Remove existing associations
    await prisma.postTag.deleteMany({
      where: { postId },
    });

    if (tagNames.length === 0) {
      return [];
    }

    // Get or create tags
    const tags = await this.getOrCreateTags(tagNames);

    // Create new associations
    await prisma.postTag.createMany({
      data: tags.map(tag => ({
        postId,
        tagId: tag.id,
      })),
    });

    // Tag counts are computed dynamically, no update needed

    return tags;
  },

  /**
   * Get tags for a post
   */
  async getPostTags(postId: string) {
    const postTags = await prisma.postTag.findMany({
      where: { postId },
      include: { tag: true },
      orderBy: { tag: { name: 'asc' } },
    });

    return postTags.map(pt => pt.tag);
  },

  /**
   * Get posts for a tag
   */
  async getTagPosts(tagSlug: string, page = 1, limit = 10) {
    const tag = await prisma.tag.findUnique({
      where: { slug: tagSlug },
    });

    if (!tag) {
      throw new Error('Tag not found');
    }

    const offset = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          tags: {
            some: { tagId: tag.id },
          },
          visibility: 'PUBLISHED',
        },
        include: {
          author: true,
          tags: {
            include: { tag: true },
          },
          _count: {
            select: {
              comments: { where: { status: 'APPROVED' } },
              likes: true,
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.post.count({
        where: {
          tags: {
            some: { tagId: tag.id },
          },
          visibility: 'PUBLISHED',
        },
      }),
    ]);

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      tag,
    };
  },

  /**
   * Search tags by name
   */
  async searchTags(query: string, limit = 10) {
    const tags = await prisma.tag.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        _count: {
          select: {
            posts: {
              where: {
                post: { visibility: 'PUBLISHED' },
              },
            },
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
      take: limit,
    });

    // Sort by post count desc, then by name
    return tags
      .sort((a, b) => b._count.posts - a._count.posts || a.name.localeCompare(b.name))
      .map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        createdAt: tag.createdAt,
        postCount: tag._count.posts,
      }));
  },

  /**
   * Get popular tags (computed dynamically)
   */
  async getPopularTags(limit = 20) {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            posts: {
              where: {
                post: { visibility: 'PUBLISHED' },
              },
            },
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    // Filter tags with posts and sort by count
    const tagsWithPosts = tags
      .filter(tag => tag._count.posts > 0)
      .sort((a, b) => b._count.posts - a._count.posts)
      .slice(0, limit);

    return tagsWithPosts.map(tag => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      createdAt: tag.createdAt,
      postCount: tag._count.posts,
    }));
  },

  /**
   * Get tag cloud data
   */
  async getTagCloud(limit = 50) {
    const tags = await this.getPopularTags(limit);

    if (tags.length === 0) {
      return [];
    }

    const maxCount = Math.max(...tags.map(t => t.postCount));
    const minCount = Math.min(...tags.map(t => t.postCount));

    return tags.map(tag => ({
      ...tag,
      weight: minCount === maxCount ? 1 :
        (tag.postCount - minCount) / (maxCount - minCount),
    }));
  },

  /**
   * Update tag usage counts (no-op since counts are computed dynamically)
   */
  async updateTagCounts() {
    // Post counts are computed dynamically via _count in queries
    // No need to store them in the database
  },

  /**
   * Delete unused tags
   */
  async cleanupUnusedTags() {
    // Find tags with no posts
    const unusedTags = await prisma.tag.findMany({
      where: {
        posts: { none: {} },
      },
    });

    if (unusedTags.length > 0) {
      const deletedTags = await prisma.tag.deleteMany({
        where: {
          id: { in: unusedTags.map(tag => tag.id) },
        },
      });

      return deletedTags.count;
    }

    return 0;
  },

  /**
   * Merge tags (move all posts from source to target, delete source)
   */
  async mergeTags(sourceTagId: string, targetTagId: string) {
    const [sourceTag, targetTag] = await Promise.all([
      prisma.tag.findUnique({ where: { id: sourceTagId } }),
      prisma.tag.findUnique({ where: { id: targetTagId } }),
    ]);

    if (!sourceTag || !targetTag) {
      throw new Error('One or both tags not found');
    }

    // Move all post associations from source to target
    const sourcePostTags = await prisma.postTag.findMany({
      where: { tagId: sourceTagId },
    });

    for (const postTag of sourcePostTags) {
      // Check if target association already exists
      const existingAssociation = await prisma.postTag.findFirst({
        where: {
          postId: postTag.postId,
          tagId: targetTagId,
        },
      });

      if (!existingAssociation) {
        await prisma.postTag.create({
          data: {
            postId: postTag.postId,
            tagId: targetTagId,
          },
        });
      }
    }

    // Delete source tag and its associations
    await prisma.postTag.deleteMany({
      where: { tagId: sourceTagId },
    });

    await prisma.tag.delete({
      where: { id: sourceTagId },
    });

    // Tag counts are computed dynamically, no update needed

    return targetTag;
  },
};

// Module registration
registerModule({
  manifest: {
    slug: 'tags',
    name: 'Tags',
    version: '1.0.0',
    description: 'Comprehensive tag management and organization system',
    dependencies: [],
    config: {
      schema: z.object({
        maxTagsPerPost: z.number().default(10),
        allowUserTags: z.boolean().default(true),
        minTagLength: z.number().default(2),
        maxTagLength: z.number().default(50),
        cleanupInterval: z.number().default(7),
      }),
      defaults: {
        maxTagsPerPost: 10,
        allowUserTags: true,
        minTagLength: 2,
        maxTagLength: 50,
        cleanupInterval: 7,
      },
    },
  },
  async activate() {
    console.log('[Tags] Module activated');

    // Subscribe to post events for potential cleanup
    eventBus.on(CoreEvents.PostPublished, async (payload: any) => {
      const { postId } = payload || {};
      const tags = await tagService.getPostTags(postId);
      console.log(`[Tags] Post ${postId} published with ${tags.length} tags`);
      // Tag counts are computed dynamically
    });

    eventBus.on(CoreEvents.PostUnpublished, async (payload: any) => {
      const { postId } = payload || {};
      const tags = await tagService.getPostTags(postId);
      console.log(`[Tags] Post ${postId} unpublished, had ${tags.length} tags`);
      // Tag counts are computed dynamically
    });

  eventBus.on(CoreEvents.PostDeleted, async () => {
      // Tag associations are cascade deleted via database constraints
      // Update all tag counts to be safe
      await tagService.updateTagCounts();
    });
  },

  async deactivate() {
    console.log('[Tags] Module deactivated');
  },
});

// The tagService is already exported above with 'export const'
