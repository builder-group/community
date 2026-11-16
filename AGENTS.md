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
- Commit messages: `<package or area>: <lowercase summary>`, adding ` (#<issue>)` when the work belongs to an issue, e.g. `openapi-ts-router: fix path templates for express and hono (#125)`

## Pull Requests

- Open a pull request only when the user asks for one
- Title: the commit message format. Put `Resolves #<issue>` in the description when the PR closes an issue.
- Description: the problem in a sentence or two, the fix, and the checks run
- UI changes need before and after screenshots, and motion or timing changes need a short recording. Save them outside the repository, never commit them, and say where they are so they can be attached.
- One request is one pull request

## Validation

- Choose checks from the owning `package.json` or `Cargo.toml`
- Prefer focused checks such as `pnpm --filter <package> test`, `pnpm --filter <package> lint`, or `cargo test -p <crate>`. Use workspace checks for shared tooling or changes across packages.
- Do not validate routine changes with browser-driven, Playwright/Cypress-style, or manual browser e2e testing unless explicitly asked. For UI-specific tasks, ask before starting browser-based validation.
- Report checks run and relevant checks skipped

## Rules

These references capture project conventions. API details belong in package documentation.

- TypeScript, file organization, and tuple-result usage: [.agents/rules/typescript.md](.agents/rules/typescript.md)
- React components: [.agents/rules/react.md](.agents/rules/react.md)
- Application state and forms using feature libraries: [.agents/rules/state-and-forms.md](.agents/rules/state-and-forms.md)
- HTTP clients in application code: [.agents/rules/fetch-client.md](.agents/rules/fetch-client.md)
- `Cx` ownership and lifecycle: [.agents/rules/cx-pattern.md](.agents/rules/cx-pattern.md)
- Prose and comments: [.agents/rules/writing.md](.agents/rules/writing.md)
- Package READMEs: [.agents/rules/package-readme.md](.agents/rules/package-readme.md)
- Vitest tests: [.agents/rules/vitest.md](.agents/rules/vitest.md)
- Rust: [.agents/rules/rust.md](.agents/rules/rust.md)
- Swift and SwiftUI: [.agents/rules/swift.md](.agents/rules/swift.md)

## Architecture References

Consult these when changing app structure or module boundaries.

- [React app structure](docs/conventions/project-structure-react.md)
- [Hono API structure](docs/conventions/project-structure-hono.md)
- [Rust app structure](docs/conventions/project-structure-rust.md)
- [Swift app structure](docs/conventions/project-structure-swift.md)

## Workflows

- Staged pre-commit review: [.agents/commands/review.md](.agents/commands/review.md)
- Orchestrating a task through sub-agents: [.agents/commands/orchestrate.md](.agents/commands/orchestrate.md)
- Maintaining or sharing this setup: [.agents/README.md](.agents/README.md)
