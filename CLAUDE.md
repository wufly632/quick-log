# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quick-Log is a distributed log query platform that provides fast, scalable log search capabilities. The system consists of three main components:

1. **Frontend** (web-ui): React 18 SPA with Ant Design 5 for the user interface
2. **Backend** (query-service): Rust + Actix Web API service that queries the search engine
3. **Search Engine**: Quickwit (Rust-based search engine) for log indexing and retrieval

## Architecture

The application follows a clean separation of concerns:

- **web-ui/** - React client that communicates with the query-service via REST APIs
- **query-service/** - Actix Web HTTP server that proxies requests to Quickwit search engine
- **docker-compose.yml** - Orchestrates the full stack (web-ui + query-service + Quickwit)

The Quickwit index is configured in `query-service/logs-index.yaml` and stores logs with fields: timestamp, message, level, service, host, env, and trace_id.

## Common Commands

### Backend (Rust)
```bash
cd query-service
cargo run              # Start development server
cargo fmt              # Format code before committing
cargo test             # Run all tests (aim for ≥80% coverage)
```

### Frontend (React)
```bash
cd web-ui
pnpm install           # Install dependencies
pnpm dev               # Start Vite dev server (port 3000)
pnpm build             # Create production bundle in dist/
pnpm lint              # Check code quality
```

### Full Stack
```bash
docker-compose up --build   # Build and run all services together
```

The Vite dev server proxies API requests to `http://localhost:8080` (query-service).

## Key Configuration

**Backend**: `query-service/config/config.yaml` defines server settings and Quickwit connection. Override with environment variables using `QUERY_SERVICE__*` format (double underscore for nested keys).

**Frontend**: `web-ui/.env` sets `VITE_API_BASE_URL` for API endpoint.

**Search Index**: `query-service/logs-index.yaml` defines the Quickwit schema. Keep this in sync with any backend model changes.

## API Endpoints

The query-service exposes these endpoints:
- `GET /health` - Health check
- `POST /api/v1/search` - Execute log searches
- `GET /api/v1/fields` - List available fields
- `GET /api/v1/services` - List all services

## Development Patterns

### Backend (query-service)
- **Structure**: `handlers/` (HTTP handlers), `services/` (business logic), `models/` (data models), `config.rs` (configuration loading)
- **Error handling**: Errors are defined in `error.rs` with appropriate HTTP status codes
- **Quickwit client**: Created in `main.rs` and shared with handlers via application state

### Frontend (web-ui)
- **Structure**: `src/api/` (API client), `src/components/` (reusable components), `src/pages/` (page components)
- **API client**: Axios-based helper in `src/api/search.js` with request/response interceptors
- **Main components**: SearchBar, FilterPanel, and LogTable in `src/pages/Search/`

## CI/CD

GitHub Actions workflow (`.github/workflows/docker-images.yml`) automatically:
- Builds Docker images for both frontend and backend on pushes to main, version tags (v*), and PRs
- Pushes to Docker Hub (wufly632/quick-log-backend, wufly632/quick-log-frontend)
- Uses Docker Buildx with layer caching for faster builds

## Docker Image Structure

- **Backend**: Multi-stage Rust build (rust:alpine → alpine) in `query-service/Dockerfile`
- **Frontend**: Node build (node:18-alpine → nginx:alpine) in `web-ui/Dockerfile`

## See Also

For detailed development guidelines including coding standards, testing requirements, and PR processes, see `AGENTS.md`.