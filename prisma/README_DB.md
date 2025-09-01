# NeoChyrp Database Guide

## Overview
PostgreSQL (Supabase) managed via Prisma ORM.

## First-Time Setup
1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` / `DIRECT_URL` from Supabase dashboard.
2. Install deps: `npm install`.
3. Generate client & run initial migration:
   - `npm run prisma:generate`
   - `npm run db:migrate` (creates migrations folder and applies schema)
4. Seed baseline data:
   - `npm run db:seed`

## Commands
| Use Case | Command |
|----------|---------|
| Generate Client after schema change | `npm run prisma:generate` |
| Format schema | `npm run prisma:format` |
| Create / apply dev migration | `npm run db:migrate` |
| Push (prototype without migration) | `npm run db:push` |
| Apply existing migrations in prod | `npm run db:deploy` |
| Open Prisma Studio | `npm run prisma:studio` |
| Reset database (DANGEROUS) | `npm run db:reset` |
| Seed data | `npm run db:seed` |

## Migration Strategy
- Use `db:migrate` for local iterative changes. Commit the generated `prisma/migrations/*`.
- CI/CD should run `prisma migrate deploy` against production.
- Avoid `db push` on shared environments (it is destructive / shadow DB approach) – use only in rapid prototypes.

## Seeding Notes
Seed script is idempotent for core baseline entities (owner user, groups, permissions, settings, welcome post). Extend with additional module-specific seeds by appending functions inside `seed.ts`.

## Supabase Specifics
- Supabase Auth user IDs can map to `User.id` (cuid) if you manually set; alternatively store auth UID in a separate field if required (add later).
- For RLS (Row Level Security), keep Prisma as service role or create policies matching app logic.
- Use Supabase storage for file assets; `Asset.storagePath` and `Asset.url` reference those objects.

## Performance & Indexing
Indexes intentionally added for common filters: publication status, author + publish date, category parent, comment status, asset type, expiration fields. Add partial indexes manually later if needed (e.g., only published posts) via SQL migrations.

## Backups & Safety
- Supabase provides automated backups; verify retention meets requirements.
- Before destructive resets in staging/prod, snapshot the DB.

## Next Steps
- Integrate NextAuth or Supabase Auth adapters.
- Implement RLS & fine-grained permission checks.
- Add background job for sitemap regeneration updating `SitemapState`.
- Add search vector column (PostgreSQL tsvector) in a future migration for full-text search.

---
Questions or changes: update schema, run generate, create migration, seed.
