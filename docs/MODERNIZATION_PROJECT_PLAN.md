## NeoChyrp Modernization Project Plan

> Rebuilding legacy "Chyrp Lite" (PHP) into a modern, extensible, cloud‑ready blogging & micro‑publishing platform using Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres + Auth + Storage) + Prisma.

---

### 1. Executive Summary

Modernize Chyrp by re‑implementing its core philosophy (lightweight, extensible, content‑type driven) as a service‑oriented, API‑first application. Preserve “Feathers” (content types) and “Modules” (extensions) via a well‑typed plugin/event system. Deliver a deployable, documented, testable platform with strong DX, accessibility, performance, and security. Phase delivery to ensure an early usable MVP then iterative enhancement.

---

### 2. Objectives & Success Criteria

| Goal | Success Metric | Source / Mapping |
|------|----------------|------------------|
| Startability | `git clone` + `pnpm install` + `pnpm dev` < 5 min; 1‑page quick start | Judging: Startability |
| Core Functionality | 100% of required Feathers + priority Modules implemented | Problem Statement |
| Stability | < 1 critical error in 30 min exploratory test; CI green | Judging: Stability |
| Idiomatic Code | All code passes ESLint + type checks; architecture docs match implementation | Judging: Framework Idioms |
| Documentation | Complete README + Feature Docs + API Reference + Migration Guide | Judging: Docs |
| Performance | P95 page TTFB < 300ms (edge cached) for public pages; Largest Contentful Paint < 2.0s (desktop) | Non‑functional target |
| Accessibility | Lighthouse a11y score ≥ 95 on main flows | Modern baseline |
| Security | No high severity OWASP Top 10 class issues in audit checklist | Risk mitigation |
| Innovation (Bonus) | ≥ 2 additional value features (e.g., realtime presence, AI assisted writing) | Bonus Criteria |

---

### 3. Scope Overview

In Scope (Phased): Core CRUD for posts & users; Feathers (Text, Photo, Quote, Link, Video, Audio, Uploader); Essential Modules (Tags, Categories, Comments, Likes, Read More, Rights, Sitemap, Cacher, Lightbox, Highlighter, Easy Embed, Post Views, MathJax, Cascade (infinite scroll), Maptcha (spam defense)). These map 1:1 to legacy Chyrp Lite capabilities to preserve functional parity.

Deferred (Stretch): Webmentions (Mentionable), Multi‑tenant workspaces, GraphQL gateway, AI content assistant, Theme marketplace, Meilisearch integration.

Out of Scope (Hackathon timeframe): Enterprise SSO, Complex billing, Extremely granular workflow states.

---

### 4. Architectural Overview

| Layer | Technology | Responsibilities |
|-------|------------|------------------|
| UI / Pages | Next.js App Router | Public site, admin dashboard, theming boundaries |
| API (Route Handlers) | Next.js API routes (`app/api/...`) | REST/JSON endpoints consumed by UI & external clients |
| Data Access | Prisma ORM | Type‑safe DB queries, migrations |
| AuthN/AuthZ | Supabase Auth + RBAC middleware | Sessions, JWT, role enforcement, policy guards |
| Storage | Supabase Storage (media), Postgres (core data) | Content and media assets |
| Caching | Edge ISR + Redis (optional) / Supabase caching; HTTP caching headers | Page & query acceleration |
| Background Jobs | Serverless cron / Edge functions (Supabase functions or Vercel cron) | Sitemap refresh, view aggregation, cache invalidation |
| Plugin Runtime | Event bus + dynamic import + metadata registry | Feathers + Modules execution |
| Observability | OpenTelemetry + structured logs (pino) + Sentry (optional) | Monitoring & error tracking |

Deployment Target: Vercel (front + API) + Supabase (DB/Auth/Storage/Edge Functions).

---

### 5. Domain Model (Conceptual)

Entities: User, Session (implicit), Role, Permission, Post (polymorphic: Post + Feather subtype), Category, Tag, PostTag (join), Comment, Like, MediaAsset, PostView (aggregated), Setting (key/value), Extension (installed module), Theme, MigrationVersion, AuditLog.

Polymorphism Strategy: Single `Post` table with `type` enum (TEXT|PHOTO|QUOTE|LINK|VIDEO|AUDIO|UPLOADER) + type‑specific JSON `payload` column (validated via Zod schemas) keeping base columns (id, userId, slug, title, body, createdAt, updatedAt, status, visibility, excerpt, metadata JSONB). This reflects legacy "Feathers" while modernizing storage.

---

### 6. Data Model (Initial Prisma Tables)

High‑level (not full schema):

```text
User(id, email, username, displayName, bio, avatarUrl, role, createdAt)
Post(id, userId, type, title, slug, body, payload JSONB, status, visibility, excerpt, metadata JSONB, publishedAt, createdAt, updatedAt)
Category(id, name, slug, description)
PostCategory(postId, categoryId)
Tag(id, name, slug)
PostTag(postId, tagId)
Comment(id, postId, userId (nullable for guest), parentId, content, status, createdAt)
Like(userId, postId, createdAt)
MediaAsset(id, ownerId, path, mimeType, width, height, size, checksum, createdAt)
PostView(postId, date, views) // aggregated daily
Setting(key, value JSONB)
Extension(id, slug, type MODULE|FEATHER, version, enabled, config JSONB)
Theme(id, name, version, active, config JSONB)
AuditLog(id, actorId, action, entityType, entityId, data JSONB, createdAt)
```

Indexes: slugs unique; full‑text GIN index on Post(title, body, payload->>'text') for search (phase 2). Partial indexes for published posts. Foreign keys with cascade delete for dependent joins.

Legacy Feature Parity Notes:

- Rights / licensing: represented via future License metadata (can extend `Post` metadata or add `License` table as in current Prisma schema).
- Uploader multi-file: handled via `MediaAsset` + join (or embedded order) similar to legacy Uploader Feather.
- Read More: excerpt logic stored/cached in `excerpt` & optionally generated server-side matching legacy truncation.
- Cacher: legacy page caching maps to renderedBody + external layer (edge/Redis) invalidated via events.
- Sitemap: data sourced from `Post` publication metadata; incremental rebuild job retains legacy function.
- Post Views: daily aggregation in `PostView` mirrors legacy simple counter with improved batching.

---

### 7. API Strategy

Approach: REST first (predictable, simple); potential GraphQL layer (stretch). Consistent resource naming: `/api/posts`, `/api/posts/{id}`, `/api/comments`, `/api/tags`.

Response Envelope: `{ data, meta?, error? }`. Errors standardized with problem codes.

Filtering & Pagination: Cursor pagination (`?cursor=<id>&limit=20`) for infinite scroll (Cascade module). Sorting defaults by `publishedAt DESC`.

Auth: Supabase session tokens validated via middleware; role check utility `requireRole(['ADMIN','AUTHOR'])`.

Rate Limiting: Lightweight in‑memory (development) then KV/Upstash (production) for anonymous endpoints (comments, likes).

Versioning: Start with unversioned; add `Accept: application/vnd.neochyrp.v1+json` header pattern if needed later.

Legacy Mapping: Replaces PHP front controller responses with structured JSON endpoints; ensures every legacy interactive feature (posting, commenting, liking, tagging, categorizing) has a REST counterpart accessible to future alternative clients.

---

### 8. Content Type (Feather) Implementation

Mechanism: Each Feather exports a manifest & Zod schema.

```ts
// Example manifest
export const feather = {
  slug: 'photo',
  version: '1.0.0',
  schema: PhotoPayloadSchema, // Zod
  fields: [ { name:'image', type:'media', required:true }, ... ],
  render: async (payload, ctx) => <PhotoComponent {...payload} />,
  excerpt: (payload) => payload.caption?.slice(0,140)
}
```

Registry loads enabled Feathers on boot (compile‑time or dynamic import). Admin UI introspects `fields` to build creation forms automatically (schema‑driven forms). Validation done on both client and server.

Legacy Parity: Each legacy Feather (text/photo/quote/link/video/audio/uploader) has a manifest ensuring identical user-facing intent (fields & rendering) while allowing richer validation and extensibility.

---

### 9. Module (Extension) System Design

Event Bus: Core emits lifecycle events (e.g., `post.beforeCreate`, `post.afterPublish`, `comment.afterCreate`, `request.log`, `sitemap.rebuild`). Modules register handlers.

Module Packaging: `/src/modules/<slug>/index.ts` exporting `activate(ctx)`, `deactivate()`, metadata. Configuration persisted in `Extension` table.

Sandboxing: Modules only access whitelisted `ctx` (services: db, cache, logger, storage, settings, events). No direct file system writes—ensures portability.

Execution Order: Priority integer; stable sort. Failures isolated; logged to AuditLog.

Cache Invalidation Hooks: Modules can tag cache entries; on relevant events system invalidates tagged entries.

Legacy Parity: Mirrors legacy module trigger system (PHP callbacks) through typed events; all legacy modules listed in Scope have equivalent modern modules with event subscriptions instead of ad-hoc globals.

---

### 10. Theming Strategy

Themes as NPM‑like packages under `/src/themes/<name>` each exporting:

```ts
theme = { name, version, templates: { post, list, page, notFound }, assetsDir }
```

Route Layout Composition: Next.js layouts wrap core content; dynamic theme selection resolved at request (ISR per theme). CSS customization via Tailwind + theme tokens (CSS variables) injected in `:root`.

Pluggable Template Parts: Provide slots (header, footer, sidebar) via React context & `composeSlots` helper.

Legacy Parity: Themes retain ability to override layout & partials (Twig -> React components) while adding typed props and ISR friendliness.

---

### 11. Authorization & Roles

Roles: ADMIN, AUTHOR, CONTRIBUTOR, MODERATOR, READER.

| Role | Capabilities (examples) |
|------|-------------------------|
| ADMIN | manage users, settings, extensions, themes |
| AUTHOR | create/publish own posts, upload media |
| CONTRIBUTOR | draft posts (needs approval) |
| MODERATOR | moderate comments, manage tags/categories |
| READER | like, comment (if permitted) |

Policy Layer: Utility functions `can(user, action, resource)` with static matrix + extension hook for dynamic policies.

Legacy Parity: Replicates legacy rights model (user levels & permissions) with explicit role + permission mapping and future extension hooks.

---

### 12. Internationalization (i18n)

Use `next-intl` or built‑in Next.js i18n routing. Store translation catalogs per locale. Content user‑generated stays in original language; UI strings localized. Fallback locale `en`. Admin: dynamic key extraction script.

---

### 13. Accessibility & SEO

Standards: WCAG 2.1 AA. Use semantic HTML, skip links, ARIA landmarks. Keyboard navigation tests.
SEO: Structured data (JSON‑LD) for posts, OpenGraph & Twitter meta tags, Sitemap module auto regenerates, canonical URLs enforced via middleware.

---

### 14. Performance & Caching

Strategies:

- ISR (Incremental Static Regeneration) for public post pages, list pages with revalidate triggers on publish/update.
- Edge caching (Vercel) for GET routes with appropriate `Cache-Control` & SWR.
- Application Cache: In‑memory LRU (dev) -> Redis/Upstash (prod) keyed by resource and tag.
- Post View Counting: Write‑through buffered (increment in Redis; batch flush job every minute).
- Asset Optimization: Image resizing via Next Image + Supabase Storage origin.

---

### 15. Media Storage & Processing

Direct uploads (client -> Supabase signed URL). Store metadata in `MediaAsset`. Post‑upload processing: dimension extraction, optional transcoding (video/audio – stretch). Lightbox module consumes processed variants.

Legacy Parity: Preserves ability to upload single or multiple files (Uploader Feather) & display via Lightbox while adding secure storage and optional processing.

---

### 16. Search (Phase 2)

Initial: Postgres full‑text (tsvector). Optional enhancement: Meilisearch integration for fuzzy search + relevance boosting.

---

### 17. Security Model

Checklist:

- Input validation (Zod schemas server‑side)
- Output escaping (React auto + explicit sanitization for Markdown via `rehype-sanitize`)
- CSRF: Use same‑site cookies; stateful mutations via POST only; optionally CSRF token for admin forms.
- AuthZ guard on all mutations.
- Rate limiting on comments, likes, auth endpoints.
- Markdown / embed sanitization to prevent XSS.
- Content Security Policy headers.
- Secure media URLs (signed) for private assets (if introduced).
- Audit logging of admin actions.

Legacy Improvements: Strengthens legacy baseline (which relied on server config + PHP filtering) by enforcing schema validation, CSP, rate limiting, and structured audit logs.

---

### 18. Developer Experience

Tooling: ESLint + Prettier + TypeScript strict mode + Husky pre‑commit hooks (lint & typecheck). Absolute imports via `@/` alias.
Storybook (optional) for UI primitives. Path based module boundaries (`/src/core`, `/src/modules`, `/src/feathers`).

---

### 19. Testing Strategy

Levels:

- Unit: Zod schemas, utility functions, RBAC policies.
- Integration: API route handlers with in‑memory / test Postgres (Supabase test project or Docker).
- E2E: Playwright for critical flows (create post, comment, like, sitemap presence).
- Accessibility snapshots: axe-core integration in Playwright.

Coverage Targets: ≥ 70% statements core; critical paths (auth, publish, comment) 100% branch.

---

### 20. Migration Strategy (Legacy → Modern)

Legacy Chyrp DB (MySQL) mapping script:

1. Extract tables: users, posts (with feather types), categories, tags, taggings, comments.
2. Transform: unify to Post with `type`; convert markup to Markdown where possible; slug collision resolution (append numeric suffix).
3. Load: Use Prisma script `scripts/migrate_legacy.ts` reading a dumped SQL or direct connection.
4. Media: Copy uploads into Supabase Storage maintaining relative path; produce `MediaAsset` entries.
5. Verification: Row counts, random spot checks, checksum of media sizes.

Rollback Plan: Keep original dump; idempotent import (upsert by legacy id stored in metadata).

Feature Fidelity Validation: Migration script includes verification that counts by Feather type, tag assignments, category membership, comment threading depth, and view counts match legacy (within expected normalization adjustments). Slug collisions resolved deterministically with suffixing while preserving original canonical slug in metadata for redirects.

---

### 21. Deployment & DevOps

Environments: `dev` (local), `preview` (PR builds), `prod` (main). Each with distinct Supabase project or isolated schema.
CI (GitHub Actions):

- Install deps, lint, typecheck
- Run Prisma migrate diff
- Run tests (unit + integration)
- Build
- Upload coverage + Lighthouse CI (optional)
CD: Vercel auto deployments on push; production promotion on main branch tests green.
Cron Jobs: Vercel / Supabase Edge: sitemap refresh nightly, post view flush every minute.

---

### 22. Observability

Logging: Structured JSON (pino) with request correlation id.
Metrics: Basic counters (postsCreated, commentsCreated, cacheHitRate) via lightweight in‑memory -> push to endpoint (stretch: Prometheus exporter or Axiom).
Error Tracking: Sentry initialization around route handlers.
Tracing: OpenTelemetry instrumentation (optional if time allows).

---

### 23. Timeline & Milestones (Indicative)

| Week | Milestone | Key Deliverables |
|------|-----------|------------------|
| 1 | Foundations | Prisma schema v1, Auth integration, Base layout, Text Feather, Post CRUD, RBAC skeleton |
| 2 | Core Feathers & Modules | Remaining Feathers, Tags, Categories, Comments, Likes, Read More, Highlighter |
| 3 | Extensibility & Theming | Module system events, Theme abstraction, Sitemap, Cacher, Lightbox, Post Views |
| 4 | Polish & Performance | Infinite scroll (Cascade), MathJax, Maptcha, SEO/meta, Accessibility passes, Testing coverage |
| 5 | Migration & Docs | Legacy import script, Admin improvements, Final docs, Deployment hardening |
| 6 (Stretch) | Innovation | AI assist, Realtime presence, Advanced search |

Critical Path: Auth → Post model → Feathers registry → Module events → Theming → Comments → Caching → Migration.

Legacy Parity Gate: Completion of Week 3 marks full replacement coverage of all legacy core Feathers + priority Modules enabling a switchover trial.

---

### 24. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Scope creep | Delay core delivery | Medium | Freeze MVP list end of Week 1 |
| Plugin complexity | Unstable runtime | Medium | Minimal event surface first; expand after tests |
| Migration inconsistencies | Data loss/confusion | Low | Idempotent scripts + checksum validation |
| Performance regressions | Poor UX | Medium | Add profiling + cache instrumentation early |
| Auth edge cases | Security flaws | Low | Rigorously test RBAC & session expiry |

---

### 25. Innovation (Bonus) Ideas

- AI content assistant (title & excerpt suggestions using local or hosted model API).
- Realtime collaborative editing (Supabase realtime) for drafts.
- Reader personalization: follow tags & personalized feed ranking.
- Webhooks for external automations.

---

### 26. Documentation Plan

Artifacts:

- README (root) – quick start, architecture diagram.
- `/docs/ARCHITECTURE.md` (already) – keep updated with changes.
- `/docs/API_REFERENCE.md` – generated from route metadata.
- `/docs/EXTENSION_GUIDE.md` – how to build a Module / Feather.
- `/docs/MIGRATION_GUIDE.md` – legacy import instructions.
- `/docs/SECURITY.md` – threat model & mitigations.

---

### 27. Definition of Done (Feature Level)

1. Code implemented with tests (unit + integration if applicable)
2. Types complete (no `any` leakage)
3. Docs updated (README section or dedicated doc)
4. Lint & typecheck pass
5. Accessibility check pass (for UI components)
6. Performance budget unchanged or improved
7. Security review of inputs/outputs

---

### 28. Implementation Backlog (Initial Detailed Tasks)

Foundations:

- [ ] Finalize Prisma schema & run initial migration
- [ ] Supabase auth wiring & session context provider
- [ ] RBAC utility + role constants
- [ ] Post CRUD API + Text Feather (legacy Text)
- [ ] Generic list + detail page with ISR
- [ ] Markdown rendering pipeline (remark/rehype sanitize)

Feathers & Media:

- [ ] Photo Feather (legacy Photo)
- [ ] Quote Feather (legacy Quote)
- [ ] Link Feather (legacy Link) + oEmbed integration (Easy Embed)
- [ ] Video Feather (legacy Video; transcoding deferred)
- [ ] Audio Feather (legacy Audio)
- [ ] Uploader Feather (legacy Uploader multi-file)

Modules (Phase 2 ordering):

- [ ] Tags + Tag API (legacy Tags)
- [ ] Categories (legacy Categorize)
- [ ] Comments (threaded, moderation status) (legacy Comments)
- [ ] Likes (idempotent per user) (legacy Likes)
- [ ] Read More (excerpt logic + UI) (legacy Read More)
- [ ] Rights (license metadata + display) (legacy Rights)
- [ ] Highlighter (Prism or Highlight.js) (legacy Highlighter)
- [ ] Easy Embed (oEmbed provider fetch + whitelist) (legacy Easy Embed)
- [ ] Post Views (increment + batch flush) (legacy Post Views)
- [ ] Cacher (cache service + event invalidation) (legacy Cacher)
- [ ] Lightbox (client component + sanitized image sources) (legacy Lightbox)
- [ ] Sitemap (XML generation + cron refresh) (legacy Sitemap)
- [ ] Cascade (infinite scroll feed API cursor) (legacy Cascade)
- [ ] MathJax module (conditional asset load) (legacy MathJax)
- [ ] Maptcha (math captcha for anonymous comments) (legacy MAPTCHA)

Extensibility & Theming:

- [ ] Event bus abstraction
- [ ] Module manifest + loader
- [ ] Feather manifest + registry
- [ ] Theme interface + default theme extraction (seed with parity to a legacy theme aesthetic)
- [ ] Theme switch admin UI

Operational:

- [ ] Logging middleware
- [ ] Error boundary & unified API error format
- [ ] Rate limiter
- [ ] Sitemap cron job
- [ ] View aggregation worker

Migration & Docs:

- [ ] Legacy schema reverse engineering notes
- [ ] Import script (users, posts, tags, categories, comments, view counts if present)
- [ ] Media migration tool
- [ ] Validation & verification script
- [ ] API reference generation script

Testing / Quality:

- [ ] Playwright base setup
- [ ] Axe accessibility integration
- [ ] Unit tests for RBAC & Feathers validation
- [ ] Integration tests for Post & Comment APIs

Polish:

- [ ] SEO structured data helper
- [ ] OpenGraph image generator (dynamic, optional)
- [ ] Lighthouse automation in CI

Stretch / Innovation:

- [ ] AI excerpt/title suggestion endpoint
- [ ] Realtime draft presence
- [ ] Meilisearch indexing pipeline (supersedes legacy basic search capability)

---

### 29. Glossary

- Feather: Content type definition bundling schema + rendering logic.
- Module: Behavioral extension responding to events or augmenting UI.
- ISR: Incremental Static Regeneration (Next.js revalidate mechanism).
- RBAC: Role Based Access Control.
- Payload: Feather specific JSON data stored per post.
- Legacy Parity: Guarantee that for every legacy module/feather there is an equivalent modern implementation delivering the same user-facing outcome.

---

### 30. Summary

This plan phases delivery from a stable core to rich extensibility while aligning with judging criteria: rapid setup, complete feature parity with legacy Chyrp Lite (Feathers + Modules), robustness, idiomatic Next.js + TypeScript implementation, and thorough documentation. The modular abstraction enables sustainable growth beyond the hackathon (search, AI, realtime) without compromising the lean core.

---
End of document.
