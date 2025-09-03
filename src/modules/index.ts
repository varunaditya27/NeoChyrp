/**
 * Central Module Registrar
 * Import every implemented module exactly once for side‑effect registration.
 * Keep this list explicit & alphabetized for clarity and to avoid accidental duplicates.
 */
import './cacher';
import './cascade';
import './categories';
import './comments';
import './easy_embed';
import './highlighter';
import './lightbox';
import './likes';
import './maptcha';
import './mathjax';
import './post_views';
import './read_more';
import './rights';
import './sitemap';
import './tags';
import './views';
import './webmentions';

/**
 * Initialize all registered modules
 */
export async function initializeAllModules(): Promise<void> { /* No-op: modules self-register */ }
