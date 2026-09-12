# Project Agent Guide

Use this file first when working in this repository. It defines the default agent workflow and points to the more specific rules and commands.

## Repository Context

- This is the builder.group community monorepo for reusable packages, crates, templates, and examples
- TypeScript workspaces are managed with pnpm and Turbo across `packages/*`, `apps/*`, `templates/*`, and `examples/**`
- Rust workspace members live under `templates/*/src-tauri`, with app-local crates alongside them
- Active TypeScript libraries live in `packages/*`; `packages/_deprecated/*` is historical and should not be used as the model for new work
- Many packages are published APIs. Treat exported types, runtime behavior, README examples, and package entrypoints as public surface.

## Working Model

- Follow the user request and explicit task constraints first
- If a rule appears to conflict with the user's explicit request or clearly implied task goal, follow the user. Mention meaningful conflicts briefly so the rule can be improved.
- Before editing, read the matching rule from `.agent/rules/` and the nearby implementation
- Before behavior, public API, or package-level changes, read the local package README, package manifest, and nearby tests
- Prefer repository conventions and local package patterns over generic defaults
- Keep changes focused on the requested behavior. Do not do unrelated cleanup or opportunistic rewrites.
- Match surrounding style unless a local, low-risk improvement makes the edited code clearer
- Add abstractions only when they remove real complexity, reduce meaningful duplication, or match an existing pattern
- Write comments, docs, and explanations for future maintainers rather than the current session
- Treat matching rules as the target standard for new and touched code. If rules conflict, the more specific package, pattern, or framework rule wins.
- Do repo-wide cleanup only when the task explicitly calls for migration

## Git

- Use read-only git commands such as `git status`, `git diff`, `git log`, and `git show` when useful
- Do not stage, commit, create or switch branches, push, or otherwise mutate git state unless the user explicitly asks for that specific git action

## Validation

- Find the owning `package.json` or `Cargo.toml` for changed files before choosing validation
- Prefer focused package checks such as `pnpm --filter <package> test`, `pnpm --filter <package> lint`, or `cargo test -p <crate>` when the package exposes them
- Use Turbo filters or root `pnpm`/`cargo` commands when changes cross package boundaries or shared tooling
- Do not validate routine changes with browser-driven, Playwright/Cypress-style, or manual browser e2e testing unless explicitly asked. For UI-specific tasks, ask before starting a browser-based validation workflow.
- Report the checks you ran, and say clearly when a relevant check was skipped

## Rule Map

Use the closest matching rule for the file or behavior you are changing.

- TypeScript and TSX: `.agent/rules/typescript.md`
- React and TSX components: `.agent/rules/react.md`
- `feature-state` and `feature-react/state`: `.agent/rules/feature-state.md`
- `feature-react` bindings and forms: `.agent/rules/feature-react.md`
- `*Cx.ts` feature context pattern: `.agent/rules/cx-pattern.md`
- General code style: `.agent/rules/style-guide.md`
- Comments: `.agent/rules/comments.md`
- Writing style (prose, READMEs, commit messages): `.agent/rules/writing.md`
- Package READMEs: `.agent/rules/package-readme.md`
- `tuple-result`: `.agent/rules/tuple-result.md`
- Vitest tests: `.agent/rules/vitest.md`
- `feature-fetch`: `.agent/rules/feature-fetch.md`
- Rust: `.agent/rules/rust.md`
- Swift and SwiftUI: `.agent/rules/swift.md`
- Writing and updating rules: `.agent/rules/rule-authoring.md`
- `xml-tokenizer`: `.agent/rules/xml-tokenizer.md`

## Commands

Commands are reusable workflows. Use them when the user asks for that workflow.

- Review staged changes before committing: `.agent/commands/review.md`
