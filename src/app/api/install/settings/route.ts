/**
 * Installation Settings API
 * Configures initial site settings during installation
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/src/lib/db';

const SettingsSchema = z.object({
  title: z.string().min(1, 'Site title is required'),
  description: z.string().optional(),
  theme: z.string().default('sparrow')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, theme } = SettingsSchema.parse(body);

    // Create or update site settings
    await prisma.setting.upsert({
      where: { key: 'site_title' },
      update: { value: title },
      create: { key: 'site_title', value: title }
    });

    await prisma.setting.upsert({
      where: { key: 'site_description' },
      update: { value: description || '' },
      create: { key: 'site_description', value: description || '' }
    });

    await prisma.setting.upsert({
      where: { key: 'active_theme' },
      update: { value: theme },
      create: { key: 'active_theme', value: theme }
    });

    await prisma.setting.upsert({
      where: { key: 'installation_complete' },
      update: { value: 'false' },
      create: { key: 'installation_complete', value: 'false' }
    });

    await prisma.setting.upsert({
      where: { key: 'timezone' },
      update: { value: 'UTC' },
      create: { key: 'timezone', value: 'UTC' }
    });

    await prisma.setting.upsert({
      where: { key: 'posts_per_page' },
      update: { value: '10' },
      create: { key: 'posts_per_page', value: '10' }
    });

    return NextResponse.json({
      success: true,
      message: 'Settings configured successfully'
    });

  } catch (error) {
    console.error('[Install Settings] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid settings data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to configure settings' },
      { status: 500 }
    );
  }
}
