/**
 * Simple Event Bus Placeholder
 * ---------------------------------
 * Goals:
 * - Decouple feature modules (comments, likes, cache invalidation, sitemap, etc.).
 * - Provide a minimal publish/subscribe API that can later be replaced by a more
 *   robust implementation (e.g., Redis pub/sub, Postgres LISTEN/NOTIFY, custom queue).
 * - Keep synchronous for now; listeners run sequentially (ordered registration).
 *
 * Usage Pattern:
 * const unsubscribe = eventBus.subscribe('content.post.published', (payload) => {...});
 * eventBus.publish('content.post.published', { postId });
 * unsubscribe();
 *
 * NOTE: This is intentionally simple; production build might require:
 * - Error isolation (try/catch per listener + logging)
 * - Async concurrency control
 * - Tracing / performance metrics
 * - Persistent or distributed delivery semantics
 */
export type EventName = string;
export type EventPayload = Record<string, unknown> | undefined;
export type EventListener<T = EventPayload> = (payload: T) => void | Promise<void>;

class InMemoryEventBus {
  private listeners: Map<EventName, Set<EventListener>> = new Map();

  subscribe<T = EventPayload>(event: EventName, fn: EventListener<T>) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn as EventListener);
    return () => this.listeners.get(event)?.delete(fn as EventListener);
  }

  async publish<T = EventPayload>(event: EventName, payload: T) {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return;
    for (const listener of set) {
      try {
        await listener(payload as EventPayload);
      } catch (err) {
        // TODO: integrate logger/telemetry
        console.error('[eventBus] listener error', { event, err });
      }
    }
  }
}

export const eventBus = new InMemoryEventBus();

/** Central list of core domain event names to avoid typos. */
export const CoreEvents = {
  PostPublished: 'content.post.published',
  PostUpdated: 'content.post.updated',
  PostDeleted: 'content.post.deleted',
  CommentCreated: 'comments.comment.created',
  CommentModerated: 'comments.comment.moderated',
  LikeAdded: 'likes.like.added',
  LikeRemoved: 'likes.like.removed',
  ViewRegistered: 'views.post.viewed',
  WebMentionReceived: 'webmentions.received',
  SitemapRegenerationRequested: 'sitemap.regenerate.requested'
} as const;

export type CoreEventKey = keyof typeof CoreEvents;
