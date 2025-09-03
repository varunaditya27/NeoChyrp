/**
 * NeoChyrp Event Bus (Single Implementation)
 * -----------------------------------------
 * Unified, minimal event workflow for all modules and core features.
 * Public API surface (and the ONLY one to use):
 *   eventBus.on(eventName, handler)
 *   eventBus.emit(eventName, payload, metadata?)
 *   eventBus.clear(eventName?)
 * Event names live in CoreEvents to avoid typos. No alternate helpers, no aliases.
 */

// Internal event envelope (not exposed to handlers directly)
interface InternalEvent<T> {
  type: string;
  timestamp: Date;
  payload: T;
  metadata?: Record<string, unknown>;
}

export interface EventHandler<T = unknown> {
  (payload: T): Promise<void> | void;
}

export interface EventSubscription {
  unsubscribe(): void;
}

class EventBusImpl {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  /**
   * Emit an event to all registered handlers
   */
  async emit<T>(type: string, payload: T, metadata?: Record<string, unknown>): Promise<void> {
    const _event: InternalEvent<T> = { type, timestamp: new Date(), payload, metadata };
    const eventHandlers = this.handlers.get(type);
    if (!eventHandlers || eventHandlers.size === 0) return;
    const promises = Array.from(eventHandlers).map(async (handler) => {
      try { await handler(_event.payload); } catch (error) { console.error(`Event handler error for ${type}:`, error); }
    });
    await Promise.allSettled(promises);
  }

  /**
   * Subscribe to events of a specific type
   */
  on<T>(type: string, handler: EventHandler<T>): EventSubscription {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }

    this.handlers.get(type)!.add(handler as EventHandler);

    return {
      unsubscribe: () => {
        this.handlers.get(type)?.delete(handler as EventHandler);
      },
    };
  }

  /**
   * Remove all handlers for a type or all handlers
   */
  clear(type?: string): void {
    if (type) {
      this.handlers.delete(type);
    } else {
      this.handlers.clear();
    }
  }

  /**
   * Get list of event types with active handlers
   */
  getActiveTypes(): string[] {
    return Array.from(this.handlers.keys()).filter(type =>
      this.handlers.get(type)!.size > 0
    );
  }

}

// Global event bus instance
export const eventBus = new EventBusImpl();

// Canonical domain event names (single source of truth)
export const CoreEvents = {
  PostPublished: 'content.post.published',
  PostUpdated: 'content.post.updated',
  PostDeleted: 'content.post.deleted',
  PostUnpublished: 'content.post.unpublished',
  LikeAdded: 'likes.like.added',
  LikeRemoved: 'likes.like.removed',
  CommentCreated: 'comments.comment.created',
  CommentModerated: 'comments.comment.moderated',
  CommentDeleted: 'comments.comment.deleted',
  TagCreated: 'tags.tag.created',
  ViewRegistered: 'views.post.viewed',
  WebMentionReceived: 'webmentions.received',
  SitemapRegenerationRequested: 'sitemap.regenerate.requested',
  CacheInvalidate: 'cache.invalidate',
  CacheClear: 'cache.clear',
  SettingsUpdated: 'settings.updated'
} as const;

// Event type definitions for type safety
// (Optional) type mapping for future stricter typing without extra helpers
export type DomainEventName = typeof CoreEvents[keyof typeof CoreEvents] | string;
