/**
 * Modules Registry Placeholder
 * ----------------------------
 * Purpose:
 * - Provide a single place to register/initialize optional modules.
 * - Each module returns a lightweight descriptor with hooks it wants to connect
 *   (event subscriptions, scheduled jobs, route registrations, etc.).
 * - Later this can be evolved into a plug-in loader (dynamic import with manifest).
 */
import { registerCommentsModule } from './comments';
import { registerLikesModule } from './likes';
import { registerViewsModule } from './views';
import { registerTagsModule } from './tags';
import { registerCategoriesModule } from './categories';
import { registerCacherModule } from './cacher';
import { registerWebMentionsModule } from './webmentions';
import { registerReadMoreModule } from './read_more';
import { registerRightsModule } from './rights';
import { registerCascadeModule } from './cascade';
import { registerLightboxModule } from './lightbox';
import { registerSitemapModule } from './sitemap';
import { registerMaptchaModule } from './maptcha';
import { registerHighlighterModule } from './highlighter';
import { registerEasyEmbedModule } from './easy_embed';
import { registerMathJaxModule } from './mathjax';

export interface ModuleDescriptor {
  name: string;
  version?: string;
  enabled: boolean;
  init?: () => Promise<void> | void; // For any warmup
  dispose?: () => Promise<void> | void;
}

export async function registerAllModules(): Promise<ModuleDescriptor[]> {
  const modules: ModuleDescriptor[] = [
    registerCommentsModule(),
    registerLikesModule(),
    registerViewsModule(),
    registerTagsModule(),
    registerCategoriesModule(),
    registerCacherModule(),
    registerWebMentionsModule(),
    registerReadMoreModule(),
    registerRightsModule(),
    registerCascadeModule(),
    registerLightboxModule(),
    registerSitemapModule(),
    registerMaptchaModule(),
    registerHighlighterModule(),
    registerEasyEmbedModule(),
    registerMathJaxModule()
  ];

  for (const mod of modules) {
    if (mod.enabled && mod.init) await mod.init();
  }
  return modules;
}
