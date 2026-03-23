# Stack Matrix

CLI commands, default tooling, and configuration for each supported stack. Read the relevant section based on the interview decisions.

## Table of Contents
- [TypeScript + Next.js](#typescript--nextjs)
- [TypeScript + Vite (React)](#typescript--vite-react)
- [TypeScript + Vite (Vue)](#typescript--vite-vue)
- [TypeScript + Hono](#typescript--hono)
- [TypeScript + Express](#typescript--express)
- [Python + FastAPI](#python--fastapi)
- [Python + Django](#python--django)
- [Python + CLI (Typer)](#python--cli-typer)
- [Rust + Axum](#rust--axum)
- [Rust + CLI (clap)](#rust--cli-clap)
- [Go + Standard Library](#go--standard-library)
- [Go + Gin](#go--gin)
- [Monorepo (Turborepo)](#monorepo-turborepo)

---

## TypeScript + Next.js

### Scaffold CLI
```bash
# With bun
bunx create-next-app@latest <name> --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# With pnpm
pnpm create next-app@latest <name> --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# With npm
npx create-next-app@latest <name> --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Adjust flags:
- Remove `--tailwind` if not using Tailwind
- Remove `--eslint` if using Biome instead
- Add `--turbopack` for Turbopack dev server

### Common additional deps
| Category | Packages |
|----------|----------|
| ORM | `drizzle-orm`, `drizzle-kit`, `pg` or `@neondatabase/serverless` |
| Validation | `zod` or `@effect/schema` + `effect` |
| Auth | `better-auth` or `next-auth` |
| State/fetching | `swr` or `@tanstack/react-query` |
| UI | `@shadcn/ui` (via `bunx shadcn@latest init`) |
| Email | `resend`, `react-email`, `@react-email/components` |
| Effect | `effect`, `@effect/schema`, `@effect/platform` |

### Default linter/formatter
- **Biome**: `bun add -D @biomejs/biome && bunx biome init`
- **ESLint + Prettier**: included via `--eslint` flag; add Prettier: `bun add -D prettier eslint-config-prettier`

### Default test runner
- **Vitest**: `bun add -D vitest @vitejs/plugin-react` + create `vitest.config.ts`

### Package.json scripts
```json
{
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "biome check --write .",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

---

## TypeScript + Vite (React)

### Scaffold CLI
```bash
bunx create-vite@latest <name> --template react-ts
# or: pnpm create vite@latest <name> --template react-ts
# or: npm create vite@latest <name> -- --template react-ts
```

### Common additional deps
| Category | Packages |
|----------|----------|
| Router | `react-router` or `@tanstack/react-router` |
| State | `zustand` or `@tanstack/react-query` |
| Validation | `zod` or `valibot` |
| UI | `@shadcn/ui` (via `bunx shadcn@latest init`) |
| CSS | `tailwindcss @tailwindcss/vite` |

### Default linter/formatter
- **Biome**: `bun add -D @biomejs/biome && bunx biome init`

### Default test runner
- **Vitest**: already a Vite project, just `bun add -D vitest @testing-library/react @testing-library/jest-dom jsdom`

---

## TypeScript + Vite (Vue)

### Scaffold CLI
```bash
bunx create-vite@latest <name> --template vue-ts
```

### Common additional deps
| Category | Packages |
|----------|----------|
| Router | `vue-router` |
| State | `pinia` |
| Validation | `zod` or `valibot` |
| CSS | `tailwindcss @tailwindcss/vite` |

---

## TypeScript + Hono

### Scaffold CLI
```bash
bunx create-hono@latest <name>
# Select the target runtime when prompted (bun, node, cloudflare-workers, etc.)
```

### Common additional deps
| Category | Packages |
|----------|----------|
| ORM | `drizzle-orm`, `drizzle-kit` |
| Validation | `zod` (Hono has built-in Zod integration via `@hono/zod-validator`) |
| Auth | `better-auth` |
| OpenAPI | `@hono/zod-openapi` |

---

## TypeScript + Express

### Scaffold
No official CLI. Create manually:
```bash
mkdir <name> && cd <name>
bun init -y  # or npm init -y
bun add express
bun add -D @types/express typescript tsx
```

### Common additional deps
| Category | Packages |
|----------|----------|
| ORM | `drizzle-orm`, `drizzle-kit` |
| Validation | `zod` |
| Auth | `better-auth` or `passport` |

---

## Python + FastAPI

### Scaffold
```bash
uv init <name>
cd <name>
uv add fastapi uvicorn[standard]
```

Or with pip:
```bash
mkdir <name> && cd <name>
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn[standard]
```

### Common additional deps
| Category | Packages |
|----------|----------|
| ORM | `sqlalchemy`, `alembic` |
| Validation | built-in (Pydantic, included with FastAPI) |
| Auth | `python-jose`, `passlib[bcrypt]`, `python-multipart` |
| Testing | `pytest`, `httpx` (for async test client) |
| DB driver | `asyncpg` (Postgres), `aiosqlite` (SQLite) |

### Default linter/formatter
- **Ruff**: `uv add --dev ruff` + `ruff.toml`

### Default test runner
- **Pytest**: `uv add --dev pytest pytest-asyncio httpx`

### pyproject.toml scripts
```toml
[project.scripts]
dev = "uvicorn app.main:app --reload"

[tool.ruff]
line-length = 88
```

---

## Python + Django

### Scaffold
```bash
uv init <name>
cd <name>
uv add django
uv run django-admin startproject config .
```

### Common additional deps
| Category | Packages |
|----------|----------|
| REST | `djangorestframework` |
| Auth | `django-allauth` |
| DB | `psycopg[binary]` (Postgres) |
| Testing | `pytest-django` |

---

## Python + CLI (Typer)

### Scaffold
```bash
uv init <name>
cd <name>
uv add typer[all]
```

### Common additional deps
| Category | Packages |
|----------|----------|
| Config | `pydantic-settings` |
| HTTP | `httpx` |
| Rich output | `rich` (included with typer[all]) |

---

## Rust + Axum

### Scaffold
```bash
cargo init <name>
cd <name>
cargo add axum tokio --features tokio/full
cargo add serde --features derive
cargo add serde_json
```

### Common additional deps
| Category | Packages |
|----------|----------|
| ORM | `sqlx` with `--features postgres,runtime-tokio` |
| Auth | `axum-extra` (for cookie/header extraction), `jsonwebtoken` |
| Config | `dotenvy`, `config` |
| Tracing | `tracing`, `tracing-subscriber` |

### Default linter/formatter
- **rustfmt**: built-in (`cargo fmt`)
- **clippy**: built-in (`cargo clippy`)

### Default test runner
- Built-in: `cargo test`

---

## Rust + CLI (clap)

### Scaffold
```bash
cargo init <name>
cd <name>
cargo add clap --features derive
```

### Common additional deps
| Category | Packages |
|----------|----------|
| Config | `serde`, `toml` or `serde_json` |
| HTTP | `reqwest --features json` |
| Output | `colored`, `indicatif` (progress bars) |

---

## Go + Standard Library

### Scaffold
```bash
mkdir <name> && cd <name>
go mod init <module-path>
```

Create `main.go` manually. Go's standard library `net/http` (with Go 1.22+ routing) is often sufficient.

### Default linter/formatter
- **gofmt**: built-in
- **golangci-lint**: `go install github.com/golangci-lint/golangci-lint/cmd/golangci-lint@latest`

### Default test runner
- Built-in: `go test ./...`

---

## Go + Gin

### Scaffold
```bash
mkdir <name> && cd <name>
go mod init <module-path>
go get -u github.com/gin-gonic/gin
```

---

## Monorepo (Turborepo)

### Scaffold CLI
```bash
bunx create-turbo@latest <name>
# or: npx create-turbo@latest <name>
# or: pnpm dlx create-turbo@latest <name>
```

This creates a monorepo with `apps/` and `packages/` directories, shared configs, and Turborepo pipeline.

### Post-scaffold
After the base monorepo is created, scaffold individual apps within it using the relevant CLI from above:
```bash
cd <name>/apps
bunx create-next-app@latest web --typescript --tailwind --app --src-dir
```

### Common workspace packages
- `packages/ui` — shared component library
- `packages/config-typescript` — shared tsconfig
- `packages/config-biome` — shared biome config
- `packages/db` — shared database schema and client

### Workspace config
Turborepo uses `turbo.json` for pipeline definitions. The scaffold CLI sets this up, but you may need to add custom tasks:
```json
{
  "tasks": {
    "build": { "dependsOn": ["^build"] },
    "dev": { "persistent": true },
    "lint": {},
    "test": {}
  }
}
```
