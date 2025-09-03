import '@/src/lib/bootstrap';
import { NextRequest } from 'next/server';
import { ok, failure } from '@/src/lib/api/respond';
import { settingsService } from '@/src/lib/settings/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await settingsService.getSiteSettings();
    return ok(settings);
  } catch (e:any) {
    return failure(e.message || 'Error', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}));
  const { title, tagline, theme, postsPerPage, defaultVisibility } = body || {};
  const updated = await settingsService.updateSiteSettings({ title, tagline, theme, postsPerPage, defaultVisibility });
    return ok(updated);
  } catch (e:any) {
    return failure(e.message || 'Error', 500);
  }
}
