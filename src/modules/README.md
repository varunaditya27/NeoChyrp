This directory houses modular, domain-driven feature packages.

Guiding principles:
1. Vertical slices: Each feature owns its domain (schema contracts, domain logic, UI widgets) where reasonable.
2. Public surface: An index.ts inside each feature re-exports stable, testable contracts (no deep imports from consumers).
3. Isolation: Cross-feature interaction via events or service abstractions (avoid brittle circular deps).

Sub-folders (pattern):
- domain/ : Entities, value objects, domain events, invariants.
- application/ : Command & query handlers (CQRS-lite), orchestrating domain + infra.
- infrastructure/ : DB mappers, external service gateways.
- ui/ : Components specific to the feature (server/client as needed).
- api/ : Route handlers (optionally colocated when strongly bound to feature).
