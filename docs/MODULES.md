## Modules Overview (Placeholders)

| Module | Status | Primary Events | Notes |
|--------|--------|----------------|-------|
| comments | scaffold | PostDeleted | Moderation, threading |
| likes | scaffold | LikeAdded/Removed | Simple toggle |
| views | scaffold | ViewRegistered | Deduplicate per session/IP hash |
| tags | scaffold | (none) | Filtering, trending later |
| categories | scaffold | (none) | Hierarchical taxonomy |
| cacher | scaffold | PostUpdated | Add TTL/invalidation logic |
| webmentions | scaffold | PostPublished | Inbound & outbound mentions |
| read_more | scaffold | PostPublished | Excerpt generation |
| rights | scaffold | (none) | Licensing metadata |
| cascade | scaffold | (none) | Infinite scroll API metadata |
| lightbox | scaffold | (none) | Client asset provider |
| sitemap | scaffold | PostPublished/Updated | Debounced regeneration |
| maptcha | scaffold | CommentCreated | Math challenge anti-spam |
| highlighter | scaffold | PostPublished | Markup code blocks pre-render |
| easy_embed | scaffold | PostPublished | oEmbed/OpenGraph expansion |
| mathjax | scaffold | PostPublished | Render math spans |

### Inter-Module Communication
All communication should occur through events or explicit application service interfaces, never by reaching into another module's internal folders.

### Enabling/Disabling Modules
Future enhancement: a configuration file or DB table listing enabled modules; `registerAllModules()` would conditionally include them.
