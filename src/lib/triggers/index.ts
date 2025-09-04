/**
 * Trigger & Filter System (Legacy Parity Layer)
 * --------------------------------------------
 * Provides Chyrp‑style action (call) and filter (mutation) semantics on top of
 * the modern event bus. Filters run synchronously/serially in priority order.
 * Actions (triggers) broadcast to registered handlers (mirrors eventBus but with priority).
 *
 * API:
 *  addAction(name, handler, priority=10)
 *  doAction(name, ...args)
 *  addFilter(name, handler, priority=10) // handler receives (value, ...args) and returns value (async/ sync)
 *  applyFilters(name, value, ...args) -> Promise<value>
 */

export type ActionHandler = (...args: any[]) => void | Promise<void>;
export type FilterHandler<T=any> = (value: T, ...args: any[]) => T | Promise<T>;

interface Prioritized<T> { priority: number; fn: T }

const actionMap: Record<string, Prioritized<ActionHandler>[]> = Object.create(null);
const filterMap: Record<string, Prioritized<FilterHandler>[]> = Object.create(null);

function insert<T>(arr: Prioritized<T>[], item: Prioritized<T>) {
  arr.push(item);
  arr.sort((a,b) => a.priority - b.priority);
}

export function addAction(name: string, handler: ActionHandler, priority = 10) {
  if (!actionMap[name]) actionMap[name] = [];
  insert(actionMap[name], { priority, fn: handler });
}

export async function doAction(name: string, ...args: any[]): Promise<void> {
  const list = actionMap[name];
  if (!list) return;
  for (const { fn } of list) {
    try { await fn(...args); } catch (e) { console.warn(`[action:${name}] handler failed`, e); }
  }
}

export function addFilter<T=any>(name: string, handler: FilterHandler<T>, priority = 10) {
  if (!filterMap[name]) filterMap[name] = [];
  insert(filterMap[name], { priority, fn: handler as FilterHandler });
}

export async function applyFilters<T=any>(name: string, initial: T, ...args: any[]): Promise<T> {
  const list = filterMap[name];
  let value = initial;
  if (!list) return value;
  for (const { fn } of list) {
    try { value = await fn(value, ...args); } catch (e) { console.warn(`[filter:${name}] handler failed`, e); }
  }
  return value;
}

// Common legacy filter/trigger names mapped for modernization reference
export const LegacyFilters = {
  MARKUP_TEXT: 'markup_text',
  MARKUP_COMMENT_TEXT: 'markup_comment_text',
  EXCERPT: 'excerpt',
  TITLE: 'title',
  RELATED_POSTS: 'related_posts'
} as const;

export const LegacyActions = {
  ADD_POST: 'add_post',
  PUBLISH_POST: 'publish_post',
  UPDATE_POST: 'update_post',
  ADD_COMMENT: 'add_comment'
} as const;
