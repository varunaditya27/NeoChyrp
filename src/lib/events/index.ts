/**
 * Core Event System for NeoChyrp
 * Enables module extensibility through typed event emission and subscription
 */

export interface Event {
  type: string;
  timestamp: Date;
  payload: unknown;
  metadata?: Record<string, unknown>;
}

export interface EventHandler<T = unknown> {
  (event: Event & { payload: T }): Promise<void> | void;
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
    const event: Event = {
      type,
      timestamp: new Date(),
      payload,
      metadata,
    };

    const eventHandlers = this.handlers.get(type);
    if (!eventHandlers || eventHandlers.size === 0) {
      return;
    }

    // Execute handlers in parallel but catch individual failures
    const promises = Array.from(eventHandlers).map(async (handler) => {
      try {
        await handler(event as Event & { payload: T });
      } catch (error) {
        console.error(`Event handler error for ${type}:`, error);
        // Don't let one handler failure stop others
      }
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

// Event type definitions for type safety
export interface EventTypes {
  // Post lifecycle events
  'post.beforeCreate': { post: unknown };
  'post.afterCreate': { post: unknown };
  'post.beforeUpdate': { post: unknown; changes: unknown };
  'post.afterUpdate': { post: unknown };
  'post.beforeDelete': { postId: string };
  'post.afterDelete': { postId: string };
  'post.beforePublish': { post: unknown };
  'post.afterPublish': { post: unknown };

  // Comment events
  'comment.beforeCreate': { comment: unknown };
  'comment.afterCreate': { comment: unknown };
  'comment.beforeUpdate': { comment: unknown };
  'comment.afterUpdate': { comment: unknown };
  'comment.beforeDelete': { commentId: string };
  'comment.afterDelete': { commentId: string };

  // User events
  'user.afterSignIn': { user: unknown };
  'user.afterSignOut': { userId: string };

  // Cache events
  'cache.invalidate': { keys: string[]; tags?: string[] };
  'cache.clear': { scope?: string };

  // System events
  'request.start': { requestId: string; path: string };
  'request.end': { requestId: string; duration: number };
  'sitemap.rebuild': { force?: boolean };
}

// Typed event emitter functions
export function emitEvent<K extends keyof EventTypes>(
  type: K,
  payload: EventTypes[K],
  metadata?: Record<string, unknown>
): Promise<void> {
  return eventBus.emit(type, payload, metadata);
}

export function onEvent<K extends keyof EventTypes>(
  type: K,
  handler: EventHandler<EventTypes[K]>
): EventSubscription {
  return eventBus.on(type, handler);
}
