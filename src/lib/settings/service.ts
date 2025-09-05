/**
 * Settingconst defaults: Record<string, JsonValue> = {
  'site:title': 'NeoChyrp',
  'site:tagline': 'Just another NeoChyrp site',
  'site:theme': 'light',
  'site:postsPerPage': 10,
  'site:defaultVisibility': 'PUBLISHED',
  'site:description': 'A modern, extensible blogging platform built with Next.js',
  'site:url': 'http://localhost:3000',
  'site:contact': ''
};ce
 * ----------------
 * Provides typed access to site/application settings with simple in-memory caching.
 * Persists to Prisma Setting model.
 */
import { prisma } from '@/src/lib/db';
import { eventBus, CoreEvents } from '@/src/lib/events/index';

type JsonValue = any;

interface CacheEntry { value: JsonValue; ts: number }
const cache = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

const DEFAULTS: Record<string, JsonValue> = {
  'site:title': 'NeoChyrp',
  'site:tagline': 'Just another NeoChyrp site',
  'site:theme': 'light',
  'site:postsPerPage': 10,
  'site:defaultVisibility': 'PUBLISHED'
};

async function load(key: string): Promise<JsonValue | undefined> {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.ts) < TTL_MS) return cached.value;
  const row = await prisma.setting.findUnique({ where: { key } });
  const value = row?.value ?? DEFAULTS[key];
  cache.set(key, { value, ts: Date.now() });
  return value;
}

async function save(key: string, value: JsonValue): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
  cache.set(key, { value, ts: Date.now() });
  await eventBus.emit(CoreEvents.SettingsUpdated, { key, value });
}

async function multiLoad(keys: string[]): Promise<Record<string, JsonValue>> {
  const result: Record<string, JsonValue> = {};
  for (const k of keys) result[k] = await load(k);
  return result;
}

export const settingsService = {
  get: load,
  set: save,
  getSiteSettings: async () => {
    const keys = ['site:title','site:tagline','site:theme','site:postsPerPage','site:defaultVisibility','site:description','site:url','site:contact'] as const;
    const loaded = await multiLoad(keys as unknown as string[]);
    return {
      title: loaded['site:title'] as string,
      tagline: loaded['site:tagline'] as string,
      theme: loaded['site:theme'] as string,
      postsPerPage: loaded['site:postsPerPage'] as number,
      defaultVisibility: loaded['site:defaultVisibility'] as string,
      description: loaded['site:description'] as string,
      url: loaded['site:url'] as string,
      contact: loaded['site:contact'] as string
    };
  },
  updateSiteSettings: async (input: { title?: string; tagline?: string; theme?: string; postsPerPage?: number; defaultVisibility?: string; description?: string; url?: string; contact?: string }) => {
    const changes: Record<string, JsonValue> = {};
    if (input.title !== undefined) { await save('site:title', input.title); changes.title = input.title; }
    if (input.tagline !== undefined) { await save('site:tagline', input.tagline); changes.tagline = input.tagline; }
    if (input.theme !== undefined) { await save('site:theme', input.theme); changes.theme = input.theme; }
    if (input.postsPerPage !== undefined) { await save('site:postsPerPage', input.postsPerPage); changes.postsPerPage = input.postsPerPage; }
    if (input.defaultVisibility !== undefined) { await save('site:defaultVisibility', input.defaultVisibility); changes.defaultVisibility = input.defaultVisibility; }
    if (input.description !== undefined) { await save('site:description', input.description); changes.description = input.description; }
    if (input.url !== undefined) { await save('site:url', input.url); changes.url = input.url; }
    if (input.contact !== undefined) { await save('site:contact', input.contact); changes.contact = input.contact; }
    if (Object.keys(changes).length) await eventBus.emit(CoreEvents.SettingsUpdated, { changes });
    return settingsService.getSiteSettings();
  },
  clearCache: () => cache.clear()
};

export type SiteSettings = Awaited<ReturnType<typeof settingsService.getSiteSettings>>;
