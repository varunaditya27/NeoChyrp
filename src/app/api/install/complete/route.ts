/**
 * Installation Complete API
 * Finalizes the installation process
 */

import { type NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/src/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Mark installation as complete
    await prisma.setting.upsert({
      where: { key: 'installation_complete' },
      update: { value: 'true' },
      create: { key: 'installation_complete', value: 'true' }
    });

    // Set installation date
    await prisma.setting.upsert({
      where: { key: 'installation_date' },
      update: { value: new Date().toISOString() },
      create: { key: 'installation_date', value: new Date().toISOString() }
    });

    // Set version
    await prisma.setting.upsert({
      where: { key: 'neochyrp_version' },
      update: { value: '1.0.0' },
      create: { key: 'neochyrp_version', value: '1.0.0' }
    });

    // Create welcome post
    await createWelcomePost();

    return NextResponse.json({
      success: true,
      message: 'Installation completed successfully',
      redirectTo: '/admin'
    });

  } catch (error) {
    console.error('[Install Complete] Error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to complete installation' },
      { status: 500 }
    );
  }
}

async function createWelcomePost() {
  try {
    // Get the admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'OWNER' }
    });

    if (!adminUser) {
      console.warn('No admin user found for welcome post');
      return;
    }

    // Check if welcome post already exists
    const existingPost = await prisma.post.findFirst({
      where: { slug: 'welcome-to-neochyrp' }
    });

    if (existingPost) {
      return; // Welcome post already exists
    }

    // Create welcome post
    await prisma.post.create({
      data: {
        slug: 'welcome-to-neochyrp',
        title: 'Welcome to NeoChyrp!',
        body: `# Welcome to your new NeoChyrp blog!

Congratulations! You've successfully installed NeoChyrp, a modern and flexible blogging platform inspired by Chyrp-Lite.

## What can you do now?

- **Write your first post** - Use the admin dashboard to create content
- **Customize your theme** - Choose from available themes or customize the current one
- **Enable modules** - Add functionality like comments, webmentions, and more
- **Manage users** - Add authors and contributors to your blog

## Getting Started

1. Visit the [Admin Dashboard](/admin) to manage your site
2. Check out the [Posts section](/admin/posts) to write new content
3. Explore the [Settings](/admin/settings) to customize your site

## Content Types (Feathers)

NeoChyrp supports different types of content called "Feathers":

- **Text** - Regular blog posts and articles
- **Photo** - Image posts with captions
- **Quote** - Highlighted quotes with attribution
- **Link** - Bookmarks and link sharing
- **Video** - Embedded video content
- **Audio** - Audio posts and podcasts

## Need Help?

- Check the documentation for detailed guides
- Visit the community forums for support
- Report issues on GitHub

Happy blogging!`,
        excerpt: 'Welcome to your new NeoChyrp blog! Get started with writing, customizing themes, and exploring features.',
        feather: 'TEXT',
        visibility: 'PUBLISHED',
        publishedAt: new Date(),
        authorId: adminUser.id
      }
    });

    console.log('Welcome post created successfully');

  } catch (error) {
    console.error('Failed to create welcome post:', error);
    // Don't throw - this is not critical for installation
  }
}
