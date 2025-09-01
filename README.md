# NeoChyrp App (Modern Chyrp Rebuild)

Modern, modular reimplementation of the classic Chyrp blogging engine using:

- Next.js 15 (App Router, Server Components)
- TypeScript (strict)
- Tailwind CSS (utility-first design system)
- Prisma ORM (PostgreSQL via Supabase)
- Supabase (Auth, DB hosting, optional storage & realtime)

## Vision
Recreate Chyrp's lightweight, feather-based extensibility with a contemporary stack that embraces:
1. Composability (feature modules encapsulate their domain)
2. Performance (server components, edge-friendly APIs later)
3. Extensibility (clear domain boundaries + event-driven modules)
4. Developer ergonomics (type safety, consistent conventions)

## High-Level Feature Mapping
| Legacy Concept | Modern Equivalent |
|----------------|------------------|
| Feathers (text/photo/etc.) | `FeatherType` enum + `featherData` JSON + discriminated union types |
| Modules (comments, likes) | Dedicated module directories with domain/application layers |
| Themes | Tailwind + theming tokens + future theme pack directory |
| Caching | Layered: rendered HTML cache field + future Redis/edge cache | 

## Directory Structure
```
neo-chyrp-app/
  prisma/            # Database schema + migrations + seed
  src/
    app/             # Next.js App Router routes (RSC)
    components/      # Shared presentational components (UI primitives, layout)
    lib/             # Cross-cutting infrastructure (db, config, logger, auth)
    modules/         # Feature modules (domain/application/infrastructure/ui)
    styles/          # Global CSS & design tokens
```

### Modules Pattern
Each module (e.g., content, comments, likes) contains:
- `domain/` entities, value objects, events
- `application/` commands & queries orchestrating domain logic
- `infrastructure/` persistence and external service adapters
- `ui/` feature-specific components
- `api/` optional route handlers (colocated when feature-specific)

### Removing Legacy Coupling
The original PHP codebase (`chyrp-lite-2025.02/`) remains for reference only. New implementation avoids porting line-by-line and instead re-expresses concepts with modern primitives.

## Environment Setup
1. Copy `.env.example` to `.env` and fill values (Supabase project credentials, DB URLs).
2. Install dependencies and run migrations.
3. Seed baseline data (owner user, permissions, welcome post).

### Core Commands
```bash
# install deps
npm install

# validate & generate Prisma client
npm run prisma:validate
npm run prisma:generate

# create/apply dev migration (writes to prisma/migrations)
npm run db:migrate

# seed baseline data (idempotent)
npm run db:seed

# start dev server
npm run dev
```

See `prisma/README_DB.md` for full database workflow details.

### One-Command Bootstrap

Cross-platform helper scripts in `scripts/` perform install, validate, generate, migrate, seed, then start dev.

Usage examples:

```bash
# macOS/Linux (bash/zsh)
./scripts/start.sh           # full cycle
./scripts/start.sh --fast    # skip install/validate/migrate (just dev if already set up)
./scripts/start.sh --no-seed # skip seeding

# Windows PowerShell
pwsh ./scripts/start.ps1
pwsh ./scripts/start.ps1 -Fast -NoSeed

# Windows cmd.exe
scripts\\start.cmd
scripts\\start.cmd --fast --no-seed
```

Flags:

- `--fast` / `-Fast`: skip dependency install & prisma validation/migration.
- `--no-seed` / `-NoSeed`: skip executing the idempotent seed.

 
## Prisma Model Notes

- `Post.featherData` stores flexible JSON per feather type.
- `renderedBody` caches transformation (markdown -> HTML) for faster listing & `read_more` truncation.
- Future tables (rights, sitemap) can be appended incrementally without breaking existing layers.

 
## Next Steps (Suggested Roadmap)

1. Implement authentication (Supabase Auth or NextAuth adapter with Prisma).
2. Slug generation + validation (unique per post, fallback to cuid snippet).
3. Markdown rendering pipeline with sanitization & syntax highlighting.
4. Comments module domain + CRUD API + moderation queues.
5. Likes & views events (debounced, privacy-aware).
6. Tag & category management UI + filtering on blog index.
7. Webmention receiving endpoint & verification workflow.
8. Caching strategy (ETags + incremental static regen for public pages).
9. Theme system (CSS variables per theme, runtime switcher).
10. Sitemap & robots generation.

 
## Conventions

- Path aliases use absolute imports from project root (`@/src/...`).
- All cross-module consumption through each module's published exports (avoid deep linking into internal folders).
- Server actions / route handlers encapsulate validation (zod) before calling application layer.

 
## Database & Migrations

Database schema lives in `prisma/schema.prisma`; migration history is committed in `prisma/migrations/`. Use `npm run db:migrate` locally and `npm run db:deploy` in CI/production. Seed script: `prisma/seed.ts` (TypeScript only, idempotent baseline).

 
## License

Pending (align with original Chyrp Lite license if derivative aspects apply; otherwise MIT recommended). Add a NOTICE if reusing assets.

---
Scaffold only: Implementation details intentionally stubbed with comments to guide development.
