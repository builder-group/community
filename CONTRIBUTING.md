# Contributing

Thanks for improving Builder Group Community. This repository contains public packages, templates, and examples from [builder.group](https://builder.group) projects.

Keep contributions focused. A small fix with tests and clear docs is easier to review than a broad cleanup mixed with behavior changes.

If you are an agent, read `AGENTS.md` first. When you touch a package, also read the matching rule in `.agent/rules/`.

## Code of Conduct

Please read and follow the [Code of Conduct](https://code.fb.com/codeofconduct).

## Local Setup

Requirements:

- Node.js 24 or newer
- pnpm 10.33.2

Install dependencies and build the workspace:

```bash
pnpm install
pnpm build
```

## Commands

- `pnpm build`: build every workspace through Turbo
- `pnpm test`: run tests across the workspace
- `pnpm lint`: run ESLint across the workspace
- `pnpm format`: format TypeScript, JavaScript, JSON, and Markdown files
- `pnpm build:packages`: build publishable packages
- `pnpm --filter <workspace> test`: run a command for one package or example

Example:

```bash
pnpm --filter feature-state test
```

## Contribution Guidelines

- Prefer existing package patterns over new conventions
- Keep behavior changes, docs changes, and formatting-only changes separate when possible
- Add or update tests when runtime behavior changes
- Update examples when a public API change affects how users should integrate a package
- Avoid touching `packages/_deprecated` unless you are fixing existing users, metadata, or historical docs
- Use direct, short prose. Avoid filler, hedging, and long explanations where a concrete example works better.

## Package Changes

Active packages live in `packages/`. Deprecated packages live in `packages/_deprecated/`.

For publishable packages:

- Keep `description` short, concrete, and aligned with the README
- Keep `keywords` focused on what users search for
- Keep entry fields such as `main`, `module`, `source`, `types`, `exports`, and `files` aligned with the package output
- Keep peer dependencies explicit when consumers must provide them

## README Changes

Package READMEs should help a new user decide and start quickly:

- Explain what the package is and why to use it at the top of the README
- Show a short, realistic example before deep API details
- Use `## Install`, `## Usage`, package-specific sections, and `## FAQ` when they fit
- Prefer value and workflow over listing every exported API in order
- Keep examples copyable and formatted with two-space indentation

For repository docs, follow the writing style in `.agent/rules/writing.md`. For package READMEs, also follow `.agent/rules/package-readme.md`.

## Pull Requests

Before opening a pull request:

- Run the relevant tests or explain why you did not
- Run `pnpm format` for docs or formatting changes
- Update package metadata when the README changes the public positioning
- Include enough context for reviewers to understand the problem, the fix, and the verification

## License

By contributing to Builder Group Community, you agree that your contributions will be licensed under the license in [`LICENSE.md`](./LICENSE.md).
