/**
 * Installation Modules API
 * Activates selected modules during installation
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/src/lib/db';

const ModulesSchema = z.object({
  modules: z.array(z.string())
});

const availableModules = [
  'webmentions',
  'comments',
  'likes',
  'views',
  'sitemap',
  'rights',
  'pingable'
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modules } = ModulesSchema.parse(body);

    // Validate that all requested modules are available
    const invalidModules = modules.filter(module => !availableModules.includes(module));
    if (invalidModules.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid modules: ${invalidModules.join(', ')}` },
        { status: 400 }
      );
    }

    // Deactivate all modules first
    await prisma.moduleSettings.deleteMany();

    // Activate selected modules
    for (const moduleId of modules) {
      await prisma.moduleSettings.create({
        data: {
          moduleId,
          enabled: true,
          config: getDefaultConfig(moduleId)
        }
      });
    }

    // Also store the active modules list in settings
    await prisma.setting.upsert({
      where: { key: 'active_modules' },
      update: { value: JSON.stringify(modules) },
      create: { key: 'active_modules', value: JSON.stringify(modules) }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully activated ${modules.length} modules`,
      modules
    });

  } catch (error) {
    console.error('[Install Modules] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid modules data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to activate modules' },
      { status: 500 }
    );
  }
}

function getDefaultConfig(moduleId: string): Record<string, any> {
  const configs: Record<string, any> = {
    webmentions: {
      enableIncoming: true,
      enableOutgoing: true,
      timeout: 10000
    },
    comments: {
      requireModeration: false,
      allowAnonymous: true,
      requireEmail: true
    },
    likes: {
      allowAnonymous: true,
      showCount: true
    },
    views: {
      debounceMinutes: 15,
      trackUserAgent: true,
      maxRetentionDays: 365
    },
    sitemap: {
      autoGenerate: true,
      includePages: true,
      includePosts: true
    },
    rights: {
      defaultLicenseCode: 'CC-BY-4.0',
      showAttribution: true,
      enablePerPostLicense: true,
      defaultCopyrightHolder: 'Site Owner',
      requireLicenseSelection: false
    },
    pingable: {
      enabled: true,
      customTargets: [],
      timeout: 10000
    }
  };

  return configs[moduleId] || {};
}
