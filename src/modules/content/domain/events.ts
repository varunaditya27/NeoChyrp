/**
 * Domain events for content lifecycle.
 * - Emitted by application layer after successful state changes.
 * - Event bus adapter will forward to modules (webmentions, cache invalidation, etc.).
 */
export interface DomainEvent<T = unknown> {
  type: string;
  payload: T;
  occurredAt: Date;
}

export interface PostPublishedPayload { postId: string; slug: string; publishedAt: string; }
export interface PostUpdatedPayload { postId: string; slug: string; }
export interface PostDeletedPayload { postId: string; slug: string; }

export const EventTypes = {
  PostPublished: 'content.post.published',
  PostUpdated: 'content.post.updated',
  PostDeleted: 'content.post.deleted'
} as const;
