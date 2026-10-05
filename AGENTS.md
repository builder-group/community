# Project Agent Guide

## Repository Context

- This is the builder.group community monorepo for reusable packages, crates, templates, and examples
- TypeScript workspaces use pnpm and Turbo across `packages/*`, `apps/*`, `templates/*`, and `examples/**`
- Rust workspace members live under `templates/*/src-tauri`, with app-local crates alongside them
- `packages/_deprecated/*` is historical. Use active packages as the model for new work.
- Exported types, runtime behavior, README examples, and package entrypoints are public contracts
- Package catalog: [README.md](README.md#packages)

## Working Model

- Treat clarification questions as requests for explanation. Edit files only when the user asks for changes.
- Follow the task's explicit constraints. More specific package or pattern guidance takes precedence over general conventions.
- Read the matching rules below and nearby implementation for the work at hand. Do not load every reference.
- For library usage, consult the relevant README sections matching the installed dependency version. For library changes, also inspect public types, the package manifest, and nearby tests.
- Follow local patterns and keep changes focused. Avoid unrelated cleanup or migrations.

## Git

- Read-only git commands are allowed
- Do not stage, commit, create or switch branches, push, or otherwise mutate git state unless the user explicitly asks for that specific git action

## Validation

- Choose checks from the owning `package.json` or `Cargo.toml`
- Prefer focused checks such as `pnpm --filter <package> test`, `pnpm --filter <package> lint`, or `cargo test -p <crate>`. Use workspace checks for shared tooling or changes across packages.
- Do not validate routine changes with browser-driven, Playwright/Cypress-style, or manual browser e2e testing unless explicitly asked. For UI-specific tasks, ask before starting browser-based validation.
- Report checks run and relevant checks skipped

## Rules

These references capture project conventions. API details belong in package documentation.

- TypeScript, file organization, and tuple-result usage: [.agent/rules/typescript.md](.agent/rules/typescript.md)
- React components: [.agent/rules/react.md](.agent/rules/react.md)
- Application state and forms using feature libraries: [.agent/rules/state-and-forms.md](.agent/rules/state-and-forms.md)
- HTTP clients in application code: [.agent/rules/fetch-client.md](.agent/rules/fetch-client.md)
- `Cx` ownership and lifecycle: [.agent/rules/cx-pattern.md](.agent/rules/cx-pattern.md)
- Prose and comments: [.agent/rules/writing.md](.agent/rules/writing.md)
- Package READMEs: [.agent/rules/package-readme.md](.agent/rules/package-readme.md)
- Vitest tests: [.agent/rules/vitest.md](.agent/rules/vitest.md)
- Rust: [.agent/rules/rust.md](.agent/rules/rust.md)
- Swift and SwiftUI: [.agent/rules/swift.md](.agent/rules/swift.md)

## Architecture References

Consult these when changing app structure or module boundaries.

- [React app structure](docs/conventions/project-structure-react.md)
- [Hono API structure](docs/conventions/project-structure-hono.md)
- [Rust app structure](docs/conventions/project-structure-rust.md)
- [Swift app structure](docs/conventions/project-structure-swift.md)

## Workflows

- Staged pre-commit review: [.agent/commands/review.md](.agent/commands/review.md)
- Maintaining or sharing this setup: [.agent/README.md](.agent/README.md)
