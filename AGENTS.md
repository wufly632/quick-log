# Repository Guidelines

## Project Structure & Module Organization
- `query-service/`: Actix Web backend. `src/main.rs` bootstraps HTTP services while feature code lives in `handlers/`, `services/`, and `models/`. Runtime configuration is stored in `config/config.yaml`, with Elasticsearch index mappings in `logs-index.yaml`.
- `web-ui/`: React + Vite client. UI logic is organized under `src/api`, `src/components`, `src/pages`, and shared styles in `src/styles`. Static output is emitted to `dist/`.
- Root assets include `docker-compose.yml` for local orchestration and `docker`-ready files in each subproject. Keep build artifacts such as `query-service/target/` and `web-ui/dist/` out of commits.

## Build, Test, and Development Commands
- `cd query-service && cargo run` — launch the backend with environment variables from `.env` when present.
- `cargo fmt` / `cargo fmt --check` — format Rust code before pushing.
- `cargo test` — execute backend unit and integration tests.
- `cd web-ui && pnpm install` — install JavaScript dependencies (mirrors `pnpm-lock.yaml`).
- `pnpm dev` — start the Vite dev server on port 5173 with API proxying to `localhost:8080`.
- `pnpm build` — create a production bundle in `web-ui/dist/` for nginx.
- `pnpm lint` — enforce ESLint rules; resolve all warnings before submitting.
- `docker-compose up --build` — rebuild images and run the full stack for smoke testing.

## Coding Style & Naming Conventions
- Rust: rely on default `rustfmt` (4-space indent). Modules and files use `snake_case`, types use `PascalCase`, and functions stay `snake_case`. Prefer `log::` macros with structured context from `services/`.
- JavaScript/React: prefer functional components with `PascalCase` filenames (e.g., `SearchBar.jsx`) and camelCase hooks/utilities. Centralize shared styles in `src/styles` and re-export API helpers from `src/api/index.js` when adding new endpoints.

## Testing Guidelines
- Backend: colocate `#[cfg(test)]` modules beside the code under test (notably in `services/`). Use `actix_web::test` utilities for handler coverage and target ≥80% coverage on new logic. Run `cargo test` before every PR.
- Frontend: automated tests are not yet scaffolded; when adding them, use `vitest` with `@testing-library/react` and mirror component filenames. For now, document manual verification steps in PRs (critical paths: search workflow, filter toggles, result pagination).

## Commit & Pull Request Guidelines
- Commits: write imperative, concise subjects (≤72 chars) and optionally scope by area, e.g., `web-ui: add log table pagination` or `query-service: harden search error path`. Squash fixups before merging.
- Pull Requests: provide a summary, linked issues, local test checklist, and screenshots or cURL samples when UI or API responses change. Confirm formatting (`cargo fmt`, `pnpm lint`) and tests (`cargo test`) pass. Request review from owners of the affected service or UI.

## Environment & Configuration Tips
- Backend settings come from `config/config.yaml` plus environment overrides (`QUERY_SERVICE__*`). Avoid committing real credentials; share `.env.example` updates when introducing new keys.
- Frontend API routes read `VITE_API_BASE_URL`; update `.env` and the deployment manifests (`nginx.conf`, `docker-compose.yml`) together. Keep `logs-index.yaml` aligned with backend expectations when adjusting log schemas.
