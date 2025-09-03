/**
 * Rights Module
 * -------------
 * Manages copyright and licensing information for content.
 * Supports Creative Commons licenses and custom attribution.
 */

import { z } from 'zod';

import { registerModule } from '../../lib/modules/registry';

export const rightsService = {
  getLicenseInfo(licenseId: string): { name: string; url: string; description: string } | null {
    const licenses: Record<string, { name: string; url: string; description: string }> = {
      'cc-by-4.0': {
        name: 'Creative Commons Attribution 4.0',
        url: 'https://creativecommons.org/licenses/by/4.0/',
        description: 'You are free to share and adapt the material with attribution',
      },
      'cc-by-sa-4.0': {
        name: 'Creative Commons Attribution-ShareAlike 4.0',
        url: 'https://creativecommons.org/licenses/by-sa/4.0/',
        description: 'You are free to share and adapt the material with attribution and same license',
      },
      'all-rights-reserved': {
        name: 'All Rights Reserved',
        url: '',
        description: 'Traditional copyright protection',
      },
    };

    return licenses[licenseId] || null;
  },

  generateAttribution(postTitle: string, authorName: string, licenseId: string): string {
    const license = this.getLicenseInfo(licenseId);
    if (!license) return '';

    let attribution = `"${postTitle}" by ${authorName}`;
    if (license.url) {
      attribution += ` is licensed under ${license.name} (${license.url})`;
    } else {
      attribution += ` - ${license.name}`;
    }

    return attribution;
  },
};

// Register the module
registerModule({
  manifest: {
    slug: 'rights',
    name: 'Rights & Attribution',
    version: '1.0.0',
    description: 'Copyright and licensing management for content',
    dependencies: [],
    config: {
      schema: z.object({
        defaultLicense: z.string().default('all-rights-reserved'),
        showAttribution: z.boolean().default(true),
        enablePerPostLicense: z.boolean().default(true),
      }),
      defaults: {
        defaultLicense: 'all-rights-reserved',
        showAttribution: true,
        enablePerPostLicense: true,
      },
    },
  },
  async activate() {
    console.log('[Rights] Module activated');
  },

  async deactivate() {
    console.log('[Rights] Module deactivated');
  },
});
