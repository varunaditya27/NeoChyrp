/**
 * Rights Module
 * -------------
 * Manages copyright/licensing metadata and attribution strings.
 * Supports Creative Commons and custom licenses.
 */

import { z } from 'zod';

import { prisma } from '../../lib/db';
import { eventBus, CoreEvents } from '../../lib/events';
import { registerModule, type ModuleContext } from '../../lib/modules/registry';

interface License {
  code: string;
  name: string;
  url?: string;
  description: string;
  requiresAttribution: boolean;
  allowsCommercial: boolean;
  allowsDerivatives: boolean;
  requiresShareAlike: boolean;
}

interface CopyrightInfo {
  holder: string;
  year: number;
  license: License;
  customNotice?: string;
}

const licenseCatalog: Record<string, License> = {
  'CC-BY-4.0': {
    code: 'CC-BY-4.0',
    name: 'Creative Commons Attribution 4.0',
    url: 'https://creativecommons.org/licenses/by/4.0/',
    description: 'Share and adapt with attribution.',
    requiresAttribution: true,
    allowsCommercial: true,
    allowsDerivatives: true,
    requiresShareAlike: false,
  },
  'CC-BY-SA-4.0': {
    code: 'CC-BY-SA-4.0',
    name: 'Creative Commons Attribution-ShareAlike 4.0',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    description: 'Adapt with attribution under identical license.',
    requiresAttribution: true,
    allowsCommercial: true,
    allowsDerivatives: true,
    requiresShareAlike: true,
  },
  'CC-BY-NC-4.0': {
    code: 'CC-BY-NC-4.0',
    name: 'Creative Commons Attribution-NonCommercial 4.0',
    url: 'https://creativecommons.org/licenses/by-nc/4.0/',
    description: 'Share and adapt with attribution for non-commercial use.',
    requiresAttribution: true,
    allowsCommercial: false,
    allowsDerivatives: true,
    requiresShareAlike: false,
  },
  'CC-BY-NC-SA-4.0': {
    code: 'CC-BY-NC-SA-4.0',
    name: 'Creative Commons Attribution-NonCommercial-ShareAlike 4.0',
    url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    description: 'Adapt with attribution for non-commercial use under identical license.',
    requiresAttribution: true,
    allowsCommercial: false,
    allowsDerivatives: true,
    requiresShareAlike: true,
  },
  'CC-BY-ND-4.0': {
    code: 'CC-BY-ND-4.0',
    name: 'Creative Commons Attribution-NoDerivatives 4.0',
    url: 'https://creativecommons.org/licenses/by-nd/4.0/',
    description: 'Share with attribution but no derivatives allowed.',
    requiresAttribution: true,
    allowsCommercial: true,
    allowsDerivatives: false,
    requiresShareAlike: false,
  },
  'CC0-1.0': {
    code: 'CC0-1.0',
    name: 'Creative Commons Zero v1.0 Universal',
    url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    description: 'Public domain dedication.',
    requiresAttribution: false,
    allowsCommercial: true,
    allowsDerivatives: true,
    requiresShareAlike: false,
  },
  'ALL-RIGHTS-RESERVED': {
    code: 'ALL-RIGHTS-RESERVED',
    name: 'All Rights Reserved',
    url: '',
    description: 'Traditional copyright protection.',
    requiresAttribution: true,
    allowsCommercial: false,
    allowsDerivatives: false,
    requiresShareAlike: false,
  },
  'CUSTOM': {
    code: 'CUSTOM',
    name: 'Custom License',
    description: 'Custom licensing terms.',
    requiresAttribution: true,
    allowsCommercial: false,
    allowsDerivatives: false,
    requiresShareAlike: false,
  },
};

export const rightsService = {
  /**
   * Get license information by code
   */
  getLicense(code: string): License | null {
    return licenseCatalog[code] || null;
  },

  /**
   * Get all available licenses
   */
  getAllLicenses(): License[] {
    return Object.values(licenseCatalog);
  },

  /**
   * Set copyright information for a post
   */
  async setCopyrightInfo(
    postId: string,
    copyrightInfo: Partial<CopyrightInfo>
  ): Promise<void> {
    try {
      const existingRights = await prisma.postRights.findUnique({
        where: { postId },
      });

      const data = {
        postId,
        copyrightHolder: copyrightInfo.holder || 'Site Owner',
        copyrightYear: copyrightInfo.year || new Date().getFullYear(),
        licenseCode: copyrightInfo.license?.code || 'CC-BY-4.0',
        customNotice: copyrightInfo.customNotice || null,
      };

      if (existingRights) {
        await prisma.postRights.update({
          where: { postId },
          data,
        });
      } else {
        await prisma.postRights.create({
          data,
        });
      }

      await eventBus.emit(CoreEvents.PostRightsUpdated, {
        postId,
        copyrightInfo,
      });

    } catch (error) {
      console.error('[Rights] Error setting copyright info:', error);
      throw error;
    }
  },

  /**
   * Get copyright information for a post
   */
  async getCopyrightInfo(postId: string): Promise<CopyrightInfo | null> {
    try {
      const rights = await prisma.postRights.findUnique({
        where: { postId },
      });

      if (!rights) {
        return null;
      }

      const license = this.getLicense(rights.licenseCode);
      if (!license) {
        console.warn(`[Rights] Unknown license code: ${rights.licenseCode}`);
        return null;
      }

      return {
        holder: rights.copyrightHolder,
        year: rights.copyrightYear,
        license,
        customNotice: rights.customNotice || undefined,
      };

    } catch (error) {
      console.error('[Rights] Error getting copyright info:', error);
      return null;
    }
  },

  /**
   * Generate attribution string for a post
   */
  async generateAttributionString(
    postId: string,
    postTitle?: string,
    postUrl?: string
  ): Promise<string | null> {
    try {
      const copyrightInfo = await this.getCopyrightInfo(postId);
      if (!copyrightInfo) {
        return null;
      }

      const { holder, year, license, customNotice } = copyrightInfo;

      // If there's a custom notice, use it
      if (customNotice) {
        return customNotice;
      }

      // Build standard attribution
      let attribution = `© ${year} ${holder}`;

      if (license.code !== 'ALL-RIGHTS-RESERVED') {
        attribution += `. Licensed under ${license.name}`;

        if (license.url) {
          attribution += ` (${license.url})`;
        }
      }

      // Add post title and URL if provided and license requires attribution
      if (license.requiresAttribution && postTitle && postUrl) {
        attribution = `"${postTitle}" by ${holder} is licensed under ${license.name}. View original at ${postUrl}`;
      }

      return attribution;

    } catch (error) {
      console.error('[Rights] Error generating attribution string:', error);
      return null;
    }
  },

  /**
   * Generate copyright notice for site footer
   */
  async generateSiteNotice(siteName: string, year?: number): Promise<string> {
    const currentYear = year || new Date().getFullYear();
    return `© ${currentYear} ${siteName}. All rights reserved.`;
  },

  /**
   * Check if license allows specific usage
   */
  checkLicensePermission(
    license: License,
    usage: 'commercial' | 'derivatives' | 'attribution_required'
  ): boolean {
    switch (usage) {
      case 'commercial':
        return license.allowsCommercial;
      case 'derivatives':
        return license.allowsDerivatives;
      case 'attribution_required':
        return license.requiresAttribution;
      default:
        return false;
    }
  },

  /**
   * Get default copyright info for new posts
   */
  getDefaultCopyrightInfo(): Partial<CopyrightInfo> {
    return {
      holder: 'Site Owner',
      year: new Date().getFullYear(),
      license: this.getLicense('CC-BY-4.0')!,
    };
  },

  /**
   * Bulk update copyright info for multiple posts
   */
  async bulkUpdateCopyrights(
    postIds: string[],
    copyrightInfo: Partial<CopyrightInfo>
  ): Promise<number> {
    try {
      let updatedCount = 0;

      for (const postId of postIds) {
        await this.setCopyrightInfo(postId, copyrightInfo);
        updatedCount++;
      }

      console.log(`[Rights] Updated copyright info for ${updatedCount} posts`);
      return updatedCount;

    } catch (error) {
      console.error('[Rights] Error in bulk update:', error);
      throw error;
    }
  },

  /**
   * Handle post creation event - set default rights
   */
  async handlePostCreated(event: any): Promise<void> {
    try {
      const { post } = event;
      if (!post?.id) return;

      const defaultInfo = this.getDefaultCopyrightInfo();
      await this.setCopyrightInfo(post.id, defaultInfo);

    } catch (error) {
      console.error('[Rights] Error handling post created event:', error);
    }
  },
};

// Register module
registerModule({
  manifest: {
    slug: 'rights',
    name: 'Rights & Licensing',
    description: 'Copyright and licensing management for content',
    version: '1.0.0',
    dependencies: [],
    config: {
      schema: z.object({
        defaultLicenseCode: z.string().default('CC-BY-4.0'),
        showAttribution: z.boolean().default(true),
        enablePerPostLicense: z.boolean().default(true),
        defaultCopyrightHolder: z.string().default('Site Owner'),
        requireLicenseSelection: z.boolean().default(false),
      }),
      defaults: {
        defaultLicenseCode: 'CC-BY-4.0',
        showAttribution: true,
        enablePerPostLicense: true,
        defaultCopyrightHolder: 'Site Owner',
        requireLicenseSelection: false,
      },
    },
  },
  activate(_ctx: ModuleContext) {
    // Set up event handlers
    eventBus.on(CoreEvents.PostCreated, rightsService.handlePostCreated);
  },
  config: {
    defaultLicenseCode: 'CC-BY-4.0',
    showAttribution: true,
    enablePerPostLicense: true,
    defaultCopyrightHolder: 'Site Owner',
    requireLicenseSelection: false,
  },
});
