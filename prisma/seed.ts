/**
 * NeoChyrp Seed Script (idempotent-lean):
 * - Owner user & default group/permissions scaffold.
 * - Core settings (site name, description, theme).
 * - Default taxonomy (General category, sample tag).
 * - Default license (CC-BY-4.0) and mapping example.
 * - Sample welcome post (only if no posts yet) with metadata.
 * - Sample posts demonstrating all feather types.
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
  password: '$2a$10$seedplaceholderhashedpass1234567890abcdefabcdefabcdef', // TODO: replace with secure hash or rotate
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
  await prisma.userGroup.upsert({
    where: { userId_groupId: { userId: ownerId, groupId: ownersGroup.id } },
    update: {},
    create: { userId: ownerId, groupId: ownersGroup.id }
  });
  // Attach permissons to owners group.
  for (const permId of permissions) {
    await prisma.groupPermission.upsert({
      where: { groupId_permissionId: { groupId: ownersGroup.id, permissionId: permId } },
      update: {},
      create: { groupId: ownersGroup.id, permissionId: permId }
    });
  }
}

async function ensureSettings() {
  await prisma.setting.upsert({
    where: { key: 'site_name' },
    update: {},
    create: { key: 'site_name', value: 'NeoChyrp Blog' }
  });
  await prisma.setting.upsert({
    where: { key: 'site_description' },
    update: {},
    create: { key: 'site_description', value: 'A modern, extensible blogging platform' }
  });
  await prisma.setting.upsert({
    where: { key: 'theme' },
    update: {},
    create: { key: 'theme', value: 'default' }
  });
}

async function ensureTaxonomy() {
  await prisma.category.upsert({
    where: { slug: 'general' },
    update: {},
    create: { slug: 'general', name: 'General' }
  });
  await prisma.tag.upsert({
    where: { slug: 'intro' },
    update: {},
    create: { slug: 'intro', name: 'Introduction' }
  });
}

async function ensureLicense() {
  const license = await prisma.license.upsert({
    where: { code: 'cc-by-4' },
    update: {},
    create: {
      code: 'cc-by-4',
      name: 'Creative Commons Attribution 4.0',
      url: 'https://creativecommons.org/licenses/by/4.0/'
    }
  });
  return license;
}

async function ensureWelcomePost(ownerId: string) {
  const existing = await prisma.post.findUnique({ where: { slug: 'welcome' } });
  if (existing) return existing;
  const post = await prisma.post.create({
    data: {
      slug: 'welcome',
      title: 'Welcome to NeoChyrp',
      authorId: ownerId,
      feather: 'TEXT',
      visibility: 'PUBLISHED',
      publishedAt: new Date(),
      excerpt: 'Welcome to your freshly seeded NeoChyrp instance with modern feather support.',
      featherData: {
        markdown: '# Welcome to NeoChyrp\n\nThis is your freshly seeded instance with full feather support! NeoChyrp now includes modern content types:\n\n- **Text posts** with Markdown support\n- **Photo posts** for image sharing\n- **Quote posts** for beautiful quotations\n- **Link posts** with rich previews\n- **Video posts** for multimedia content\n- **Audio posts** for podcasts and music\n- **Uploader posts** for file galleries\n\nEach content type is designed to provide the best user experience for that specific type of content.',
        enableComments: true,
        allowRichFormatting: true
      }
    }
  });
  // Attach meta
  await prisma.postMeta.create({ data: { postId: post.id, key: 'featured', value: true } });
  return post;
}

async function ensureSamplePosts(ownerId: string) {
  // Sample Photo Post
  const photoPost = await prisma.post.findUnique({ where: { slug: 'sample-photo-post' } });
  if (!photoPost) {
    await prisma.post.create({
      data: {
        slug: 'sample-photo-post',
        title: 'Beautiful Landscape Photography',
        authorId: ownerId,
        feather: 'PHOTO',
        visibility: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 86400000), // 1 day ago
        excerpt: 'A stunning landscape photograph showcasing natural beauty.',
        featherData: {
          imageId: 'sample-landscape',
          caption: 'A breathtaking mountain landscape at sunset',
          altText: 'Mountain range with orange and pink sunset sky',
          showImageInfo: true,
          enableLightbox: true
        }
      }
    });
  }

  // Sample Quote Post
  const quotePost = await prisma.post.findUnique({ where: { slug: 'inspirational-quote' } });
  if (!quotePost) {
    await prisma.post.create({
      data: {
        slug: 'inspirational-quote',
        title: 'Words of Wisdom',
        authorId: ownerId,
        feather: 'QUOTE',
        visibility: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 172800000), // 2 days ago
        excerpt: 'An inspirational quote about the power of technology and creativity.',
        featherData: {
          quote: 'Technology is best when it brings people together and enables creativity to flourish.',
          source: 'Tech Visionary',
          sourceUrl: 'https://example.com',
          style: 'pullquote',
          context: 'This quote perfectly captures the essence of modern web development and the philosophy behind NeoChyrp.'
        }
      }
    });
  }

  // Sample Link Post
  const linkPost = await prisma.post.findUnique({ where: { slug: 'interesting-article' } });
  if (!linkPost) {
    await prisma.post.create({
      data: {
        slug: 'interesting-article',
        title: 'The Future of Web Development',
        authorId: ownerId,
        feather: 'LINK',
        visibility: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 259200000), // 3 days ago
        excerpt: 'An insightful article about modern web development trends and technologies.',
        featherData: {
          url: 'https://example.com/future-web-dev',
          title: 'The Future of Web Development: Trends to Watch',
          description: 'Explore the latest trends in web development, from serverless architecture to AI-powered development tools.',
          thumbnail: 'https://via.placeholder.com/400x200/3B82F6/FFFFFF?text=Web+Development',
          siteName: 'Tech Insights',
          showPreview: true,
          openInNewTab: true
        }
      }
    });
  }

  // Sample Video Post
  const videoPost = await prisma.post.findUnique({ where: { slug: 'coding-tutorial' } });
  if (!videoPost) {
    await prisma.post.create({
      data: {
        slug: 'coding-tutorial',
        title: 'Learn React in 10 Minutes',
        authorId: ownerId,
        feather: 'VIDEO',
        visibility: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 345600000), // 4 days ago
        excerpt: 'A quick introduction to React fundamentals for beginners.',
        featherData: {
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoType: 'youtube',
          posterUrl: 'https://via.placeholder.com/800x450/DC2626/FFFFFF?text=React+Tutorial',
          title: 'React Fundamentals Tutorial',
          description: 'Learn the basics of React including components, props, and state management.',
          duration: 600,
          width: 800,
          height: 450,
          autoplay: false,
          muted: false,
          loop: false,
          controls: true
        }
      }
    });
  }

  // Sample Audio Post
  const audioPost = await prisma.post.findUnique({ where: { slug: 'podcast-episode' } });
  if (!audioPost) {
    await prisma.post.create({
      data: {
        slug: 'podcast-episode',
        title: 'Developer Insights Podcast - Episode 1',
        authorId: ownerId,
        feather: 'AUDIO',
        visibility: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 432000000), // 5 days ago
        excerpt: 'First episode of our developer insights podcast covering modern web technologies.',
        featherData: {
          audioUrl: 'https://example.com/podcast-episode-1.mp3',
          audioType: 'mp3',
          title: 'The State of Modern Web Development',
          artist: 'Developer Insights Team',
          album: 'Season 1',
          duration: 1800,
          description: 'Join us as we discuss the current state of web development, emerging technologies, and best practices.',
          coverArt: 'https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=Podcast',
          autoplay: false,
          loop: false,
          preload: 'metadata'
        }
      }
    });
  }

  // Sample Uploader Post
  const uploaderPost = await prisma.post.findUnique({ where: { slug: 'resource-collection' } });
  if (!uploaderPost) {
    await prisma.post.create({
      data: {
        slug: 'resource-collection',
        title: 'Useful Development Resources',
        authorId: ownerId,
        feather: 'UPLOADER',
        visibility: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 518400000), // 6 days ago
        excerpt: 'A collection of useful resources for web developers including guides and templates.',
        featherData: {
          files: [
            {
              url: 'https://example.com/react-cheatsheet.pdf',
              name: 'React Cheatsheet.pdf',
              size: 1024000,
              type: 'application/pdf',
              description: 'Comprehensive React hooks and components reference'
            },
            {
              url: 'https://example.com/css-grid-guide.pdf',
              name: 'CSS Grid Guide.pdf',
              size: 2048000,
              type: 'application/pdf',
              description: 'Complete guide to CSS Grid layout'
            },
            {
              url: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Template',
              name: 'Website Template.jpg',
              size: 512000,
              type: 'image/jpeg',
              description: 'Modern website template design'
            }
          ],
          description: 'Essential resources every web developer should have in their toolkit.',
          layout: 'grid',
          showThumbnails: true,
          showFileInfo: true,
          allowDownload: true
        }
      }
    });
  }
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
  console.log('Starting seed process...');
  const owner = await ensureOwner();
  console.log('✓ Owner created/found:', owner.email);

  await ensureGroupsAndPermissions(owner.id);
  console.log('✓ Groups and permissions configured');

  await ensureSettings();
  console.log('✓ Settings configured');

  await ensureTaxonomy();
  console.log('✓ Taxonomy configured');

  await ensureLicense();
  console.log('✓ License configured');

  const welcome = await ensureWelcomePost(owner.id);
  console.log('✓ Welcome post created/found:', welcome.slug);

  await ensureSamplePosts(owner.id);
  console.log('✓ Sample posts for all feathers created');

  await linkTaxonomyToPost(welcome.id);
  console.log('✓ Taxonomy linked to welcome post');

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
