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

	async emit<T>(type: string, payload: T, metadata?: Record<string, unknown>): Promise<void> {
		const _event: InternalEvent<T> = { type, timestamp: new Date(), payload, metadata };
		const eventHandlers = this.handlers.get(type);
		if (!eventHandlers || eventHandlers.size === 0) return;
		const promises = Array.from(eventHandlers).map(async (handler) => {
			try { await handler(_event.payload); } catch (error) { console.error(`Event handler error for ${type}:`, error); }
		});
		await Promise.allSettled(promises);
	}

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

	clear(type?: string): void {
		if (type) {
			this.handlers.delete(type);
		} else {
			this.handlers.clear();
		}
	}

	getActiveTypes(): string[] {
		return Array.from(this.handlers.keys()).filter(type =>
			this.handlers.get(type)!.size > 0
		);
	}

}

export const eventBus = new EventBusImpl();

export const CoreEvents = {
	PostPublished: 'content.post.published',
	PostCreated: 'content.post.created',
	PostUpdated: 'content.post.updated',
	PostDeleted: 'content.post.deleted',
	PostUnpublished: 'content.post.unpublished',
	PostRightsUpdated: 'rights.post.updated',
	LikeAdded: 'likes.like.added',
	LikeRemoved: 'likes.like.removed',
	CommentCreated: 'comments.comment.created',
	CommentModerated: 'comments.comment.moderated',
	CommentDeleted: 'comments.comment.deleted',
	TagCreated: 'tags.tag.created',
	CategoryCreated: 'categories.category.created',
	CategoryUpdated: 'categories.category.updated',
	CategoryDeleted: 'categories.category.deleted',
	ViewRegistered: 'views.post.viewed',
	WebMentionReceived: 'webmentions.received',
	SitemapRegenerationRequested: 'sitemap.regenerate.requested',
	SiteUpdated: 'site.updated',
	CacheInvalidate: 'cache.invalidate',
	CacheClear: 'cache.clear',
	SettingsUpdated: 'settings.updated'
} as const;

export type DomainEventName = typeof CoreEvents[keyof typeof CoreEvents] | string;

