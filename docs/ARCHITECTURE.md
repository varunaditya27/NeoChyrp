# NeoChyrp Modern Architecture

This document outlines how NeoChyrp maps legacy Chyrp concepts onto a modern, modular architecture and summarizes the parts already implemented.

## Core Layers

- **Domain**: Pure business concepts (entities, value objects, invariants, events)
- **Application**: Use case orchestration (commands + queries), event emission
- **Infrastructure**: Persistence (Prisma), external gateways (Supabase, webmention fetcher), caching
- **Interface (UI/API)**: Next.js route handlers, server actions, React components

## Feathers (Post Types)

- Feathers are self-contained post-type packages that register themselves via `src/lib/feathers/registry`.
- Each feather exports:
   - `schema`: Zod schema validating `featherData`
   - `fields`: Admin UI field metadata (type, label, options, accept, required)
   - `render(payload)`: Server-side renderer that returns safe HTML
   - `excerpt(payload)`: Short summary for listings
- Implemented feathers: text, photo, quote, link, video, audio, and uploader (multi-file/gallery).

## Event-Driven Extensions

Feature modules subscribe to core events via `eventBus` (`src/lib/events.ts`). This keeps optional features decoupled (e.g., the Sitemap module only cares about publish/update events).

## Rendering Pipeline (Current and Planned)

Current:

1. Persist raw `body` (Markdown/HTML) and `featherData` validated by the feather schema.
2. Feather renderers compose the final HTML for the public views.
3. Asset references inside feathers resolve to public URLs (see Assets and Media).

Planned enhancements:

1. Markdown transformation and sanitization pipeline (DOMPurify or OWASP sanitizer)
2. Plugin steps (Highlighter, MathJax, Easy Embed)
3. Store `renderedBody` for faster listing + caching
4. Read More module extracts excerpt (or uses explicit marker)

## Theming Strategy (Future)

CSS variables + Tailwind theme extensions. Later: theme packs with metadata JSON and dynamic loading.

## Deployment Targets

- Primary: Vercel / Netlify (Edge-friendly) + Supabase DB
- Alternative: Docker container (Node runtime) + managed Postgres

## Assets and Media

- Storage: Supabase Storage (public bucket)
- Uploads: Admin UI posts files to `POST /api/assets/upload`
- Public delivery: `/api/assets/:id` resolves asset IDs to public URLs with no auth required
- Feathers resolve non-URL asset IDs to `/api/assets/:id` (Photo, Audio, Video, Uploader) to avoid 403s
- Validation: Client-side checks enforce MIME/extension via `accept` and a max upload size from `.env`

## Security / Hardening TODO

- Rate limiting (API + comment submission)
- AuthZ policies (role-based + per-resource ownership)
- Input sanitization for user-generated HTML segments
- CSP headers + security headers middleware

### UX Notes

- Public Tags page supports fuzzy search with match highlighting
- Admin “Write” uses dynamic feather fields and validates uploads (type/size) with clear errors

## Performance Considerations

- Layered caching: in-memory fragment + future Redis/edge KV
- Incremental static regeneration for public post pages
- Pre-warming sitemap after deployment

## Roadmap Snapshot

- [ ] Auth integration
- [ ] Markdown pipeline (+ sanitization)
- [ ] Comments CRUD & moderation
- [ ] Likes + debounced views tracking
- [ ] Sitemap generation & robots.txt
- [ ] Webmention inbox/verification
- [ ] Theme switching
- [ ] Plugin manifest loader
- [ ] Module enable/disable registry
