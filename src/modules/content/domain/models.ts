/**
 * Content Domain Models:
 * - Lightweight TypeScript types mirroring Prisma but adding domain-specific invariants.
 * - Avoid leaking Prisma types across layers; map at boundaries.
 */
// Local domain layer avoids direct coupling to generated Prisma enums to allow
// future refactors (e.g., splitting content service). Keep string union mirrors.
export type FeatherTypeDomain = 'TEXT' | 'PHOTO' | 'QUOTE' | 'LINK' | 'VIDEO' | 'AUDIO' | 'UPLOADER';
export type PostVisibilityDomain = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'PRIVATE' | 'ARCHIVED';

export interface PostEntity {
  id: string;
  slug: string;
  title?: string | null;
  authorId: string;
  body?: string | null; // raw markup
  renderedBody?: string | null; // cached HTML
  excerpt?: string | null;
  feather: FeatherTypeDomain;
  featherData?: unknown; // shape depends on feather type
  visibility: PostVisibilityDomain;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Discriminated union examples for feathers (extend as needed). */
export type FeatherPayload =
  | { type: 'TEXT'; markdown: string }
  | { type: 'PHOTO'; imageUrl: string; alt?: string; caption?: string }
  | { type: 'QUOTE'; quote: string; source?: string; sourceUrl?: string }
  | { type: 'LINK'; url: string; title?: string; description?: string }
  | { type: 'VIDEO'; videoUrl: string; posterUrl?: string }
  | { type: 'AUDIO'; audioUrl: string; title?: string }
  | { type: 'UPLOADER'; files: Array<{ url: string; name: string; size: number }>; description?: string };
