import '@/src/lib/bootstrap';

import type { NextRequest } from 'next/server';
import { ok, failure } from '@/src/lib/api/respond';
import { settingsService } from '@/src/lib/settings/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await settingsService.getSiteSettings();
    // Wrap in {settings} for client expecting data.settings or direct settings
    return ok({ settings });
  } catch (e:any) {
    return failure(e.message || 'Error', 500);
  }
}

async function applyUpdate(req: NextRequest) {
  const body = await req.json().catch(()=>({}));
  // Accept both legacy names (siteName/siteDescription/siteUrl/adminEmail) and new internal keys
  const mapped = {
    title: body.title || body.siteName,
    tagline: body.tagline || body.siteDescription,
    theme: body.theme,
    postsPerPage: body.postsPerPage,
    defaultVisibility: body.defaultVisibility,
    description: body.description || body.siteDescription,
    url: body.url || body.siteUrl,
    contact: body.contact || body.adminEmail,
    allowRegistration: body.allowRegistration,
    defaultRole: body.defaultRole,
    timezone: body.timezone,
    language: body.language
  };
  const updated = await settingsService.updateSiteSettings(mapped);
  return ok({ settings: updated });
}

export async function PATCH(req: NextRequest) {
  try { return await applyUpdate(req); } catch (e:any) { return failure(e.message || 'Error', 500); }
}

export async function PUT(req: NextRequest) {
  try { return await applyUpdate(req); } catch (e:any) { return failure(e.message || 'Error', 500); }
}
