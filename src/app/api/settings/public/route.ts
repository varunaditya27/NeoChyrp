import '@/src/lib/bootstrap';
import { ok, failure } from '@/src/lib/api/respond';
import { settingsService } from '@/src/lib/settings/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
  const { title, tagline, theme, description, url } = await settingsService.getSiteSettings();
  return ok({ title, tagline, theme, description, url });
  } catch (e:any) {
    return failure(e.message || 'Error', 500);
  }
}
