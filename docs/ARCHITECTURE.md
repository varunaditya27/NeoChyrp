## NeoChyrp Modern Architecture (Draft)

This document expands on the scaffold, describing how legacy Chyrp concepts map onto a modern modular architecture.

### Core Layers
- **Domain**: Pure business concepts (entities, value objects, invariants, events)
- **Application**: Use case orchestration (commands + queries), event emission
- **Infrastructure**: Persistence (Prisma), external gateways (Supabase, webmention fetcher), caching
- **Interface (UI/API)**: Next.js route handlers, server actions, React components

### Event-Driven Extensions
Feature modules subscribe to core events via `eventBus` (`src/lib/events.ts`). This keeps optional features decoupled (e.g., the Sitemap module only cares about publish/update events).

### Rendering Pipeline (Planned)
1. Persist raw `body` (markdown / raw) + `featherData`
2. Transform (markdown -> HTML) with sanitization (DOMPurify or OWASP sanitizer) + plugin steps:
   - Highlighter (code blocks)
   - MathJax (math spans)
   - Easy Embed (external provider expansion)
3. Store result in `renderedBody` for faster listing + caching
4. Read More module extracts excerpt (or uses explicit marker)

### Theming Strategy (Future)
CSS variables + Tailwind theme extensions. Later: theme packs with metadata JSON and dynamic loading.

### Deployment Targets
- Primary: Vercel / Netlify (Edge-friendly) + Supabase DB
- Alternative: Docker container (Node runtime) + managed Postgres

### Security / Hardening TODO
- Rate limiting (API + comment submission)
- AuthZ policies (role-based + per-resource ownership)
- Input sanitization for user-generated HTML segments
- CSP headers + security headers middleware

### Performance Considerations
- Layered caching: in-memory fragment + future Redis/edge KV
- Incremental static regeneration for public post pages
- Pre-warming sitemap after deployment

### Roadmap Snapshot
- [ ] Auth integration
- [ ] Markdown pipeline
- [ ] Comments CRUD & moderation
- [ ] Likes + debounced views tracking
- [ ] Sitemap generation & robots.txt
- [ ] Webmention inbox/verification
- [ ] Theme switching
- [ ] Plugin manifest loader
