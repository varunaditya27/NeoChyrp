/**
 * Modules Registry
 * ----------------
 * Central registration and initialization of all application modules.
 * Each module provides specific functionality like comments, tags, likes, etc.
 * Uses the module registry system for consistent management.
 */

// Import all module registrations
import './comments';
import './likes';
import './tags';
import './views';
import './categories';
import './cacher';
import './webmentions';
import './read_more';
import './rights';
import './sitemap';
import './cascade';
import './easy_embed';
import './highlighter';
import './lightbox';
import './maptcha';
import './mathjax';
// import './highlighter';
// import './easy_embed';
// import './mathjax';

/**
 * Initialize all registered modules
 */
export async function initializeAllModules(): Promise<void> {
  console.log('Initializing all modules...');

  // The modules will have registered themselves via their imports above
  // The module registry will handle initialization

  console.log('All modules initialized');
}
