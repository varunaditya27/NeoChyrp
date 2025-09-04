/** Rights Module
 * Manages copyright / licensing metadata and attribution strings.
 */
import { z } from 'zod';

// NOTE: Adjust these import paths if your actual project alias differs.
import { prisma } from '@/src/lib/db';
import { registerModule } from '@/src/lib/modules/registry';

const licenseCatalog: Record<string, { name: string; url: string; description: string }> = {
  'CC-BY-4.0': {
    name: 'Creative Commons Attribution 4.0',
    url: 'https://creativecommons.org/licenses/by/4.0/',
    description: 'Share and adapt with attribution.'
  },
  'CC-BY-SA-4.0': {
    name: 'Creative Commons Attribution-ShareAlike 4.0',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    description: 'Adapt with attribution under identical license.'
  },
  'ALL-RIGHTS-RESERVED': {
    name: 'All Rights Reserved',
    url: '',
    description: 'Traditional copyright protection.'
  }
};

const configSchema = z.object({
  defaultLicenseCode: z.string().default('CC-BY-4.0'),
  showAttribution: z.boolean().default(true),
  enablePerPostLicense: z.boolean().default(true)
});

export const rightsService = {
  getLicenseInfo(code: string) {
    return licenseCatalog[code] || null;
  },
  generateAttribution(postTitle: string, authorName: string, code: string) {
    const lic = this.getLicenseInfo(code);
    if (!lic) return '';
    const base = `"${postTitle}" by ${authorName}`;
    return lic.url ? `${base} is licensed under ${lic.name} (${lic.url})` : `${base} - ${lic.name}`;
  },
  async ensurePostLicense(postId: string, code: string) {
    const licRec = await prisma.license.findUnique({ where: { code } });
    if (!licRec) return null;
    const existing = await prisma.postLicense.findFirst({ where: { postId, licenseId: licRec.id } });
    if (!existing) await prisma.postLicense.create({ data: { postId, licenseId: licRec.id } });
    return licRec;
  },
  async getAttribution(postId: string) {
    const rel = await prisma.postLicense.findFirst({ where: { postId }, include: { license: true } });
    if (!rel) return null;
    return rel.license.url
      ? `${rel.license.name} (${rel.license.url})`
      : rel.license.name;
  }
};

registerModule({
  manifest: {
    slug: 'rights',
    name: 'Rights & Licensing',
    version: '1.0.0',
    description: 'Adds license association, catalog and attribution generation.',
    dependencies: [],
    config: { schema: configSchema, defaults: { defaultLicenseCode: 'CC-BY-4.0', showAttribution: true, enablePerPostLicense: true } }
  },
  async activate() { console.log('[Rights] activated'); },
  async deactivate() { console.log('[Rights] deactivated'); }
});
