# Frontend Architecture

This frontend uses a feature-oriented structure on top of the Next.js App Router.

## Directory guide

- `app/`: route entrypoints, layouts, and page-level composition.
- `features/`: business capabilities grouped by domain.
- `shared/components/`: cross-feature components that are not tied to a single domain.
- `components/ui/`: low-level presentational UI building blocks.
- `lib/`: framework-agnostic utilities and shared helpers, including the base API client.
- `stores/`: global client state.
- `hooks/`: cross-feature hooks that are not specific to one business domain.

## Feature folder convention

Each feature should keep its own files close together when possible:

- `components/`: domain-specific UI
- `services/`: API access and feature-specific data functions
- `hooks/`: feature-only hooks

## Practical rules

- Put new product functionality in `features/<domain>`.
- Keep `app/` thin. Pages should mostly compose feature components and perform route-level fetching.
- Only place a component in `shared/components/` if it is reused across multiple features.
- Keep `components/ui/` free of business logic.
- Keep API resource files inside their owning feature. Shared networking primitives belong in `lib/`.
- Promote code into `lib/` only when it is genuinely cross-feature and domain-neutral.
