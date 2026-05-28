# Project Agent Guide

Use this file first when working in this repository. It defines the default agent
workflow and points to the more specific rules and commands.

## Repository Context

- This is the builder.group community monorepo for reusable packages, crates, templates, and examples
- TypeScript workspaces are managed with pnpm and Turbo across `packages/*`, `apps/*`, `templates/*`, and `examples/**`
- Rust workspace members live under `crates/*` and `templates/*/src-tauri`
- Active TypeScript libraries live in `packages/*`; `packages/_deprecated/*` is historical and should not be used as the model for new work
- Many packages are published APIs; treat exported types, runtime behavior, README examples, and package entrypoints as public surface

## Working Defaults

- Before any code edit, read the matching rules and nearby implementation
- Before behavior, public API, or package-level changes, also read the local package README, package manifest, and nearby tests
- Prefer repository conventions and local package patterns over generic defaults
- Keep changes focused on the requested behavior; avoid unrelated cleanup or opportunistic rewrites
- Choose the most maintainable long-term solution that fits the existing codebase
- Add abstractions only when they remove real complexity, reduce meaningful duplication, or match an existing pattern
- Match surrounding style unless improving it is local, low-risk, and useful for the change
- Keep comments, docs, and explanations proportional to the code they support

## Precedence

- Follow the user request and explicit task constraints first
- Follow the git safety rules in this file unless the user explicitly asks for a specific git-mutating action
- Use command workflows from `.agent/commands/` when the user asks for that workflow
- Use package READMEs, manifests, nearby tests, and surrounding code to understand package-specific intent
- Follow all matching rules; when rules conflict, the more specific package, pattern, or framework rule wins over broader language or style rules
- If local code conflicts with the repo target standard, align the edited area when it is local and low-risk; leave broader cleanup to an explicit migration task

## Rule Usage

- Treat rules as the repo target standard for the code they cover
- Apply matching rules to new and touched code; do repo-wide cleanup only when the task explicitly calls for migration
- Read the matching rule from `.agent/rules/` before touching a covered language, library, or pattern
- Read `.agent/rules/rule-authoring.md` before creating or changing rules

## Git

- Use read-only git commands such as `git status`, `git diff`, `git log`, and `git show` when useful
- Do not stage, commit, create or switch branches, push, or otherwise mutate git state unless the user explicitly asks for that specific git action

## Validation

- Find the owning `package.json` or `Cargo.toml` for changed files before choosing validation
- Prefer focused package checks such as `pnpm --filter <package> test`, `pnpm --filter <package> lint`, or `cargo test -p <crate>` when the package exposes them
- Use Turbo filters or root `pnpm`/`cargo` commands when changes cross package boundaries or shared tooling
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

- Review staged and unstaged changes: `.agent/commands/review.md`
